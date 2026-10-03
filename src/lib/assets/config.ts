/**
 * Central configuration for MOVONHUB managed assets (Cloudflare R2).
 *
 * Safe to import from server and client code: this module only reads public
 * environment variables and contains no secrets, filesystem or R2 references.
 */

/** Worker binding name for the R2 bucket. */
export const ASSETS_BINDING = "R2_ASSETS";

/** R2 bucket that holds MOVONHUB product/advisor assets. */
export const ASSETS_BUCKET = "movonhub-assets";

/**
 * Public delivery hostname for managed assets. The custom domain fronts the R2
 * bucket (see docs/R2_ASSET_SETUP.md). Overridable for previews via
 * NEXT_PUBLIC_ASSETS_BASE_URL.
 */
export const ASSETS_BASE_URL = (
  process.env.NEXT_PUBLIC_ASSETS_BASE_URL || "https://assets.movonhub.com.my"
).replace(/\/+$/, "");

/** Default maximum upload size (5 MB). */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export const IMAGE_EXT: Record<AllowedImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Immutable caching for content-addressed/unique object keys (1 year). */
export const ASSET_CACHE_CONTROL = "public, max-age=31536000, immutable";
