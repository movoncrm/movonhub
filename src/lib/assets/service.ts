import { promises as fs } from "fs";
import path from "path";
import {
  ASSET_CACHE_CONTROL,
  MAX_IMAGE_BYTES,
} from "./config";
import { productImageKey, safeSegment } from "./keys";
import { getR2Bucket, type R2BucketLike } from "./r2";
import { validateImageBuffer } from "./signatures";
import { assetKeyFromUrl, assetPublicUrl } from "./url";

/**
 * Server-side asset service. Application code depends on this abstraction, not
 * on R2 directly. Authorization is enforced by the calling server action (see
 * `canManageAssets`); this module only validates and persists bytes.
 */

export interface AssetResult {
  ok: boolean;
  url?: string;
  key?: string;
  error?: string;
}

function isCloudflareWorker(): boolean {
  return (
    typeof navigator !== "undefined" && /Cloudflare-Workers/i.test(navigator.userAgent || "")
  );
}

function localFallbackEnabled(): boolean {
  return !isCloudflareWorker() && process.env.NODE_ENV !== "test";
}

function descriptorFromFilename(filename: string, productId: string): string {
  const base = String(filename || "").replace(/\.[a-z0-9]+$/i, "");
  const cleaned = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return cleaned || safeSegment(productId, "image");
}

async function resolveBucket(options?: { bucket?: R2BucketLike | null }): Promise<R2BucketLike | null> {
  if (options && "bucket" in options) return options.bucket ?? null;
  return getR2Bucket();
}

/**
 * Validate and store a product image. Returns the public URL and object key.
 * Never trusts the uploaded filename as a path; keys are generated.
 */
export async function uploadProductImage(
  file: File,
  productId: string,
  options?: { bucket?: R2BucketLike | null },
): Promise<AssetResult> {
  if (!file || typeof file === "string" || file.size === 0) {
    return { ok: false, error: "Please choose an image file." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Image must be 5MB or smaller." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const validation = validateImageBuffer(bytes, file.type);
  if (!validation.ok || !validation.type || !validation.extension) {
    return { ok: false, error: validation.error || "Image must be a JPG, PNG or WebP file." };
  }

  const key = productImageKey(productId, descriptorFromFilename(file.name, productId), validation.extension);
  const bucket = await resolveBucket(options);

  if (bucket) {
    try {
      await bucket.put(key, bytes, {
        httpMetadata: {
          contentType: validation.type,
          cacheControl: ASSET_CACHE_CONTROL,
          cacheControlImmutable: true,
        },
      });
      return { ok: true, url: assetPublicUrl(key), key };
    } catch {
      return { ok: false, error: "Image upload failed. Please try again." };
    }
  }

  if (localFallbackEnabled()) {
    try {
      const filePath = path.join(process.cwd(), "public", "uploads", key);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, Buffer.from(bytes));
      return { ok: true, url: `/uploads/${key}`, key };
    } catch {
      return { ok: false, error: "Image upload failed. Please try again." };
    }
  }

  return { ok: false, error: "Asset storage is not configured." };
}

/** Remove a previously stored managed asset by its public URL. */
export async function deleteAssetByUrl(
  url: string | undefined,
  options?: { bucket?: R2BucketLike | null },
): Promise<AssetResult> {
  const key = assetKeyFromUrl(url);
  if (!key) return { ok: false, error: "Not a managed asset." };

  const bucket = await resolveBucket(options);
  if (bucket) {
    try {
      await bucket.delete(key);
      return { ok: true, key };
    } catch {
      return { ok: false, error: "Asset removal failed." };
    }
  }

  if (localFallbackEnabled()) {
    try {
      await fs.unlink(path.join(process.cwd(), "public", "uploads", key));
      return { ok: true, key };
    } catch {
      return { ok: false, error: "Asset removal failed." };
    }
  }

  return { ok: false, error: "Asset storage is not configured." };
}
