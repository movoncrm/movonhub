# MOVONHUB — Development Log

## 2026-10-02 — First public launch preparation (Coming Soon + Nik SA page)

### Scope
- Controlled first launch exposing only two public experiences: the MOVONHUB Coming Soon page
  (`movonhub.com.my`) and Nik's SA microsite (`nik.movonhub.com.my`). Full SA ecosystem remains
  in the codebase but is not linked publicly.

### Page 1 — Coming Soon (`/`, dark-only)
- Replaced the long landing page with a minimal premium dark announcement: ambient glow, original
  logo + two-tone MovonHub wordmark, label, "Something Exciting Is Coming.", supporting copy,
  "COMING SOON" status, primary CTA to `https://nik.movonhub.com.my`, and a configurable
  "Contact MOVONHUB" action (`NEXT_PUBLIC_CONTACT_WHATSAPP`, else `/contact`).
- No product listings, no AI/calculator/leads access, no login/dashboard shortcuts, no light/dark
  toggle. EN|BM toggle retained.
- Absolute SEO title/description: "MOVONHUB | The Digital Hub for Movon Sales Advisors" /
  "The central digital hub for Movon Sales Advisors. Coming soon."

### Page 2 — Nik SA microsite (`/sa/nik`, `nik.movonhub.com.my`)
- Seed WhatsApp updated to `601113002181` (display `+60 11-1300 2181`); WhatsApp links use
  `https://wa.me/601113002181` (no plus).
- Header now shows the logo/wordmark, Nik's name, WhatsApp action, dark/light toggle and EN|BM.
- Hero: "Make Everyday Living Easier with Movon." + "Hi, I'm Nik. Explore Movon home and lifestyle
  solutions, and get personal assistance with your enquiries." + "Chat with Nik".
- Product showcase uses real project data (no invented prices/promos/specs); missing prices show
  "Contact Nik for details"; each card has an attributed WhatsApp enquiry.
- Final CTA + footer with MovonHub branding, role and WhatsApp contact. Profile photo remains the
  "N" initials placeholder (photoUrl empty) and is replaceable via the advisor profile.
- Absolute SEO title/description: "Nik | Movon Sales Advisor" / "Explore Movon home and lifestyle
  products and contact Nik for personal assistance."

### Routing & SEO
- Subdomain middleware unchanged: `{slug}.movonhub.com.my` → `/sa/{slug}` (compat route kept);
  canonical/OG URL = subdomain; reserved subdomains ignored; unknown slugs 404.
- Sitemap trimmed for launch to main + legal + published advisor subdomains (product pages dropped).
- `robots.txt` disallows `/sa/` (non-canonical), `/hub`, `/dashboard`, `/admin`, `/api/`.

### QA (this pass)
- `tsc --noEmit` clean · `next lint` clean · **33 Vitest tests pass** · `next build` ✅ ·
  `cf:build` ✅ · `wrangler deploy --dry-run` ✅ (99 assets).
- Runtime: `/` Coming Soon (correct titles, dark-only, no private links/product data, CTA to
  nik subdomain); `/sa/nik` 200 with WhatsApp `601113002181`, products, theme toggle, canonical
  subdomain; `Host: nik.movonhub.com.my` resolves the microsite; `admin.movonhub.com.my` ignored;
  `/sa/unknown` 404; `/hub` 307; sitemap 5 URLs with `https://nik.movonhub.com.my`; enquiry
  attributed to `adv_demo_nik`.

## 2026-10-02 — Access architecture, SA subdomains & Super Admin onboarding

### Public homepage (`/`) — marketing only
- Hero headline now bright (`#F8FAFC`) with supporting text `#CBD5E1`; dark layout and glow kept.
- Logo lockup now shows the original `MovonHub Logo.png` beside a two-tone "MovonHub" wordmark
  (M in the logo blue family, H in the slate family, remaining letters light) — same in nav/footer.
- Removed all public product listings/previews and links into `/products`.
- Removed the public "Explore MovonHub AI" and "Explore Commission Calculator" CTAs; the AI and
  calculator remain as previews with access labels ("Available to registered Movon SAs",
  "SA Login Required").
- "More Tools" cards are now informational only (no links/buttons); statuses are
  "Available to registered SAs" / "Coming Soon".
- Final CTA is a single "Contact MOVONHUB to Get Your Personal SA Page & Tools" action driven by
  the configurable `NEXT_PUBLIC_CONTACT_WHATSAPP` setting (falls back to `/contact`); no number
  is hardcoded.

### Access architecture
- `/hub` is the authenticated SA workspace (redirects unauth → `/login`, admin → `/admin`).
- SA login now redirects to `/hub` (admin → `/admin`). Private APIs remain server-authorised.
- `/hub` rebuilt: header with wordmark + profile menu + logout, "Welcome back, {name}", and a
  grid of **8 tools** (AI, Commission Calculator, Leads Organizer, Product Knowledge, Sales
  Content Studio, Customer Follow-up, My Sales Page, My Profile) with honest Live/Coming Soon
  states and a My-Sales-Page preview + copy-link.

### SA subdomains
- Middleware already rewrites `{slug}.ROOT_DOMAIN` → `/sa/{slug}`; canonical now points to
  `https://{slug}.movonhub.com.my` (metadata, Open Graph URL, share links, sitemap). `/sa/[slug]`
  is retained as a compatibility route. Extra reserved subdomains added; `RESERVED_SLUGS` env
  extends the reserved list. (Cloudflare wildcard DNS/TLS remains an external step.)

### Microsite dark/light theme
- Added a per-visitor theme toggle on the SA microsite (cookie `mh_theme`, defaults to the
  advisor's `preferredTheme`). The homepage stays dark-only with no toggle. Implemented via
  server-read cookie + conditional theme classes, so there is no hydration mismatch.

### Data model
- `Advisor` gains `status` (`draft` | `published` | `suspended`) and `preferredTheme`
  (`light` | `dark`); `active` kept in sync (published === active). Only published+active
  microsites are public; suspended shows an unavailable page; draft/unknown 404.
- Migration `supabase/migrations/0002_advisor_status_theme.sql` adds the columns and tightens the
  public RLS read policy to `active = true and status = 'published'`.

### Super Admin SA management (`/admin`)
- Nav rebuilt: Overview, Sales Advisors, Products, Promotions, Enquiries, Settings.
- Sales Advisors section is prominent: searchable list with name, slug, WhatsApp, account status,
  microsite status, personal URL (copy), and actions (Preview, status change, Reset access,
  Delete, Edit).
- **Add New SA** form: name, slug, WhatsApp, email, initial password (or generate), optional bio,
  default theme, status. On create it validates the username (reserved-aware), creates the record,
  generates the subdomain URL, and returns the URL + one-time password for the admin to share.
- Credentials are hashed (scrypt); generated passwords are shown once, never stored in plain text.

### QA (this pass)
- `tsc --noEmit` clean · `next lint` clean · **33 Vitest tests pass** · `next build` ✅ ·
  `cf:build` ✅ · `wrangler deploy --dry-run` ✅ (99 assets).
- Runtime: homepage bright/en-only dark with no product data or private links; `/sa/nik` 200 with
  theme toggle (light default, dark via cookie) and subdomain canonical; subdomain rewrite OK;
  `/sa/unknown` 404; `/hub` 307 → login; `/login` 200; sitemap uses `https://nik.movonhub.com.my`;
  reserved `hub`/`support` rejected; enquiry retains advisor attribution.

## 2026-10-02 — Dark "SA Command Centre" landing page

### Inspection
- Read the four docs and README; re-inspected the Next.js app, i18n, dashboard, advisor and
  product data.
- Located the **Movon AI project** at `..\2026 Movon AI` (a static web chat app). Its UI already
  brands itself **"MOVONHUB AI — Sales Assistant"**. The clean welcome capture
  `.playwright-mcp/composer-check.png` (390×844) was copied to
  `public/ai/movonhub-ai-mobile.png` and is shown as an **actual** interface capture. No AI
  functionality was fabricated; the tool remains "Coming soon" (no provider configured).
- `MovonHub Logo.png` (1536×1024, opaque white background) is the authoritative logo. The
  original is preserved at `public/brand/movonhub-logo-original.png`; a **whitespace-trimmed**
  derivative `public/brand/movonhub-logo.png` (805×475, artwork untouched, aspect preserved) is
  used in the header and footer. No redraw/recolour. On dark backgrounds it sits on a light
  plate so the original artwork stays legible.

### Homepage (replaced)
- `/` is now a long-form **dark, scroll-based landing page** (in a new `(landing)` route group
  with `DarkNav`/`DarkFooter`); the old light homepage was deleted. Sections:
  1. Navigasi — floating dark nav (Home, SA Tools, AI Assistant, SA Sample, EN|BM, Login).
  2. Hero — centred headline "Everything Your Sales Journey Needs." with a full SA dashboard
     interface preview (sidebar, stats, quick actions, activity) and blue ambient glow.
  3. "Your Sales World, Connected." platform chain.
  4. **MovonHub AI** showcase — representative desktop chat window + the actual mobile capture,
     four grounded capability highlights, "Coming soon" state.
  5. Personal SA page — browser + phone previews using real Nik data, linking to `/sa/nik`.
  6. Commission Calculator — interactive dark calculator (`estimateCommission`), labelled an
     estimate, no invented rates.
  7. Leads Organizer — clearly fictional sample lead cards, marked "Coming soon".
  8. "More Tools. More Possibilities." — six tool cards with honest Live/Coming Soon states.
  9. Final CTA + minimal dark footer with the original logo.

### Language
- **English is now the default locale** (`defaultLocale = "en"`) per this brief; BM remains fully
  supported via the EN|BM toggle (toggle order updated to EN first). Cookie persistence and the
  advisor microsite toggle are unchanged. Added a `landing` dictionary section (ms + en, parity
  enforced; no "anda").

### Design
- Added dark tokens: `night #050816`, `night-soft #080D20`, `night-card #0C1430`,
  `night-elevated #111C3A`, `electric #4C91FF` (existing brand blue/slate/gold retained).

### Preserved
- Advisor auth, registration, dashboard, admin, product data, enquiry system + WhatsApp
  attribution, dynamic `/sa/[slug]` + subdomain routing, Supabase adapter, OpenNext/Cloudflare
  config, and all other public pages (`/products`, `/tools`, `/ai`, etc.).

### QA (this pass)
- `tsc --noEmit` clean · `next lint` clean · **33 Vitest tests pass** · `next build` ✅ (landing
  `1.25 kB`) · `cf:build` ✅ · `wrangler deploy --dry-run` ✅ (99 assets).
- Runtime: `/` EN default with all sections + real logo/AI capture; BM cookie renders Malay;
  `/sa/nik` intact; `/sa/unknown` → 404; `/login` 200; `/hub` → 307; both PNGs served 200.

## 2026-10-02 — Repositioned as the Movon Sales Advisor Digital Hub

### Positioning
- Redefined MOVONHUB as **the central digital hub for Movon Sales Advisors** ("Everything a
  Movon SA needs, in one place"), not a corporate site or public catalogue.

### Homepage (simplified)
- Replaced the long marketing homepage with a focused landing page: hero with a
  dashboard-inspired "SA Workspace" visual, a four-card **SA Toolkit** (AI Sales Assistant
  [coming soon], Commission Calculator [SA tool], Product Knowledge [live], My Sales Page
  [live]) and a **Personal Sales Page** preview for Nik.
- Minimal header (Home, SA Sample, Login, BM | EN) and a minimal footer.

### Nik SA sample microsite (`/sa/nik`)
- Redesigned as a personal, mobile-first sales page: advisor profile + hero, short intro,
  curated **Featured Products** grouped by category (Aircond, Refrigerator, Washer/Washer
  Dryer, Smart lock, Baby & Travel) with WhatsApp enquiry attribution, **Why contact Nik?**,
  and a prominent final WhatsApp CTA + share.
- Seed updated: single advisor **Nik** ("Movon Sales Advisor"), suggested introduction;
  no fabricated achievements, testimonials, prices or promotions.

### SA workspace (`/hub`)
- Added an authenticated workspace overview (reuses the existing session/dashboard) with the
  four core tools, links to the existing dashboard (profile + enquiries), and a
  **Commission Calculator**.
- Commission Calculator uses a pure `estimateCommission` helper with a **configurable rate**
  (sample default, clearly labelled as an estimate — no invented commission structure).

### i18n
- Restructured `home`/`footer` dictionaries, added `sa` and `hub` sections; removed the old
  `advisor` section. `en` remains typed against `ms` (key parity test) and no "anda" is used.
- Defaults to Bahasa Melayu with the BM | EN toggle preserved on every page.

### Preserved (not removed)
- Advisor auth, registration, dashboard, admin portal, product data/CRUD, enquiry submission
  and WhatsApp attribution, `/sa/[slug]` dynamic + subdomain routing, SEO/JSON-LD/canonical,
  sitemap, Supabase adapter and OpenNext/Cloudflare config. `/products`, `/tools`, `/ai` remain
  reachable even though the main navigation is now minimal.

### QA (this pass)
- `tsc --noEmit` clean · `next lint` clean · **33 Vitest tests pass** (added commission tests) ·
  `next build` succeeds (new `/hub` route) · `cf:build` succeeds · `wrangler deploy --dry-run`
  validates the Worker (93 assets).
- Runtime: Malay default, English toggle, `/` shows the simplified hub landing, `/sa/nik` shows
  the sample microsite (all sections + featured products), `/sa/unknown` → 404, `/hub`
  unauthenticated → 307 to `/login`, enquiry API recorded with `advisorId = adv_demo_nik`.

### Notes
- No commits or pushes made. Deployment/DNS/Supabase steps remain external as documented.

## 2026-10-01 — Brand redesign, bilingual platform, Cloudflare readiness

### Discovery
- Located the design reference: `MovonHub Logo.png` (MH monogram — blue M + slate H).
- Re-inspected structure, configs, middleware, adapters and git state (local repo has
  no commits/remote; working tree is the reference implementation).

### Design
- Rewrote the Tailwind theme around reference-derived tokens and CSS variables
  (`src/app/globals.css` + `tailwind.config.ts`): primary `#1E7BFF`/`#0B4FD8`,
  secondary slate `#5B6B7F`/`#2B3947`, background `#F5F7FA`, etc.
- Created new brand assets: `mark.svg`, `logo.svg`, `logo-light.svg`, `favicon.svg`.
- Updated Button/Badge/SectionHeading/cards/nav/footer to the tokens.

### Bilingual (Bahasa Melayu default)
- New `src/i18n/` architecture: `config.ts`, `ms.ts`, `en.ts`, `index.ts` (pure),
  `server.ts` (cookies). Client `LanguageProvider` + `LanguageToggle`; server
  `getI18n()`.
- Locale persisted in cookie `mh_lang`; toggle updates instantly and calls
  `router.refresh()` (no full reload, no hydration mismatch).
- Translated the entire public site, auth, advisor microsites, dashboard and admin
  portal; `en` is typed against `ms` (key parity enforced by test). No "anda" in
  Malay copy (enforced by test).

### Advisor change (per request)
- Removed the Syuhada advisor: dropped from `src/data/seed.ts`, featured list, and
  deleted legacy `old/assets/agents/syuhadamc.*`. Only **Nik** remains (`/sa/nik`).

### Cloudflare / hosting
- Evaluated options; selected **`@opennextjs/cloudflare`** (Next 15 App Router,
  server actions, middleware, `nodejs_compat`). Rejected static export and vinext.
- Added `wrangler.jsonc`, `open-next.config.ts`, `.dev.vars.example`, scripts
  (`cf:build`, `cf:preview`, `cf:check`, `cf:deploy`, `cf:typegen`) and the
  `NEXT_PUBLIC_UNOPTIMIZED_IMAGES` flag.
- Verified locally: `npm run cf:build` produced `.open-next/worker.js`;
  `wrangler deploy --dry-run` validated the Worker (91 assets, ASSETS binding).
- Documented DNS/SSL/wildcard, GitHub connection and Supabase production setup in
  `docs/DEPLOYMENT_CLOUDFLARE.md`. No deploy, DNS or account changes performed.

### QA (this pass)
- `tsc --noEmit` clean · `next lint` clean · **30 Vitest tests pass** (incl. new i18n
  and Cloudflare-adjacent checks) · `next build` and `cf:build` succeed.
- Runtime: default Malay, `mh_lang=en` renders English, `/sa/nik` OK,
  `/sa/syuhadamc` → 404, subdomain rewrite OK, sitemap lists only active advisors.

### Still external / outstanding
- Confirm `node:crypto` scrypt on the Workers runtime (else move to PBKDF2/Supabase Auth).
- Supabase project + migration + storage bucket; set `DATA_ADAPTER=supabase`.
- GitHub remote, Workers Builds, DNS records and wildcard certificate.
- No commits or pushes made.

## 2026-10-01 — Initial production-ready build

### Phase 1 — Discovery
- Inspected local workspace, the legacy `old/` static site, the remote `movoncrm/movonhub`
  repository, the official MOVON website (home, Space, Baby, Expert, promotions) and the
  `movon.cc` advisor-page reference.
- Produced `docs/PROJECT_AUDIT.md` and `docs/MOVON_OFFICIAL_CONTENT.md`.
- Decision: consolidate into a single Next.js application using the legacy concepts, not the
  remote scaffold (which was a near-empty stub).

### Phase 2 — Foundation
- Scaffolded Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS 3.
- Data layer with a repository interface and two adapters:
  - `LocalStore` (default) — JSON file at `src/data/db.json`, seeded from `src/data/seed.ts`.
  - `SupabaseStore` — server-side service-role adapter for production.
- Auth: scrypt password hashing + signed HttpOnly cookie sessions (`src/lib/auth`).
- Validation with Zod (`src/lib/validation.ts`), WhatsApp attribution helpers, rate limiting,
  image storage abstraction (local FS / Supabase Storage).
- Design system: Tailwind theme with MOVON palette, UI primitives, preserved legacy logo SVGs.

### Phase 3 — Public platform
- Landing page (hero, three pillars, featured advisors, products, promotions, tools, join CTA).
- Product catalogue + product detail pages, tools overview, MOVONHUB AI introduction,
  about, contact, privacy, terms.
- Responsive navbar/footer, dynamic metadata, sitemap and robots.

### Phase 4 — Star Advisor system
- Dynamic advisor microsites at `/sa/{slug}` sharing one central catalogue.
- Subdomain routing via `src/middleware.ts` (`{slug}.movonhub.com.my` -> `/sa/{slug}`).
- Onboarding at `/register`: name, phone, username (with live availability check), password,
  photo upload, optional bio/location/title. Generates the microsite automatically, auto-signs
  in and shows a success screen with copy-link, preview and WhatsApp sharing.
- Per-product and per-promotion WhatsApp enquiry buttons with advisor + product + source
  attribution. JSON-LD, Open Graph, canonical URLs per advisor.

### Phase 5 — Dashboards
- Advisor dashboard (`/dashboard`): profile edit, photo change, password change, share tools,
  enquiry statistics, logout. Owner-only, enforced server-side.
- Admin portal (`/admin`): advisor list (activate/deactivate/feature/delete/edit), product CRUD,
  promotion CRUD with active/date gating, featured-advisor management, data-adapter status.
- All admin mutations are server-side and admin-gated.

### Phase 6 — QA
- `tsc --noEmit` clean; `next lint` clean; `next build` succeeds.
- Vitest: 24 tests across utils, validation, WhatsApp builders and the advisor registration
  service (creation, duplicate rejection, reserved names, phone normalisation, persistence).
- Runtime smoke tests against `next start`: home, `/sa/nik`, subdomain rewrite, product detail,
  enquiry API (recorded with advisor attribution), username check, sitemap, robots, 404, admin
  redirect when unauthenticated.

### Decisions
- **English-first** public copy per brief; legacy was Bahasa-first.
- **Local adapter default** so Definition of Done C–H work without any external credentials.
- **Promotions seeded inactive** because exact mechanics/dates were not verifiable from official
  pages; admins activate them. Public pages hide inactive/expired promotions.
- **No fabricated product pricing.** Per-product rental/outright prices are left empty where MOVON
  does not publish them; expert service voucher prices are seeded from the official page.
- **AI is an interface only** (`src/lib/ai`) with a hard "not configured" state; no fake responses.

### Remaining / awaiting configuration
- Set `SESSION_SECRET`, `ADMIN_PASSWORD`, and (optionally) Supabase + AI env vars.
- Apply `supabase/migrations/0001_init.sql` and set `DATA_ADAPTER=supabase` for production persistence.
- Configure wildcard DNS + SSL for `*.movonhub.com.my`.
- Verify and activate promotions; enter per-product pricing when confirmed.
- Optional next steps: email notifications for enquiries, advisor analytics, image re-hosting,
  CRM/sales-portal integration (`sales.movon.com.my`), AI provider implementation.
