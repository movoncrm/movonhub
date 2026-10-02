import { getStore } from "@/lib/db";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * In-memory fixed-window limiter. Per-isolate and best-effort only; used as a
 * fallback when no durable backend is configured. In production the Supabase
 * adapter provides a cross-instance limiter via `consume_rate_limit`.
 */
export function memoryRateLimit(key: string, limit = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/** Resolve the real client IP, preferring Cloudflare's authoritative header. */
export function clientIp(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip") ||
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export function clientKey(request: Request, scope: string): string {
  return `${scope}:${clientIp(request.headers)}`;
}

/**
 * Consume one unit from a named limit. Prefers the durable store backend and
 * falls back to the in-memory limiter if that is unavailable.
 */
export async function consumeLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  try {
    return await getStore().consumeRateLimit(key, limit, windowSeconds);
  } catch (error) {
    console.error("[rate-limit] durable backend unavailable, using memory limiter", error instanceof Error ? error.message : error);
    return memoryRateLimit(key, limit, windowSeconds * 1000);
  }
}

/** Convenience wrapper for route handlers that have the incoming Request. */
export async function limitRequest(
  request: Request,
  scope: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  return consumeLimit(clientKey(request, scope), limit, windowSeconds);
}
