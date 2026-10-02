# MOVONHUB Phase 2 - Final Report

Date: 2026-10-02
Scope: security hardening, wildcard subdomain readiness, SA page settings,
bilingual content management and legal disclaimers.

No commit, push, merge or deploy was performed. No destructive database change
was made. No secrets were printed.

## 1. Security audit findings

Full detail in `docs/SECURITY_AUDIT.md`. Summary:

- 2 Critical: advisor password hash and email exposure through RLS; stored XSS
  through the JSON-LD script block.
- 5 High: no login throttling; account enumeration and open self-registration;
  anonymous enquiry insert policy; long-lived non-rotating session; public
  self-registration enabled by default.
- 9 Medium: incomplete security headers; in-memory-only rate limiting; weak
  password policy; upload MIME trust; unbounded enquiry body; spoofable limiter
  key; no audit trail; unvalidated admin advisor update; untrusted content in the
  new editor.
- 5 Low/Informational: fixed admin username; config disclosure; CSP
  `'unsafe-inline'`; CSRF reliance on Next.js; local JSON adapter default.

## 2. High-risk issues fixed

- RLS: dropped the wide advisor select policy, revoked anon select, added the
  safe `public_advisors` view.
- XSS: escaped JSON-LD output with `safeJsonLd()`.
- Login throttling: durable Supabase-backed limiter (per IP and per username)
  with an in-memory fallback.
- Enumeration: generic login errors for bad, inactive and suspended accounts;
  throttled the availability check.
- Open registration: disabled by default behind `ALLOW_PUBLIC_REGISTRATION`.
- Enquiries: removed the anonymous insert policy; added body size cap and rate
  limiting.
- Sessions: 7-day expiry, issue time recorded, rotation on login.
- Audit trail: `audit_logs` plus `logAudit()` wired into sensitive admin and auth
  events, with no secrets recorded.
- Input validation: new `advisorSettingsSchema`, content enums, strengthened
  password policy (8+ characters, letter and number), `cf-connecting-ip` for
  limiter keys.
- Headers: CSP, HSTS (production), Permissions-Policy and related headers.

The fixes are in code. Most only take effect once migration `0003` and the
updated Worker environment are applied.

## 3. Remaining security limitations

- Stateless sessions cannot be revoked before expiry. Move to a server-side
  session store or Supabase Auth if immediate revocation is required.
- `scrypt` password hashing must be verified on the Workers runtime. Switch to
  Web Crypto PBKDF2 or Supabase Auth if it is unavailable or too slow.
- CSP allows `'unsafe-inline'` for scripts and styles.
- Uploads are validated by declared MIME type, not file content.
- No independent penetration test has been performed.
- Username availability remains visible during onboarding (throttled).

## 4. Database migrations created

`supabase/migrations/0003_security_content_settings.sql` (idempotent, additive,
non-destructive):

- `advisors`: `default_locale`, `allow_language_toggle`, `allow_theme_toggle`.
- `site_content`: scope, advisor, key, locale, value, status, updated_by,
  updated_at, with a unique index (`nulls not distinct`).
- `audit_logs`: actor, role, action, target, metadata, timestamp.
- `rate_limits` plus the `consume_rate_limit` atomic function.
- RLS: safe `public_advisors` view, removed wide advisor read policy and
  anonymous enquiry insert policy.

Existing advisor data is preserved. Defaults are applied to existing rows.

## 5. SA language and theme controls implemented

- New fields: `default_locale` (`en`/`ms`), `default_theme` (uses existing
  `preferred_theme`, `dark`/`light`), `allow_language_toggle`,
  `allow_theme_toggle`, and existing publication status (`draft`/`published`/
  `suspended`).
- Admin UI: "Personal Page Settings" on each advisor in `/admin`, plus the same
  defaults when creating an advisor.
- Public behaviour: a first-time visitor sees the advisor's configured language
  and theme. A stored visitor preference overrides the default only when the
  toggle is enabled. Disabled toggles are hidden and the configured default is
  enforced. Visitor preferences never write back to the advisor configuration.
- Logic is isolated in `src/lib/saSettings.ts` and unit tested.

## 6. Bilingual content editor implemented

- Route `/admin/content`, Super Admin only.
- Three areas: Main website, SA pages (all advisors), and One advisor only.
- English and Bahasa Melayu tabs, labelled inputs and text areas, live preview,
  character counts, SEO badges, Save draft, Publish and Revert to default, plus an
  unsaved-changes warning.
- Storage: `site_content` table with typed keys, locale values, draft/published
  status and update attribution. Resolution order: advisor override, SA global
  default, main-site override, built-in dictionary default. A missing or
  failed content table always falls back to built-in copy, so the public site
  cannot be blanked by a data problem.
- Copy is plain text only. It is rendered through React text nodes; no path
  renders site content as raw HTML.
- Guide: `docs/CONTENT_EDITING_GUIDE.md`.

## 7. Disclaimer implementation

- Configurable main website disclaimer and per-advisor microsite disclaimer in
  both languages, editable through the content editor.
- The main footer and the advisor footer show a visible disclaimer with a link to
  the full disclaimer page.
- `/disclaimer` added, plus review notices on `/privacy` and `/terms`.
- Wording avoids claiming official Movon affiliation or legal approval.
- Entity, registration, address and contact details remain clearly marked
  placeholders.

## 8. Wildcard routing readiness

- Middleware already rewrites `{slug}.movonhub.com.my` to `/sa/{slug}` and is
  retained. `disclaimer` and `legal` were added to the reserved list. The full
  required reserved set is present (`www`, `admin`, `api`, `app`, `hub`, `login`,
  `register`, `dashboard`, `support`, `mail`, `assets`, `static`).
- Unknown slugs 404, draft advisors 404, suspended advisors show a generic page
  that does not confirm the account.
- Exact Cloudflare dashboard steps, reserved-name behaviour and post-setup tests
  are documented in `docs/DEPLOYMENT_CLOUDFLARE.md` section 7. Wildcard is NOT
  live until DNS, the wildcard certificate and the Worker custom domains are
  configured and tested.

## 9. Test results

- `npm run typecheck`: pass.
- `npm run lint`: pass (no warnings or errors).
- `npm run test`: 57 tests pass across 9 files, including content resolution and
  fallback, draft not public, XSS-as-text, SA language/theme precedence, disabled
  toggles, reserved subdomains, password policy, and advisor/enquiry data
  isolation.
- `npm run build`: pass (14 routes including `/admin/content` and `/disclaimer`).
- `npm run cf:check` (`opennextjs-cloudflare build` + `wrangler deploy --dry-run`):
  pass. Worker bundle generated, 103 asset files, expected env bindings, no upload.

## 10. External configuration still required

- Apply Supabase migration `0003` (after a verified backup).
- Set Worker vars: `DATA_ADAPTER=supabase`, `NEXT_PUBLIC_SITE_URL`,
  `NEXT_PUBLIC_ROOT_DOMAIN`, `NEXT_PUBLIC_UNOPTIMIZED_IMAGES=true`,
  `ALLOW_PUBLIC_REGISTRATION=false`; confirm secrets `SESSION_SECRET`,
  `ADMIN_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`; set `SUPABASE_URL` at runtime.
- Configure wildcard DNS, wildcard certificate and Worker custom domains
  (`movonhub.com.my`, `www`, `*`).
- Verify scrypt password hashing on the Workers runtime.
- Optional: Supabase-native rate limiting rules as an additional Cloudflare layer.
- Optional: stronger upload validation and a private storage bucket.
- Optional: CSP nonces to remove `'unsafe-inline'`.

## 11. Legal review items

- Review the main disclaimer and SA microsite disclaimer wording.
- Complete `/privacy` and `/terms` and supply entity name, registration number,
  registered address and privacy contact (currently placeholders).
- Confirm the independent-operator and non-affiliation statements.
- Confirm data retention, enquiry handling and WhatsApp data language.
- No text implies Movon authorisation or legal sufficiency.

## 12. Exact next steps for controlled production release

1. Get approval for these changes before any commit, push or deploy.
2. Take and verify a Supabase backup (`docs/BACKUP_RECOVERY.md`).
3. Apply migration `0003` in a staging project first, then production.
4. Set the Worker vars and secrets; keep `ALLOW_PUBLIC_REGISTRATION=false`.
5. Configure wildcard DNS, certificate and Worker domains; run the section 7.4
   tests.
6. Deploy a staging build and run the manual checks: admin login, content
   draft/publish/revert, SA default language and theme, disabled toggles,
   unknown and suspended subdomains, headers, and enquiry attribution.
7. Verify advisor login on the Workers runtime (scrypt).
8. Publish approved content and disclaimers via `/admin/content`.
9. Complete legal review and fill the placeholders before public launch.
10. Only then merge to the release branch and deploy production, with rollback
    ready (`docs/BACKUP_RECOVERY.md`).
