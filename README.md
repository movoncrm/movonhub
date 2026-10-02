# MOVONHUB

**The Digital Hub for Movon Sales Advisors.** Everything a Movon SA needs, in one place —
AI-powered sales assistance, commission calculations, customer enquiries and a personal sales page.

MOVONHUB is a private internal sales ecosystem, not a corporate website or a public
e-commerce catalogue. It has two distinct experiences:

- **MOVONHUB** — a premium **dark, scroll-based landing page** (`/`) introducing the SA
  workspace, plus the authenticated SA hub (`/hub`).
- **Nik SA** (`/sa/nik`) — a personalised, customer-facing sales microsite showing how
  every Movon SA can present products and receive enquiries.

> **First public launch:** only two experiences are published — the MOVONHUB **Coming Soon** page
> at `/` and **Nik's** SA microsite at `nik.movonhub.com.my` (compat path `/sa/nik`). The rest of
> the SA ecosystem is built but not linked publicly. See
> [`docs/DEPLOYMENT_CLOUDFLARE.md`](docs/DEPLOYMENT_CLOUDFLARE.md) §11 for the external steps.

- **Languages:** English (default) with a Bahasa Melayu (EN | BM) toggle — see [`docs/I18N.md`](docs/I18N.md)
- **Design:** dark SaaS landing built on the MOVONHUB brand tokens; authoritative original
  `MovonHub Logo.png` used in header/footer — see [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md)
- **Hosting:** GitHub + Cloudflare Workers (OpenNext) + Supabase — see [`docs/DEPLOYMENT_CLOUDFLARE.md`](docs/DEPLOYMENT_CLOUDFLARE.md)

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 3 with MOVONHUB design tokens
- Data adapters: local JSON (default) or Supabase (production)
- Auth: scrypt hashing + signed HttpOnly cookie sessions
- i18n: cookie-persisted locale (`ms` default), server + client dictionaries
- Validation: Zod · Tests: Vitest · Deployment: `@opennextjs/cloudflare` + Wrangler

## Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Dark MOVONHUB marketing landing page (no product listings/tools) |
| `/sa/[slug]` | Public | SA microsite compatibility route |
| `{slug}.movonhub.com.my` | Public | Canonical SA microsite (resolved via middleware) |
| `/hub` | SA only | SA workspace with 8 tools + commission calculator |
| `/dashboard` | SA only | Profile, photo, password, enquiries |
| `/admin` | Super Admin | Overview, Sales Advisors, Products, Promotions, Enquiries, Settings |
| `/register`, `/register/success` | Public | Advisor onboarding |
| `/login` | Public | SA (→ `/hub`) / admin (→ `/admin`) login |
| `/products`, `/products/[slug]` | SA tool | Product data (not linked from the public homepage) |
| `/tools`, `/ai`, `/about`, `/contact`, `/privacy`, `/terms` | Public | Supporting pages |
| `/api/enquiries`, `/api/advisors/check` | Public | JSON endpoints |

### Access & subdomains

- The public homepage is marketing only; private tools live behind `/hub` (server-authorised).
- Each SA gets a canonical microsite at `https://{slug}.movonhub.com.my` (wildcard DNS/TLS is an
  external deployment step). Reserved slugs (`www`, `admin`, `api`, `hub`, `support`, …) cannot be
  registered; extend via the `RESERVED_SLUGS` env var.
- Super Admin onboarding: **/admin → Sales Advisors → Add New SA** creates the record, the
  subdomain URL and a one-time initial password, and lets the admin preview/status/publish.
- SA microsites have a dark/light toggle (`mh_theme` cookie, default = advisor `preferredTheme`);
  the main homepage is dark-only.

## Quick start

```powershell
npm install
Copy-Item .env.example .env.local     # set SESSION_SECRET and ADMIN_PASSWORD
npm run dev                            # http://localhost:3000
```

Or double-click **`start.cmd`** to launch and open the browser, and **`stop.cmd`** to stop.

With the default `DATA_ADAPTER=local` the app is fully functional offline. The seed
contains one advisor, **Nik** (`/sa/nik`, password `movon123`). Admin login uses the
username `admin` and `ADMIN_PASSWORD`.

Generate a secret:
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Commands

```powershell
npm run dev          # development server
npm run build        # production build
npm run start        # run the production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run test         # Vitest
npm run cf:build     # build the Cloudflare Worker bundle (.open-next)
npm run cf:preview   # build + local Wrangler preview
npm run cf:check     # build + wrangler deploy --dry-run
npm run cf:deploy    # build + deploy (requires Cloudflare auth)
npm run cf:typegen   # generate CloudflareEnv types
```

## Environment variables (names only)

`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ROOT_DOMAIN`, `NEXT_PUBLIC_UNOPTIMIZED_IMAGES`,
`NEXT_PUBLIC_CONTACT_WHATSAPP`, `RESERVED_SLUGS`, `SESSION_SECRET`, `ADMIN_PASSWORD`,
`DATA_ADAPTER`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`.
Secrets are never committed.

## Deployment

See [`docs/DEPLOYMENT_CLOUDFLARE.md`](docs/DEPLOYMENT_CLOUDFLARE.md). Summary:

1. Push to a private GitHub repo (do not commit secrets).
2. Create a Cloudflare Worker via Workers Builds and set secrets.
3. Create a Supabase project, run `supabase/migrations/0001_init.sql` and
   `0002_advisor_status_theme.sql`, set Supabase vars and `DATA_ADAPTER=supabase`.
4. Point `movonhub.com.my`, `www` and `*.movonhub.com.my` at the Worker (Full-strict
   SSL + wildcard certificate) for advisor subdomains.
5. Deploy and verify.

## Project structure

```
src/
  app/            routes, route groups (site)/(auth), api, hub, dashboard, admin, middleware
  components/     ui, site chrome, catalogue, advisor, dashboard, admin, hub, register, i18n
  i18n/           config, ms, en, index (pure), server (cookies)
  data/seed.ts    initial catalogue/categories/advisor/promotions/tools
  lib/
    ai/           provider-agnostic AI boundary (no bundled provider)
    auth/         password hashing + cookie sessions
    db/           DataStore interface, LocalStore, SupabaseStore
    services/     advisors, catalogue, enquiries business logic
    commission.ts estimateCommission (pure) · validation.ts · whatsapp.ts · storage.ts
supabase/migrations/0001_init.sql
docs/  PROJECT_AUDIT · MOVON_OFFICIAL_CONTENT · DESIGN_SYSTEM · I18N · DEPLOYMENT_CLOUDFLARE · DEVELOPMENT_LOG
old/   legacy static implementation (preserved, not served)
```

## Legal

MOVONHUB is not the official MOVON website; it is operated for authorised Movon Sales
Advisors' promotional use. Product names, images and trademarks belong to their owners.
