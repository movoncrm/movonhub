#!/usr/bin/env node
/**
 * MOVONHUB product image migration (Phase 4).
 *
 * Copies approved MOVON product images from their original MOVON URLs into the
 * MOVONHUB R2 bucket (`movonhub-assets`) under `products/{product-id}/...`.
 * Source assets are never modified or deleted.
 *
 * Modes (default is --check):
 *   node scripts/migrate-product-images.mjs --check
 *       Verify each source URL is reachable (HEAD). No writes.
 *   node scripts/migrate-product-images.mjs --local
 *       Download into public/uploads/{key} for local `next dev`. Gitignored.
 *   node scripts/migrate-product-images.mjs --remote --yes
 *       Download and upload to R2 via `wrangler r2 object put`.
 *
 * Requires an authenticated Wrangler session (`npx wrangler login`) for --remote
 * and existing `movonhub-assets` bucket + `R2_ASSETS` binding. See
 * docs/R2_ASSET_SETUP.md.
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const MANIFEST_PATH = join(ROOT, "src", "lib", "assets", "product-image-manifest.json");
const RESULTS_PATH = join(ROOT, "scripts", "product-image-migration-results.json");

const args = new Set(process.argv.slice(2));
const mode = args.has("--remote") ? "remote" : args.has("--local") ? "local" : "check";
const confirmed = args.has("--yes");

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
const BUCKET = manifest.bucket || "movonhub-assets";

const CONTENT_TYPE = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

function contentTypeFor(key) {
  const ext = key.split(".").pop().toLowerCase();
  return CONTENT_TYPE[ext] || "application/octet-stream";
}

async function fetchImage(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get("content-type") || "";
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, type };
}

const WRANGLER_BIN = join(ROOT, "node_modules", "wrangler", "bin", "wrangler.js");

function putToR2(key, filePath) {
  // Invoke Wrangler through Node directly (no shell) so arguments containing
  // spaces, such as the Cache-Control value, are not split by cmd.exe.
  const result = spawnSync(
    process.execPath,
    [
      WRANGLER_BIN,
      "r2",
      "object",
      "put",
      `${BUCKET}/${key}`,
      "--remote",
      `--file=${filePath}`,
      `--content-type=${contentTypeFor(key)}`,
      "--cache-control=public, max-age=31536000, immutable",
    ],
    { cwd: ROOT, stdio: "inherit" },
  );
  return result.status === 0;
}

async function main() {
  console.log(`MOVONHUB product image migration — mode: ${mode}${mode === "remote" && !confirmed ? " (dry run; pass --yes to upload)" : ""}\n`);
  const results = [];

  for (const image of manifest.images) {
    const record = { productId: image.productId, key: image.key, sourceUrl: image.sourceUrl };
    try {
      const res = await fetch(image.sourceUrl, { method: "HEAD", redirect: "follow" });
      record.reachable = res.ok;
      record.httpStatus = res.status;
      record.sourceContentType = res.headers.get("content-type") || "";
      record.sourceBytes = Number(res.headers.get("content-length") || 0);
    } catch (error) {
      record.reachable = false;
      record.error = error instanceof Error ? error.message : String(error);
    }

    if (!record.reachable) {
      record.status = "pending";
      console.log(`PENDING  ${image.key}  (${record.error || `HTTP ${record.httpStatus}`})`);
      results.push(record);
      continue;
    }

    if (mode === "check") {
      record.status = "available";
      console.log(`AVAILABLE ${image.key}  ${record.sourceBytes} bytes`);
      results.push(record);
      continue;
    }

    try {
      const { buffer } = await fetchImage(image.sourceUrl);
      if (mode === "local") {
        const destination = join(ROOT, "public", "uploads", image.key);
        mkdirSync(dirname(destination), { recursive: true });
        writeFileSync(destination, buffer);
        record.status = "migrated-local";
        console.log(`LOCAL    ${image.key}`);
      } else {
        const tmp = join(tmpdir(), `movonhub-${Date.now()}-${image.key.split("/").pop()}`);
        writeFileSync(tmp, buffer);
        if (!confirmed) {
          record.status = "ready";
          console.log(`READY    ${image.key} (dry run)`);
        } else if (putToR2(image.key, tmp)) {
          record.status = "migrated-r2";
          console.log(`R2       ${image.key}`);
        } else {
          record.status = "failed";
          record.error = "wrangler r2 object put failed";
          console.error(`FAILED   ${image.key}`);
        }
        rmSync(tmp, { force: true });
      }
    } catch (error) {
      record.status = "failed";
      record.error = error instanceof Error ? error.message : String(error);
      console.error(`FAILED   ${image.key}: ${record.error}`);
    }
    results.push(record);
  }

  const summary = results.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  writeFileSync(RESULTS_PATH, JSON.stringify({ mode, generatedAt: new Date().toISOString(), summary, results }, null, 2));
  console.log(`\nSummary: ${JSON.stringify(summary)}`);
  console.log(`Results written to ${RESULTS_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
