# MOVONHUB — Project Audit

Retrieval date: 2026-10-01
Auditor: Senior Full-Stack Architect (automated implementation session)

## 1. Scope inspected

| Source | Location | Notes |
| --- | --- | --- |
| Local workspace | `C:\Users\DESB\Documents\2026 Personal\2026 MovonHub` | Contained only `old/` and an empty Git repo (no commits on `master`). |
| Legacy folder | `/old` | Static, no-build HTML/CSS/JS multi-agent landing page. |
| GitHub repo | `https://github.com/movoncrm/movonhub` | Accessible. Branches: `main` (HEAD `86b95dc`), `develop` (`d3dfb78`). |
| Official brand | `https://movon.com.my` (+ sub-pages) | Primary source of truth. |
| Advisor-page reference | `https://movon.cc/` and `/syuhadamc?agent=syuhadamc` | Concept reference only. Not copied. |

The remote repository was cloned to a temporary directory (not the workspace) so no local Git history was touched.

## 2. Findings — GitHub repository

The remote is an early, near-empty scaffold:

- `main` — single commit "Initial MOVON Hub landing page" containing `index.html`, `style.css`, `script.js`. The page is a hardcoded `<h1>🚀 MOVON HUB</h1>` with a WhatsApp `wa.link` button. `script.js` only logs to console.
- `develop` — three extra commits (`new structure`, `Add navigation`, `add hero section`) reorganised files into `assets/css/style.css` and `assets/js/script.js` but never merged to `main`.

Conclusion: the GitHub repo contributes no meaningful reusable application logic. Its only asset value is the confirmed remote and the branding intent.

## 3. Findings — legacy `old/` folder

A self-contained, well-written static "rent-to-own" landing page:

- `index.html` (359 lines) — Bahasa-first agent landing page with hero, why, collections, promos, 5-step order flow, comparison table, lead form, agent contact, join-us, about.
- `assets/js/config.js` — global defaults (brand, theme tokens, promo list, interest list).
- `assets/js/main.js` (235 lines) — resolves `?agent=<slug>` / `/<slug>`, fetches `assets/agents/<slug>.json`, deep-merges over defaults, renders everything client-side, builds `wa.me` links, validates a lead form and opens WhatsApp.
- `admin.html` — client-side-only "Add Agent" generator that produces a `<slug>.json` for manual upload; no upload, no auth, no server.
- `assets/css/style.css` — full responsive design system using CSS variables.
- `assets/agents/syuhadamc.json` + SVG — one sample advisor.
- Deployment hints: `_redirects`, `vercel.json`, `.htaccess`, `CNAME`, `README.md`.

### Reusable concepts (carried forward, re-implemented)
- Multi-tenant "one site, unlimited advisors" model keyed by slug.
- Advisor config fields: name, title, slug, phone (`60XXXXXXXXX`), display phone, email, photo, greeting, WhatsApp display name, optional theme accent.
- WhatsApp-first conversion with pre-filled `wa.me` deep links.
- Promotions modelled as data (badge, title, description) rather than hardcoded markup.
- Lead/enquiry form fields: name, phone, email, installation address, product interest, emergency contact name/phone/relationship.
- Product interest list (MOVON Space / Baby / Expert / Choice).

### Weaknesses / unfinished
- No backend: cannot create advisors, persist enquiries, upload photos, or authenticate anyone.
- Advisor creation is manual (download a file, rename a photo, redeploy).
- No real database, no admin auth, no advisor auth, no RBAC, no RLS.
- All advisor data and promos duplicated into each deployment; no central catalogue.
- Client-side language toggle is a placeholder (does not translate content).
- No SEO metadata per advisor beyond a static title; no OG image, sitemap, or canonical URLs.
- Promo prices/claims hardcoded in `config.js`.
- Duplicate promo card (`MERDEKA FEVER SALES`) present.
- Uses a hardcoded personal WhatsApp number as the default agent.

## 4. Chosen approach

Consolidate into **one modern application** that absorbs the legacy concepts and removes their limitations:

- **Stack**: Next.js (App Router) + TypeScript + Tailwind CSS. Server-side rendering for SEO, route handlers for API, `middleware.ts` for advisor subdomain routing.
- **Single app, dynamic routing**: `/sa/{slug}` and `{slug}.movonhub.com.my` both resolve to the same advisor component and data.
- **Data layer with adapters**: a repository interface with (a) a local JSON/FS adapter that makes the app fully functional with zero credentials, and (b) a Supabase adapter plus SQL migrations + RLS for production. Selected by env vars.
- **Auth**: signed HttpOnly cookie sessions. Local demo uses scrypt password hashes + env admin password; production can delegate to Supabase Auth. All authorisation is enforced server-side.
- **Image storage**: local `public/uploads` in dev; Supabase Storage adapter in production.
- **Catalogue/promos centralised** so admins update once and every advisor page reflects it.
- **AI**: interface + service abstraction only, gated on `AI_API_KEY`; no fabricated functionality.

## 5. Conflicts resolved

| Conflict | Decision |
| --- | --- |
| Two legacy implementations (remote scaffold vs `old/`) | Use `old/` as the functional reference; remote contributes nothing functional. Documented here. |
| Legacy used Bahasa Malaysia as default | New platform is English-first (per brief), RM / Malaysian formats retained. |
| "Subdomain per advisor" vs "single app" | Single app + middleware host rewrite to `/sa/{slug}`. No per-advisor codebase. |
| Supabase assumed vs no credentials available | Adapter pattern; local adapter is default so Definition of Done C–H work offline. |

## 6. Risks / limitations

- No Supabase project or DNS/SSL is assumed. Subdomain and cloud upload features are implemented but require deployment configuration (documented).
- Local JSON persistence is single-instance and not durable on serverless hosts; production must use the Supabase adapter.
- Product specifications beyond what MOVON publishes publicly are intentionally omitted (not invented). See `MOVON_OFFICIAL_CONTENT.md`.
