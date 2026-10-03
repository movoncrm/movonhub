import { ASSETS_BINDING } from "./config";

/**
 * Cloudflare R2 access for the asset service.
 *
 * The R2 binding is resolved lazily through the OpenNext Cloudflare context so
 * that `next dev` / Node environments without a Worker binding do not crash.
 * No R2 credentials are ever exposed to the browser; uploads run server-side.
 */

export interface R2BucketLike {
  put(
    key: string,
    value: ArrayBuffer | Uint8Array,
    options?: {
      httpMetadata?: { contentType?: string; cacheControl?: string; cacheControlImmutable?: boolean };
    },
  ): Promise<unknown>;
  delete(key: string | string[]): Promise<void>;
  head(key: string): Promise<unknown>;
}

export async function getR2Bucket(): Promise<R2BucketLike | null> {
  try {
    const mod = await import("@opennextjs/cloudflare");
    const ctx = await mod.getCloudflareContext({ async: true });
    const env = ctx.env as unknown as Record<string, unknown>;
    const bucket = env[ASSETS_BINDING];
    return bucket && typeof (bucket as R2BucketLike).put === "function"
      ? (bucket as R2BucketLike)
      : null;
  } catch {
    return null;
  }
}
