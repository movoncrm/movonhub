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
`npx wrangler deploy --dry-run` validates the Worker (91 asset files, `ASSETS`
binding) without deploying.

---

## 2. Files

| File | Purpose |
| --- | --- |
| `wrangler.jsonc` | Worker name, entry (`.open-next/worker.js`), `nodejs_compat`, assets binding, routes (commented until the zone is ready) |
| `open-next.config.ts` | OpenNext Cloudflare config (defaults; add R2/KV cache later if needed) |
| `.dev.vars.example` | Local secret template for `wrangler`/preview — copy to `.dev.vars` (gitignored) |
| `.env.example` | Local dev template |
| `next.config.mjs` | `NEXT_PUBLIC_UNOPTIMIZED_IMAGES` flag (Workers have no Next image optimizer) |

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
| `SESSION_SECRET` | ✅ | ✅ **secret** | secret | — |
| `ADMIN_PASSWORD` | ✅ | ✅ **secret** | secret | — |
| `DATA_ADAPTER` | `local` | `supabase` | — | — |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ (var) | — | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ (var) | — | ✅ |
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
2. Apply the schema in order: `supabase/migrations/0001_init.sql` then
   `supabase/migrations/0002_advisor_status_theme.sql` (SQL editor or `supabase db push`).
   - Creates `advisors`, `categories`, `products`, `promotions`, `enquiries`, `settings`.
   - `0002` adds advisor `status` (draft/published/suspended) and `preferred_theme`, and tightens
     the public RLS read policy to `active = true and status = 'published'`.
   - Enables RLS with public-read policies and insert-only enquiries.
   - Creates the public `advisor-photos` storage bucket.
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

**EXTERNAL — requires Cloudflare + registrar access.** Not configured or verified here.

| Record | Name | Content | Proxy |
| --- | --- | --- | --- |
| A / CNAME | `@` | Cloudflare Worker route (custom domain) | Proxied |
| CNAME | `www` | `movonhub.com.my` | Proxied |
| CNAME | `*` | `movonhub.com.my` | Proxied (wildcard) |

- SSL/TLS mode: **Full (strict)**. A **wildcard certificate** (`*.movonhub.com.my`)
  is required for advisor subdomains — order via Cloudflare Advanced Certificate
  (Total TLS / wildcard) so `nik.movonhub.com.my` is covered.
- Attach the domains to the Worker by uncommenting `routes` in `wrangler.jsonc` and
  deploying, or add custom domains in the dashboard.

**Routing logic (`src/middleware.ts`) — DONE (local):**
- `movonhub.com.my/sa/{slug}` always works (compatibility route).
- `{slug}.movonhub.com.my` is rewritten to `/sa/{slug}` (suffix/query preserved) and is the
  **canonical** advisor URL (metadata, OG URL, share links, sitemap).
- Reserved subdomains ignored: `www`, `api`, `app`, `admin`, `dashboard`, `hub`, `sa`, `login`,
  `register`, `static`, `assets`, `support`, `mail`, `cdn`, `status`, `sso` (extendable via the
  `RESERVED_SLUGS` env var, comma-separated).
- `*.localhost` works in local development.
- Unknown slugs 404; non-published advisors 404; suspended advisors show an unavailable page.

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
  Consider Cloudflare Images or a custom loader for production.
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
- `npx wrangler deploy --dry-run` → config valid; 91 asset files; `ASSETS` binding.
- `npm run build`, `npm run typecheck`, `npm run lint`, `npm run test` all pass.
- Runtime (dev): default Malay, `mh_lang=en` renders English, `/sa/nik` works,
  `/sa/syuhadamc` → 404, subdomain rewrite works, sitemap lists only active advisors.

Nothing has been deployed, no DNS/SSL changed, and no secrets were committed.

---

## 11. First public launch — exact external steps

The first controlled launch exposes **two pages only**:

- `https://movonhub.com.my` — MOVONHUB Coming Soon (dark-only)
- `https://nik.movonhub.com.my` — Nik's SA microsite

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
