/**
 * Safe object key generation and validation.
 *
 * User-supplied filenames are NEVER used verbatim as storage paths. Keys are
 * built from sanitised segments plus a random suffix so that uploads cannot
 * escape their prefix (path traversal) or collide.
 */

const SAFE_SEGMENT_RE = /^[a-z0-9]+(?:[_-][a-z0-9]+)*$/;
const MAX_SEGMENT = 64;

export function safeSegment(input: string, fallback = "asset"): string {
  const cleaned = String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, MAX_SEGMENT)
    .replace(/[-_]+$/g, "");
  return cleaned && SAFE_SEGMENT_RE.test(cleaned) ? cleaned : fallback;
}

export function randomSuffix(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID().replace(/-/g, "").slice(0, 10);
  const rand = Math.random().toString(36).slice(2, 12);
  return (rand + Date.now().toString(36)).slice(0, 10);
}

/** Builds `products/{productSegment}/{descriptor}-{suffix}.{ext}`. */
export function productImageKey(
  productId: string,
  descriptor: string,
  extension: string,
  suffix: string = randomSuffix(),
): string {
  const product = safeSegment(productId, "product");
  const name = safeSegment(descriptor, "image").slice(0, 48).replace(/-+$/g, "") || "image";
  const ext = safeSegment(extension, "bin").replace(/-/g, "") || "bin";
  return `products/${product}/${name}-${suffix}.${ext}`;
}

/**
 * Strict allow-list for asset keys: lower-case alphanumerics, `/`, `.`, `-`, `_`,
 * no leading slash, no `..`, no backslashes. Prevents traversal and arbitrary
 * object access.
 */
export function isSafeAssetKey(key: string): boolean {
  if (!key || key.length > 300) return false;
  if (key.startsWith("/") || key.includes("\\") || key.includes("..")) return false;
  if (key.includes("//")) return false;
  return /^[a-z0-9][a-z0-9/._-]*$/.test(key);
}

/** Returns the object key for a full public asset URL under `baseUrl`. */
export function keyFromAssetUrl(url: string, baseUrl: string): string | null {
  if (!url || !baseUrl) return null;
  const trimmedBase = baseUrl.replace(/\/+$/, "");
  if (!url.startsWith(`${trimmedBase}/`)) return null;
  const key = url.slice(trimmedBase.length + 1).split("?")[0].split("#")[0];
  return isSafeAssetKey(key) ? key : null;
}
