# MOVONHUB — R2 Asset Storage Setup

Cloudflare R2 hosts MOVONHUB-controlled product images so the app no longer
hot-links product imagery from `movon.com.my`. This document covers the
architecture, one-time Cloudflare setup, the admin upload flow, migration
status, rollback and cost notes.

> Status: implementation, tests and local verification are complete. Nothing has
> been deployed and no Cloudflare resources have been created from this repo.

---

## 1. Architecture

```
Admin (server action, role=admin)
  └─ src/lib/assets/service.ts  validate size + magic bytes
       └─ R2 binding R2_ASSETS (bucket: movonhub-assets)
            └─ custom domain https://assets.movonhub.com.my (public read)

Product rows (Supabase `products.image_url`)
  └─ store a stable public asset URL: https://assets.movonhub.com.my/products/{product-id}/{file}
```

Key points:

- Application code depends on the `src/lib/assets` service, not on R2 directly.
- Object keys follow `products/{product-id}/{descriptive-name}-{suffix}.{ext}`.
  The suffix makes keys unique/immutable and cache-friendly.
- Only the object key or public URL is stored in Supabase, never image bytes and
  never R2 credentials.
- The browser only ever sees the public custom domain. The R2 S3/management API
  is not exposed and no R2 access keys are used by the app.
- Legacy `movon.com.my` URLs that have not yet been migrated are rewritten to
  the migrated asset at render time (`resolveProductImageUrl`), so the site does
  not hot-link the source even before the DB is updated.

### Binding name

The recommended binding name `ASSETS` is already reserved by the OpenNext Worker
static assets binding, and Wrangler bindings must be unique. MOVONHUB therefore
binds the R2 bucket as **`R2_ASSETS`**. This is the only deviation from the
suggested configuration.

---

## 2. One-time Cloudflare setup (EXTERNAL, requires account access)

Run these once. They are intentionally not automated by the repo.

1. **Create the bucket** (if missing):

   ```powershell
   npx wrangler r2 bucket create movonhub-assets
   ```

2. **Bind the bucket as `R2_ASSETS`.** This is declared in `wrangler.jsonc`:

   ```jsonc
   "r2_buckets": [
     { "binding": "R2_ASSETS", "bucket_name": "movonhub-assets" }
   ]
   ```

   Confirm the binding appears after `npx wrangler deploy --dry-run` (you should
   see `env.R2_ASSETS (movonhub-assets)  R2 Bucket`).

3. **Attach the custom asset domain** (public read):

   - Cloudflare dashboard -> R2 -> `movonhub-assets` -> Settings -> Public access
     -> Custom Domains -> Connect Domain.
   - Use `assets.movonhub.com.my`. Cloudflare creates the DNS record and
     certificate automatically because the zone is on Cloudflare.
   - Keep the bucket's `r2.dev` public access **disabled** so only the custom
     domain is public.
   - Add a Cache Rule (or rely on R2 `Cache-Control`) to cache asset responses at
     the edge. Objects are immutable, so `public, max-age=31536000, immutable`
     is safe.

4. **No application secrets are required** for R2. The Worker accesses the bucket
   through the binding, not API keys. Do not create `R2_ACCESS_KEY_ID` /
   `R2_SECRET_ACCESS_KEY` for this app.

5. **Upload the migrated product images** (one time):

   ```powershell
   node scripts/migrate-product-images.mjs --check          # verify sources
   node scripts/migrate-product-images.mjs --remote --yes   # upload to R2
   ```

   The script downloads each source image and uploads it unchanged (aspect ratio
   and appearance preserved) under the keys in
   `src/lib/assets/product-image-manifest.json`. See section 5.

6. **Deploy only after explicit approval** (see section 9).

### Preview/alternate domains

Set `NEXT_PUBLIC_ASSETS_BASE_URL` (public var) to point at a Worker preview or a
different asset domain. It defaults to `https://assets.movonhub.com.my`.

---

## 3. Admin upload process

Product image management is integrated into the existing admin product workflow
(`/admin -> Products -> Add/Edit product`). There is no separate upload tool.

- A file input accepts JPEG, PNG or WebP (max 5 MB).
- The server action `saveProduct` enforces the following **server-side**; the UI
  is only a convenience:
  - the caller must be an authenticated `admin` (`canManageAssets` /
    `requireAdmin`), never an advisor or anonymous user;
  - MIME type must be one of the allow-listed image types;
  - the file signature (magic bytes) must match the declared type (spoofing is
    rejected);
  - size must be <= 5 MB;
  - the object key is generated (`products/{product-id}/...`) and the uploaded
    filename is never used as a path (traversal and arbitrary access blocked).
- Replacing an image deletes the previous managed object only after the database
  write succeeds, so failures do not destroy the current image.
- `Remove image` clears the image and deletes the managed object.
- Admin asset changes are written to the existing audit log:
  `product.image_uploaded` and `product.image_removed` (no secrets recorded).

Local development without an R2 binding falls back to writing under
`public/uploads/products/...` (gitignored). On Cloudflare Workers the fallback is
disabled and a missing binding returns a safe error instead of leaking details.

---

## 4. Delivery and caching

- Public base: `https://assets.movonhub.com.my`.
- Every upload gets a unique, immutable key, so responses can be cached for a
  year (`Cache-Control: public, max-age=31536000, immutable`).
- Images render through `next/image` on the main site, SA pages, product listings
  and mobile layouts. Cloudflare Workers run with
  `NEXT_PUBLIC_UNOPTIMIZED_IMAGES=true`, so delivery is direct from R2 over the
  custom domain (no extra image proxy).
- `next.config.mjs` allows the `assets.movonhub.com.my` hostname and no longer
  allows `movon.com.my`, so third-party product hot-links cannot be reintroduced
  through the image optimizer.

---

## 5. Image migration status

17 product image references were identified (13 catalogue products + 4 MOVON
Expert service items). All 17 source URLs returned HTTP 200 when checked
(`node scripts/migrate-product-images.mjs --check`). Results:
`scripts/product-image-migration-results.json`.

- Source references and target keys: `src/lib/assets/product-image-manifest.json`.
- The manifest stores only the original URL (one asset per product). Source
  images are never modified or deleted.
- `supabase/seed.sql` stores the migrated asset URLs for the seeded products.
- **Pending manual step:** the objects themselves have not been uploaded to R2
  because that requires Cloudflare credentials. Run the `--remote --yes` command
  in section 2 step 5, then update any existing `products.image_url` rows to the
  migrated URLs (the render-time legacy resolver already serves them correctly
  until then).
- If a source image cannot be retrieved (for example MOVON removes it), the
  script records it as `pending` and no replacement is fabricated.

WebP: images are migrated in their original format to preserve clarity. Optional
WebP/AVIF conversion can be layered on with Cloudflare Images or Polish at the
edge; it is not required and is not enabled by this implementation.

---

## 6. Rollback procedure

No code deploy is required to stop using R2.

1. Revert the data:
   - restore `products.image_url` values from the pre-migration backup, or
     re-run `supabase/seed.sql` against the reference products.
2. Revert configuration:
   - remove the `r2_buckets` entry from `wrangler.jsonc` and redeploy; or
   - point `NEXT_PUBLIC_ASSETS_BASE_URL` at a different host.
3. Keep the R2 bucket and its objects. Do not delete them; retaining the objects
   makes roll-forward a no-op.
4. Re-enable any previously allowed image hosts in `next.config.mjs` only if you
   intentionally return to hot-linking (not recommended).

---

## 7. Cost monitoring and free-tier limits

R2 pricing is usage-based. The Cloudflare free tier historically includes a
monthly allowance of storage, Class A (write) and Class B (read) operations, and
does not charge egress, but limits and prices can change.

- This implementation **does not guarantee RM0/month**. Costs depend on stored
  bytes, request volume, and current Cloudflare terms.
- Watch the dashboard -> R2 -> bucket metrics and the account billing page.
- Objects are compressed at the edge; unique immutable keys maximise cache hits
  and minimise Class B operations.
- Advisor profile photos currently use Supabase Storage, not R2. Migrating them
  later is optional and would add to R2 usage.

---

## 8. Production verification checklist

After setup and deploy (with approval):

- [ ] `npx wrangler deploy --dry-run` lists `env.R2_ASSETS (movonhub-assets)`.
- [ ] `https://assets.movonhub.com.my/products/<key>` returns the image directly
      with `Content-Type: image/*` and long-lived `Cache-Control`.
- [ ] `/products` and a product detail page render images from
      `assets.movonhub.com.my` (no `movon.com.my` requests in devtools Network).
- [ ] An SA subdomain page renders product images.
- [ ] Mobile layout and both light/dark themes render images correctly.
- [ ] As an admin, upload a JPEG/PNG/WebP: succeeds; the image updates without a
      redeploy; the old object is removed.
- [ ] Uploading a PDF or a renamed non-image file is rejected.
- [ ] Uploading a file over 5 MB is rejected.
- [ ] An advisor (non-admin) and an anonymous request cannot upload.
- [ ] Audit log contains `product.image_uploaded` / `product.image_removed`.
- [ ] R2 `r2.dev` public access is disabled.

---

## 9. Deployment (do not run until approved)

Exact command (from the repository root, after Cloudflare setup and explicit
approval):

```powershell
npm run cf:deploy
```

This runs `opennextjs-cloudflare build && opennextjs-cloudflare deploy`. It is
not executed as part of this phase.
