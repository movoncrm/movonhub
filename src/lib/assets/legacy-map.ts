import manifest from "./product-image-manifest.json";

/**
 * Read-time mapping from legacy MOVON image sources (`movon.com.my` hot-links)
 * to MOVONHUB R2 object keys. Resolving at read time means product rows that
 * have not yet been migrated in Supabase still render from MOVONHUB storage
 * instead of hot-linking the source.
 */

export interface ManifestImage {
  productId: string;
  productSlug: string;
  sourceUrl: string;
  key: string;
  status: string;
}

export const PRODUCT_IMAGE_MANIFEST: ManifestImage[] = manifest.images as ManifestImage[];

export function normalizeSourceUrl(url: string): string {
  const raw = String(url || "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    parsed.hash = "";
    parsed.search = "";
    parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
    return parsed.toString();
  } catch {
    return raw;
  }
}

const keyBySource = new Map<string, string>();
const keyByProduct = new Map<string, string>();
for (const image of PRODUCT_IMAGE_MANIFEST) {
  keyBySource.set(normalizeSourceUrl(image.sourceUrl), image.key);
  if (!keyByProduct.has(image.productId)) keyByProduct.set(image.productId, image.key);
}

export function legacyKeyForUrl(url: string): string | undefined {
  return keyBySource.get(normalizeSourceUrl(url));
}

export function migratedProductKey(productId: string): string | undefined {
  return keyByProduct.get(productId);
}
