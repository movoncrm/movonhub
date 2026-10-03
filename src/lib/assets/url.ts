import { ASSETS_BASE_URL } from "./config";
import { isSafeAssetKey, keyFromAssetUrl } from "./keys";
import { legacyKeyForUrl, migratedProductKey } from "./legacy-map";

/**
 * Public URL helpers for MOVONHUB-managed assets.
 *
 * Managed assets are immutable (unique object keys), so the delivery hostname
 * serves them with long-lived caching. Nothing here exposes R2 credentials or
 * the management API.
 */

export function assetPublicUrl(key: string): string {
  return `${ASSETS_BASE_URL}/${String(key || "").replace(/^\/+/, "")}`;
}

/** True when a URL points at MOVONHUB-controlled storage (R2 or local dev uploads). */
export function isManagedAssetUrl(url: string | undefined): boolean {
  if (!url) return false;
  if (url.startsWith("/uploads/")) return true;
  return keyFromAssetUrl(url, ASSETS_BASE_URL) !== null;
}

/** Reverse-resolves a managed public URL back to its object key, if any. */
export function assetKeyFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/uploads/")) {
    const key = url.slice("/uploads/".length).split("?")[0].split("#")[0];
    return isSafeAssetKey(key) ? key : null;
  }
  return keyFromAssetUrl(url, ASSETS_BASE_URL);
}

/**
 * Resolves a stored product image reference. Already-managed URLs pass through;
 * known legacy MOVON sources are rewritten to the migrated MOVONHUB asset;
 * anything else is returned unchanged so the admin can review it.
 */
export function resolveProductImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (isManagedAssetUrl(url)) return url;
  const key = legacyKeyForUrl(url);
  return key ? assetPublicUrl(key) : url;
}

/** Canonical migrated asset URL for a seeded product id, from the manifest. */
export function migratedProductImageUrl(productId: string): string | undefined {
  const key = migratedProductKey(productId);
  return key ? assetPublicUrl(key) : undefined;
}
