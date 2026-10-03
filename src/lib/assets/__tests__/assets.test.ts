import { describe, expect, it } from "vitest";
import { buildSeed } from "@/data/seed";
import {
  ASSETS_BASE_URL,
  assetKeyFromUrl,
  assetPublicUrl,
  canManageAssets,
  deleteAssetByUrl,
  detectImageType,
  isManagedAssetUrl,
  isSafeAssetKey,
  migratedProductImageUrl,
  productImageKey,
  resolveProductImageUrl,
  safeSegment,
  uploadProductImage,
  validateImageBuffer,
  type R2BucketLike,
} from "@/lib/assets";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 1, 2, 3, 4]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1, 2, 3, 4, 5]);
const WEBP = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x24, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20,
]);

function makeFile(bytes: Uint8Array, name: string, type: string): File {
  return new File([bytes as unknown as BlobPart], name, { type });
}

function fakeBucket() {
  const puts: { key: string; options?: unknown }[] = [];
  const deletes: string[] = [];
  const bucket: R2BucketLike = {
    async put(key, _value, options) {
      puts.push({ key, options });
    },
    async delete(key) {
      deletes.push(String(key));
    },
    async head() {
      return null;
    },
  };
  return { bucket, puts, deletes };
}

const LEGACY = "https://movon.com.my/wp-content/uploads/2026/08/Hypermate-01-1200x800.png";

describe("image signature validation", () => {
  it("detects JPEG, PNG and WebP signatures", () => {
    expect(detectImageType(JPEG)).toBe("image/jpeg");
    expect(detectImageType(PNG)).toBe("image/png");
    expect(detectImageType(WEBP)).toBe("image/webp");
  });

  it("rejects non-image bytes", () => {
    expect(detectImageType(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]))).toBeNull();
  });

  it("rejects declared types that do not match the bytes", () => {
    const result = validateImageBuffer(PNG, "image/jpeg");
    expect(result.ok).toBe(false);
  });

  it("rejects files larger than 5MB", () => {
    const result = validateImageBuffer(new Uint8Array(5 * 1024 * 1024 + 1), "image/png");
    expect(result.ok).toBe(false);
  });

  it("accepts a valid image with matching declaration", () => {
    const result = validateImageBuffer(PNG, "image/png");
    expect(result.ok).toBe(true);
    expect(result.extension).toBe("png");
  });
});

describe("safe object keys", () => {
  it("sanitises traversal and unsafe characters", () => {
    expect(safeSegment("../../etc/passwd")).toBe("etc-passwd");
    expect(safeSegment("Hello World!")).toBe("hello-world");
    expect(safeSegment("...")).toBe("asset");
  });

  it("rejects unsafe asset keys", () => {
    expect(isSafeAssetKey("../secret.png")).toBe(false);
    expect(isSafeAssetKey("/products/x.png")).toBe(false);
    expect(isSafeAssetKey("products\\x.png")).toBe(false);
    expect(isSafeAssetKey("products/prod_x/image-abc.png")).toBe(true);
  });

  it("generates keys under the product prefix", () => {
    const key = productImageKey("prod_hypermate", "../../Evil Name", "png", "abc123");
    expect(key).toBe("products/prod_hypermate/evil-name-abc123.png");
    expect(key.startsWith("products/prod_hypermate/")).toBe(true);
    expect(isSafeAssetKey(key)).toBe(true);
  });
});

describe("asset URL helpers", () => {
  it("builds public asset URLs", () => {
    expect(assetPublicUrl("products/prod_x/image.png")).toBe(
      `${ASSETS_BASE_URL}/products/prod_x/image.png`,
    );
  });

  it("recognises managed URLs and reverses keys", () => {
    const url = `${ASSETS_BASE_URL}/products/prod_x/image.png`;
    expect(isManagedAssetUrl(url)).toBe(true);
    expect(assetKeyFromUrl(url)).toBe("products/prod_x/image.png");
    expect(isManagedAssetUrl("https://evil.example.com/a.png")).toBe(false);
    expect(assetKeyFromUrl("https://evil.example.com/a.png")).toBeNull();
  });

  it("resolves legacy MOVON sources to MOVONHUB assets", () => {
    expect(resolveProductImageUrl(LEGACY)).toBe(
      `${ASSETS_BASE_URL}/products/prod_hypermate/hypermate-station-1200x800.png`,
    );
    expect(migratedProductImageUrl("prod_hypermate")).toBe(
      `${ASSETS_BASE_URL}/products/prod_hypermate/hypermate-station-1200x800.png`,
    );
  });

  it("leaves managed and unknown URLs untouched", () => {
    const managed = `${ASSETS_BASE_URL}/products/prod_x/image.png`;
    expect(resolveProductImageUrl(managed)).toBe(managed);
    expect(resolveProductImageUrl("https://unknown.example.com/a.png")).toBe(
      "https://unknown.example.com/a.png",
    );
  });
});

describe("asset authorization", () => {
  it("allows only administrators", () => {
    expect(canManageAssets({ role: "admin" })).toBe(true);
    expect(canManageAssets({ role: "advisor" })).toBe(false);
    expect(canManageAssets(null)).toBe(false);
  });
});

describe("uploadProductImage", () => {
  it("uploads a valid image to the injected bucket with safe headers", async () => {
    const { bucket, puts } = fakeBucket();
    const result = await uploadProductImage(makeFile(PNG, "My Photo.png", "image/png"), "prod_x", {
      bucket,
    });
    expect(result.ok).toBe(true);
    expect(result.key).toMatch(/^products\/prod_x\/my-photo-[a-z0-9]+\.png$/);
    expect(result.url).toBe(`${ASSETS_BASE_URL}/${result.key}`);
    expect(puts).toHaveLength(1);
    expect(puts[0].key).toBe(result.key);
  });

  it("rejects an invalid MIME type without writing", async () => {
    const { bucket, puts } = fakeBucket();
    const result = await uploadProductImage(makeFile(PNG, "x.png", "application/pdf"), "prod_x", {
      bucket,
    });
    expect(result.ok).toBe(false);
    expect(puts).toHaveLength(0);
  });

  it("rejects spoofed content (signature mismatch) without writing", async () => {
    const { bucket, puts } = fakeBucket();
    const result = await uploadProductImage(makeFile(PNG, "x.jpg", "image/jpeg"), "prod_x", { bucket });
    expect(result.ok).toBe(false);
    expect(puts).toHaveLength(0);
  });

  it("rejects oversized uploads", async () => {
    const { bucket, puts } = fakeBucket();
    const big = makeFile(new Uint8Array(5 * 1024 * 1024 + 1), "big.png", "image/png");
    const result = await uploadProductImage(big, "prod_x", { bucket });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/5MB/);
    expect(puts).toHaveLength(0);
  });

  it("returns a safe error when R2 is not configured (no local fallback in tests)", async () => {
    const result = await uploadProductImage(makeFile(PNG, "x.png", "image/png"), "prod_x", {
      bucket: null,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Asset storage is not configured.");
  });
});

describe("existing product rendering", () => {
  it("stores a MOVONHUB-managed URL for every seeded product image", () => {
    const products = buildSeed().products;
    expect(products.length).toBeGreaterThan(0);
    for (const product of products) {
      if (!product.imageUrl) continue;
      expect(isManagedAssetUrl(product.imageUrl)).toBe(true);
      expect(product.imageUrl).not.toContain("movon.com.my");
    }
  });
});

describe("deleteAssetByUrl", () => {
  it("deletes a managed object key", async () => {
    const { bucket, deletes } = fakeBucket();
    const result = await deleteAssetByUrl(`${ASSETS_BASE_URL}/products/prod_x/image.png`, { bucket });
    expect(result.ok).toBe(true);
    expect(deletes).toEqual(["products/prod_x/image.png"]);
  });

  it("refuses to delete non-managed URLs", async () => {
    const { bucket, deletes } = fakeBucket();
    const result = await deleteAssetByUrl("https://evil.example.com/a.png", { bucket });
    expect(result.ok).toBe(false);
    expect(deletes).toHaveLength(0);
  });
});
