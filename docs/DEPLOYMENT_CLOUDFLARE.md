# MOVONHUB — GitHub + Cloudflare Deployment Guide

Target architecture:

```
GitHub (private repo)  ──►  Cloudflare Workers (OpenNext adapter)  ──►  Supabase
   version control            SSR + APIs + middleware + wildcard        durable data,
   + deploy source            subdomains, custom domain, SSL/TLS        storage, RLS
```

Domains: `movonhub.com.my`, `www.movonhub.com.my`, `*.movonhub.com.my`
(e.g. `nik.movonhub.com.my`).

> Status legend — **DONE (local)**: implemented and verified on this machine.
> **EXTERNAL**: requires account access (GitHub / Cloudflare / Supabase / registrar)
> and cannot be completed from the repository alone.

---

## 1. Hosting compatibility assessment

| Option | Verdict |
| --- | --- |
| **Static export** (`output: "export"`) | ❌ Not possible. The app needs sessions, server actions, route handlers, dynamic advisor pages and enquiry processing. |
| **Cloudflare Pages (static only)** | ❌ Insufficient for the same reason. |
| **vinext (Cloudflare Vite/Next tool)** | ⚠️ Not selected. Newer and less proven for the full Next.js 15 App Router feature set this app relies on (server actions, `cookies()`, middleware). Would risk rewrites. |
| **`@opennextjs/cloudflare` (OpenNext adapter)** | ✅ **Selected.** Officially supported path for Next.js 15 on Workers, supports App Router, server actions, middleware and Node APIs via `nodejs_compat`, and preserves the existing `next dev` workflow. |

Versions in use: Next `15.5.x`, React `19.3`, `@opennextjs/cloudflare` `1.x`, `wrangler` `4.x`.

**DONE (local):** `npm run cf:build` produces `.open-next/worker.js`, and
`npx wrangler deploy --dry-run` validates the Worker (103 asset files, `ASSETS`
and `R2_ASSETS` bindings) without deploying.

---

## 2. Files

| File | Purpose |
| --- | --- |
| `wrangler.jsonc` | Worker name, entry (`.open-next/worker.js`), `nodejs_compat`, assets binding, routes (commented until the zone is ready) |
| `open-next.config.ts` | OpenNext Cloudflare config (defaults; add R2/KV cache later if needed) |
| `.dev.vars.example` | Local secret template for `wrangler`/preview — copy to `.dev.vars` (gitignored) |
| `.env.example` | Local dev template |
| `next.config.mjs` | `NEXT_PUBLIC_UNOPTIMIZED_IMAGES` flag (Workers have no Next image optimizer) |
| `wrangler.jsonc` | Also declares the `R2_ASSETS` bucket binding for product assets |
| `docs/R2_ASSET_SETUP.md` | Cloudflare R2 asset storage setup, migration and rollback |
| `scripts/migrate-product-images.mjs` | One-time migration of product images into R2 |

## 3. Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local Next.js dev server (unchanged) |
| `npm run build` / `npm run start` | Standard Next production build / server |
| `npm run cf:build` | Build the Cloudflare Worker bundle (`.open-next/`) |
| `npm run cf:preview` | Build + run the Worker locally via Wrangler |
| `npm run cf:check` | Build + `wrangler deploy --dry-run` (validates without deploying) |
| `npm run cf:deploy` | Build + deploy to Cloudflare (**EXTERNAL**, needs auth) |
| `npm run cf:typegen` | Generate `CloudflareEnv` types |

---

## 4. Environment variables

Secrets are server-side only and never committed. `NEXT_PUBLIC_*` are public.

| Variable | Local `.env.local` | Cloudflare Worker (secret) | GitHub Actions | Supabase |
| --- | :---: | :---: | :---: | :---: |
| `NEXT_PUBLIC_SITE_URL` | ✅ | ✅ (var) | — | — |
| `NEXT_PUBLIC_ROOT_DOMAIN` | ✅ | ✅ (var) | — | — |
| `NEXT_PUBLIC_UNOPTIMIZED_IMAGES` | `false` | `true` | — | — |
| `NEXT_PUBLIC_CONTACT_WHATSAPP` | optional | ✅ (var) | — | — |
| `RESERVED_SLUGS` | optional | ✅ (var) | — | — |
| `ALLOW_PUBLIC_REGISTRATION` | `false` | ✅ (var, keep `false`) | — | — |
| `SESSION_SECRET` | ✅ | ✅ **secret** | secret | — |
| `ADMIN_PASSWORD` | ✅ | ✅ **secret** | secret | — |
| `DATA_ADAPTER` | `local` | `supabase` | — | — |
| `SUPABASE_URL` | ✅ | ✅ **secret** | — | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | optional (build) | — | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | optional | optional | — | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ **secret** | secret | ✅ |
| `AI_PROVIDER` / `AI_API_KEY` / `AI_MODEL` | optional | optional **secret** | optional | — |

Set Worker secrets (never in `wrangler.jsonc` / git):

```powershell
npx wrangler secret put SESSION_SECRET
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# optional: npx wrangler secret put AI_API_KEY
```

Public vars can go in `wrangler.jsonc` under `"vars"` or as plain text variables in
the dashboard.

`.gitignore` excludes `.env*`, `.dev.vars*`, `.open-next/`, `.wrangler/` and
`cloudflare-env.d.ts`.

---

## 5. Data persistence (Supabase) — required in production

The default **local JSON adapter is not durable on Workers** (no writable filesystem).
Production must run `DATA_ADAPTER=supabase`.

**EXTERNAL / one-time setup:**

1. Create a Supabase project.
2. Apply the schema in order: `supabase/migrations/0001_init.sql`, then
   `supabase/migrations/0002_advisor_status_theme.sql`, then
   `supabase/migrations/0003_security_content_settings.sql` (SQL editor or `supabase db push`).
   - `0001` creates `advisors`, `categories`, `products`, `promotions`, `enquiries`, `settings`.
   - `0002` adds advisor `status` (draft/published/suspended) and `preferred_theme`, and tightens
     the public RLS read policy to `active = true and status = 'published'`.
   - `0003` adds advisor `default_locale`, `allow_language_toggle`, `allow_theme_toggle`; creates
     `site_content`, `audit_logs` and `rate_limits` plus the `consume_rate_limit` function;
     replaces the wide advisor read policy with the safe `public_advisors` view; removes the
     anonymous enquiry insert policy. See `docs/SECURITY_AUDIT.md`.
   - Enables RLS.
   - Creates the public `advisor-photos` storage bucket.
   - Apply the optional reference seed `supabase/seed.sql` last. It contains no credentials.
3. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
4. Set `DATA_ADAPTER=supabase`.

The service-role key is used only server-side (behind auth checks). Advisor
ownership is enforced in the dashboard action layer. Photos upload to Supabase
Storage when `DATA_ADAPTER=supabase`.

---

## 6. GitHub

**DONE (local):** `.gitignore`, `.env.example`, `.dev.vars.example` and this guide
prepare the repo. No commit/push has been performed.

**EXTERNAL — connect the repo:**

1. Create a **private** GitHub repository and push the local history (preserve
   history; do not force-push; do not commit secrets).
2. Recommended branches: `main` (production) and `develop`.
3. **Workers Builds** (dashboard → Workers & Pages → your Worker → Settings → Builds):
   - Build command: `npm run cf:build`
   - Deploy command: `npx wrangler deploy`
   - Add secret env vars in the build/deploy settings.
4. Alternatively use a GitHub Actions workflow with `cloudflare/wrangler-action` and
   the API token + account id stored as repository secrets.

---

## 7. DNS, SSL and wildcard subdomains

**EXTERNAL — requires Cloudflare + registrar access.** Wildcard subdomains are
prepared in code but are **not live until the DNS record, certificate and Worker
route below are configured and tested.** Do not claim wildcard support is live
before then.

### 7.1 Required DNS records

| Record | Name | Content | Proxy |
| --- | --- | --- | --- |
| A / CNAME | `@` | Worker custom domain | Proxied |
| CNAME | `www` | `movonhub.com.my` | Proxied |
| CNAME | `*` | `movonhub.com.my` | Proxied (wildcard) |

### 7.2 Exact Cloudflare dashboard steps

1. DNS: zone `movonhub.com.my` -> DNS -> Records -> Add record.
   - Type `CNAME`, Name `*`, Target `movonhub.com.my`, Proxy status **Proxied**. Save.
   - Add `www` the same way if it is not already present.
2. SSL/TLS: zone -> SSL/TLS -> Overview -> set encryption mode to **Full (strict)**.
3. Certificate for wildcard: zone -> SSL/TLS -> Edge Certificates.
   - Confirm a certificate covering `*.movonhub.com.my` is available. If it is not,
     order one (Cloudflare Advanced Certificate with the wildcard hostname, or
     Cloudflare Total TLS) and wait for it to become active. The default universal
     certificate does not cover wildcard hostnames.
4. Worker route: Workers & Pages -> the `movonhub` Worker -> Settings -> Domains & Routes
   - Add custom domain `movonhub.com.my`.
   - Add custom domain `www.movonhub.com.my`.
   - Add custom domain `*.movonhub.com.my`.
   - Alternatively uncomment the `routes` array in `wrangler.jsonc` and deploy.
5. Wait for the certificate status to show Active, then test (section 7.4).

### 7.3 Reserved subdomains and unknown advisors

The middleware ignores these subdomains so they can never resolve to an advisor
page: `www`, `api`, `admin`, `app`, `hub`, `login`, `register`, `dashboard`,
`support`, `mail`, `assets`, `static`, `cdn`, `status`, `sso`, `disclaimer`,
`legal`, plus any comma-separated values in the `RESERVED_SLUGS` environment
variable. The same list (plus the public site paths) is enforced when a
username is chosen.

Advisor pages are resolved from Supabase by slug:
- Published and active advisor: page loads.
- Unknown slug: standard 404.
- Draft advisor: 404.
- Suspended advisor: generic "unavailable" page that does not confirm the account
  exists.

Because the middleware runs on the edge without database access, it only decides
whether a hostname looks like an advisor subdomain. Ownership, publication state
and existence are validated against Supabase by the page itself. No private or
suspended account information is disclosed.

### 7.4 Post-configuration tests

- `https://nik.movonhub.com.my` loads Nik's page.
- `https://nik.movonhub.com.my/products` loads the catalogue with the subdomain
  preserved (path suffix rewrite).
- `https://unknown-name.movonhub.com.my` returns 404.
- `https://admin.movonhub.com.my` and `https://www.movonhub.com.my` do not render
  an advisor page.
- A suspended advisor's subdomain does not reveal the account.
- `https://movonhub.com.my/sa/nik` still works as a compatibility route.

**Routing logic (`src/middleware.ts`) — DONE (local, unverified in production
until the steps above are complete):**
- `movonhub.com.my/sa/{slug}` always works (compatibility route).
- `{slug}.movonhub.com.my` is rewritten to `/sa/{slug}` (suffix and query preserved)
  and is the canonical advisor URL (metadata, OG URL, share links, sitemap).
- `*.localhost` works in local development.

---

## 8. Local development and preview

```powershell
npm install
npm run dev            # http://localhost:3000  (DONE)
npm run cf:build       # Worker bundle               (DONE)
npm run cf:preview     # build + wrangler local preview (requires .dev.vars)
```

For `cf:preview`, copy `.dev.vars.example` to `.dev.vars` and fill in values.

---

## 9. Known limitations and risks

- **Local JSON adapter is dev-only** on Workers — production must use Supabase.
- **Password hashing (`node:crypto` scrypt):** must be confirmed on the Workers
  runtime. If `scryptSync` is unavailable under `nodejs_compat`, switch hashing to
  Web Crypto **PBKDF2** or delegate auth to **Supabase Auth**. Test on
  `cf:preview` before production.
- **Image optimisation:** disabled on Workers (`NEXT_PUBLIC_UNOPTIMIZED_IMAGES=true`).
  Product images are served directly from Cloudflare R2 via
  `https://assets.movonhub.com.my` (see `docs/R2_ASSET_SETUP.md`).
- **Rate limiting** is in-memory (per isolate) — a Durable Object or KV-backed
  limiter is recommended at scale.
- **File uploads** must go to Supabase Storage in production (local writes to
  `public/` are not served/persisted on Workers).
- **Free-tier considerations:** Workers requests/CPU, R2/KV if a cache is added,
  Supabase free-tier database/storage/bandwidth, and Cloudflare Advanced Certificate
  cost for the wildcard.

---

## 10. Verification performed (local)

- `npm run cf:build` → `.open-next/worker.js` generated (OpenNext build complete).
- `npx wrangler deploy --dry-run` → config valid; 103 asset files; `ASSETS` and
  `R2_ASSETS` bindings.
- `npm run build`, `npm run typecheck`, `npm run lint`, `npm run test` all pass.
- Runtime (dev): default Malay, `mh_lang=en` renders English, `/sa/nik` works,
  `/sa/syuhadamc` → 404, subdomain rewrite works, sitemap lists only active advisors.

Nothing has been deployed, no DNS/SSL changed, and no secrets were committed.

---

## 11. First public launch — exact external steps

The first controlled launch exposes **two pages only**:

- `https://movonhub.com.my` — MOVONHUB Coming Soon (dark-only) — **LIVE**
- `https://nik.movonhub.com.my` — Nik's SA microsite — **LIVE**

Worker: `movonhub` (OpenNext) on branch `launch`. Supabase migrations `0001`, `0002` and
`supabase/seed.sql` applied; advisor `nik` created via `/admin`.
**Important:** the server reads `SUPABASE_URL` at runtime (not `NEXT_PUBLIC_SUPABASE_URL`, which
Next inlines at build time). Non-secret runtime vars live in `wrangler.jsonc` `vars` so Workers
Builds deploys retain them; secrets are set with `wrangler secret put`.

Everything below is **EXTERNAL** (requires account access) and has **not** been performed locally.

### 11.1 GitHub

```powershell
git add -A
git commit -m "MOVONHUB first public launch: coming soon + Nik SA page"
git branch -M main
git remote add origin https://github.com/<org>/<repo>.git   # private repo
git push -u origin main
```

Ensure `.env.local`, `.dev.vars`, `.open-next/`, `.wrangler/` and `src/data/db.json` are never
committed (already in `.gitignore`).

### 11.2 Cloudflare Worker (Workers Builds)

1. Cloudflare dashboard → Workers & Pages → Create → connect the GitHub repo.
2. Build command: `npm run cf:build` · Deploy command: `npx wrangler deploy`.
3. Worker name in `wrangler.jsonc` is `movonhub`.

### 11.3 Environment (Worker vars + secrets)

Public vars: `NEXT_PUBLIC_SITE_URL=https://movonhub.com.my`,
`NEXT_PUBLIC_ROOT_DOMAIN=movonhub.com.my`, `NEXT_PUBLIC_UNOPTIMIZED_IMAGES=true`,
`NEXT_PUBLIC_CONTACT_WHATSAPP=<optional 60XXXXXXXXX>`, `DATA_ADAPTER=supabase`.

Secrets (`npx wrangler secret put …`): `SESSION_SECRET`, `ADMIN_PASSWORD`,
`SUPABASE_SERVICE_ROLE_KEY` (and `AI_API_KEY` only when AI is enabled).

### 11.4 Supabase (recommended before onboarding SAs)

Workers have no durable filesystem, so the local JSON adapter is dev-only. Before the launch:

1. Create a Supabase project.
2. Run `supabase/migrations/0001_init.sql` then `0002_advisor_status_theme.sql`.
3. Confirm the `advisor-photos` bucket exists.
4. Set `DATA_ADAPTER=supabase` and the three Supabase env vars.
5. **Seed Nik**: create the advisor via `/admin → Sales Advisors → Add New SA`
   (name `Nik`, slug `nik`, WhatsApp `601113002181`, status Published) or insert the row directly.

> If Supabase is not set up, the two pages still render from the seed, but any admin edits
> (including uploading Nik's photo) will not persist across Worker instances.

### 11.5 DNS + SSL

| Record | Name | Content | Proxy |
| --- | --- | --- | --- |
| A / CNAME | `@` | Worker route | Proxied |
| CNAME | `www` | `movonhub.com.my` | Proxied |
| CNAME | `*` | `movonhub.com.my` | Proxied (wildcard) |

SSL/TLS: **Full (strict)** plus a **wildcard certificate** (`*.movonhub.com.my`) for advisor
subdomains. Attach the domains by uncommenting the `routes` in `wrangler.jsonc` and deploying, or
via the dashboard (Custom Domains).

### 11.6 Post-deploy verification

- `https://movonhub.com.my` → Coming Soon; CTA opens `https://nik.movonhub.com.my`.
- `https://nik.movonhub.com.my` → Nik's page; WhatsApp links open `wa.me/601113002181`; theme
  toggle works; product enquiries are attributed to Nik.
- `https://nik.movonhub.com.my/sa/nik` still works (compat) and `https://admin.movonhub.com.my`
  does not serve an advisor page.
- Unknown subdomain → 404; `robots.txt` / `sitemap.xml` present; no horizontal overflow on mobile.

---

## 12. Phase 2 release - external steps (not performed here)

Do not deploy as part of this phase until these steps are approved and done in
order.

1. Supabase
   - Apply `supabase/migrations/0003_security_content_settings.sql`.
   - Confirm the `public_advisors` view exists and that an anon key can no longer
     select `password_hash` from `public.advisors`.
   - Confirm the `consume_rate_limit`, `site_content`, `audit_logs` and
     `rate_limits` objects exist.
   - Take a backup before applying (see `docs/BACKUP_RECOVERY.md`).

2. Cloudflare Worker environment
   - Add/confirm vars: `DATA_ADAPTER=supabase`, `NEXT_PUBLIC_SITE_URL`,
     `NEXT_PUBLIC_ROOT_DOMAIN`, `NEXT_PUBLIC_UNOPTIMIZED_IMAGES=true`,
     `ALLOW_PUBLIC_REGISTRATION=false`.
   - Confirm secrets: `SESSION_SECRET`, `ADMIN_PASSWORD`,
     `SUPABASE_SERVICE_ROLE_KEY`.
   - Set `SUPABASE_URL` at runtime (not only `NEXT_PUBLIC_SUPABASE_URL`, which is
     inlined at build time).

3. Wildcard subdomains
   - Complete section 7 (DNS, wildcard certificate, Worker custom domains) and run
     the section 7.4 tests.

4. Verify password hashing on the Workers runtime
   - After the first deploy, create an advisor from `/admin`, log out, and log in as
     that advisor. If login fails due to `scrypt` being unavailable under
     `nodejs_compat`, switch to Web Crypto PBKDF2 or Supabase Auth before onboarding
     more advisors. This is tracked in `docs/SECURITY_AUDIT.md`.

5. Content and disclaimers
   - Publish main site and SA wording via `/admin/content`. See
     `docs/CONTENT_EDITING_GUIDE.md`.
   - Have Malaysian legal counsel review `/disclaimer`, `/privacy` and `/terms` and
     fill in the entity, registration, address and contact placeholders.

6. Verification
   - Run the manual checks in `docs/SECURITY_AUDIT.md` section 5 (headers) and the
     test matrix in the final report.
   - No deployment, DNS or secret change has been made by this phase.
