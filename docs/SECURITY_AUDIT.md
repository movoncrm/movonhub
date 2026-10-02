# MOVONHUB Phase 2 - Security Audit

Date: 2026-10-02
Scope: full Next.js App Router application on Cloudflare Workers (OpenNext) with Supabase.
Status legend: FIXED (change applied in this phase) or OPEN (still required).

This document is a point-in-time review. It does not guarantee that the system is
secure. Several items require external configuration or legal review and are
marked accordingly. Nothing in this phase was committed, pushed, merged or
deployed.

## 1. Scope inspected

| Area | Files |
| --- | --- |
| Host routing / middleware | `src/middleware.ts` |
| Authentication | `src/app/(auth)/login/actions.ts`, `register/actions.ts`, `logout/actions.ts` |
| Session handling | `src/lib/auth/session.ts` |
| Password hashing | `src/lib/auth/password.ts` |
| Authorisation | `src/app/admin/actions.ts`, `src/app/dashboard/actions.ts`, `src/lib/auth/session.ts` |
| Data access | `src/lib/db/*`, `src/lib/services/*` |
| Validation | `src/lib/validation.ts` |
| Uploads | `src/lib/storage.ts` |
| Enquiries | `src/app/api/enquiries/route.ts`, `src/lib/services/enquiries.ts` |
| Supabase schema / RLS | `supabase/migrations/*.sql` |
| Headers / metadata | `next.config.mjs`, `src/app/*/page.tsx`, `src/app/sitemap.ts`, `robots.ts` |
| Environment | `.env.example`, `.dev.vars.example`, `wrangler.jsonc` |

## 2. Findings

### Critical

#### C1 - Advisor password hashes and private email exposed through RLS
- Risk: Anyone holding the public anon key could read every published advisor row, including `password_hash` and `email`, by calling the Supabase REST API directly. Password hashes enable offline cracking; emails are personal data.
- Affected: `supabase/migrations/0001_init.sql` policy `public read active advisors` used `for select using (active = true)` with no column restriction.
- Exploit: `GET https://<project>.supabase.co/rest/v1/advisors?select=*` with the anon key.
- Mitigation: migration `0003_security_content_settings.sql` revokes direct `select` on `public.advisors` from `anon`/`authenticated`, drops the wide policy, and exposes a safe projection view `public.public_advisors` (no hash, no email). The app reads advisors server-side with the service role.
- Status: FIXED.

#### C2 - Stored XSS through the JSON-LD script block
- Risk: The advisor page embedded `JSON.stringify(jsonLd)` inside `<script type="application/ld+json" dangerouslySetInnerHTML>`. `JSON.stringify` does not escape `<`, so a crafted advisor name or bio such as `</script><script>...</script>` could break out and execute.
- Affected: `src/app/sa/[slug]/page.tsx` (jsonLd block).
- Exploit: Set an advisor display name containing `</script><script>alert(document.cookie)</script>`, then load the public page.
- Mitigation: new `safeJsonLd()` helper escapes `<`, `>`, `&`, U+2028 and U+2029 before embedding.
- Status: FIXED.

### High

#### H1 - No practical login throttling
- Risk: The only rate limiter was an in-memory Map used on the enquiry endpoint. The admin password and advisor logins had no throttling, so credentials could be brute forced without limit.
- Affected: `src/app/(auth)/login/actions.ts`, `src/lib/rateLimit.ts`.
- Mitigation: added a durable limiter. The app calls `consumeLimit`, which uses the Supabase `consume_rate_limit` SQL function (atomic fixed window, cross-instance) and falls back to the in-memory limiter only when no durable backend is available. Login is limited per client IP and per username.
- Status: FIXED. External step: apply migration `0003`.

#### H2 - Account enumeration and open account creation
- Risk: Login previously returned a distinct "profile is not active" message, confirming that a username exists. `/api/advisors/check` confirmed username existence without throttling. `/register` allowed anyone to create a published advisor page.
- Affected: `login/actions.ts`, `src/app/api/advisors/check/route.ts`, `src/app/(auth)/register/*`.
- Mitigation: login now returns a single generic error for bad credentials, inactive accounts and suspended accounts. The availability check is throttled. Public self-registration is disabled by default (`ALLOW_PUBLIC_REGISTRATION`), so Super Admin onboards advisors from `/admin`.
- Status: FIXED. Note: username availability is inherently visible during onboarding; throttling raises the cost of scripted discovery.

#### H3 - Anonymous enquiry insertion policy
- Risk: `public insert enquiries` used `with check (true)`, allowing unauthenticated spam and the ability to set arbitrary `advisor_id`, `status` and `channel`.
- Affected: `supabase/migrations/0001_init.sql`.
- Mitigation: the policy is dropped in `0003`. The app records enquiries server-side with the service role, so anonymous inserts are not required. The HTTP endpoint additionally caps body size and is rate limited.
- Status: FIXED.

#### H4 - Long-lived, non-rotating session cookie
- Risk: Sessions lasted 30 days. Because the token is a stateless HMAC cookie, a leaked token stayed valid until expiry and could not be revoked server-side; logout only cleared the browser cookie.
- Affected: `src/lib/auth/session.ts`.
- Mitigation: expiry reduced to 7 days, an `iat` issue time is recorded, and a fresh token is issued on each login (rotation). Cookies remain `HttpOnly`, `Secure` in production, `SameSite=Lax`, scoped to `/`.
- Status: PARTIALLY FIXED. Residual limitation: stateless sessions cannot be server-invalidated before expiry. If immediate revocation is required, move to a server-side session table or Supabase Auth.

#### H5 - Public self-registration enabled by default
- Risk: Any visitor could create an advisor account and a live public microsite without approval.
- Affected: `src/app/(auth)/register/actions.ts` and page.
- Mitigation: `registrationEnabled()` defaults to false; the action refuses and the page shows a notice. Enable only with `ALLOW_PUBLIC_REGISTRATION=true`.
- Status: FIXED.

### Medium

#### M1 - Incomplete security headers
- Risk: No HSTS, CSP or Permissions-Policy; weaker defence against transport downgrade, injected content and feature abuse.
- Affected: `next.config.mjs`.
- Mitigation: added HSTS (production only), CSP, Permissions-Policy, `X-DNS-Prefetch-Control`, retaining `X-Content-Type-Options`, `Referrer-Policy` and `X-Frame-Options`.
- Status: FIXED with documented residual: the CSP allows `'unsafe-inline'` for scripts and styles because Next injects inline bootstrap/flight scripts and inline styles. Tightening this requires nonces/hashes and is listed as future work.

#### M2 - In-memory-only rate limiting
- Risk: Limits were per isolate and reset on cold starts; not a real control at scale.
- Mitigation: see H1. Durable SQL-backed limiter in production, memory fallback for local dev.
- Status: FIXED.

#### M3 - Weak password policy
- Risk: Minimum of 6 characters with no composition requirement.
- Affected: `src/lib/validation.ts`.
- Mitigation: minimum 8 characters plus at least one letter and one number. Applies to registration, admin onboarding and password changes.
- Status: FIXED. Residual: no breached-password or reuse checks.

#### M4 - Upload validation trusts the client MIME type
- Risk: `saveAdvisorPhoto` checks `file.type` and size, both supplied by the client. A renamed file could be uploaded to the public storage bucket. Impact is limited because the object is served with the declared image content type and stored in a public bucket, but it is not true content validation.
- Affected: `src/lib/storage.ts`.
- Mitigation: not changed in this phase to avoid altering upload behaviour. Recommended: verify magic bytes server-side, restrict the bucket to image MIME types and consider a private bucket with signed URLs.
- Status: OPEN (Medium).

#### M5 - Unbounded enquiry request body
- Risk: `request.json()` had no size limit.
- Mitigation: `content-length` cap of 16 KB plus zod field length caps.
- Status: FIXED.

#### M6 - Rate-limit key trusted `x-forwarded-for`
- Risk: The first `x-forwarded-for` value is client-controllable in some setups, allowing limiter evasion.
- Mitigation: `clientIp()` prefers Cloudflare's `cf-connecting-ip`, then `x-real-ip`, then `x-forwarded-for`.
- Status: FIXED.

#### M7 - No audit trail
- Risk: Sensitive Super Admin actions left no record.
- Mitigation: `public.audit_logs` table plus `logAudit()`. Events recorded: advisor created, status/activation/featured changed, settings changed, password reset initiated, content draft/published/reverted, login success/failure/throttled/blocked. No passwords, hashes, tokens or secrets are recorded.
- Status: FIXED. External step: apply migration `0003`.

#### M8 - Admin advisor update was not schema-validated
- Risk: `updateAdvisorAdmin` hand-parsed fields, so new fields and constraints could drift.
- Mitigation: `advisorSettingsSchema` validates all editable advisor fields including the new page settings.
- Status: FIXED.

#### M9 - Untrusted content in the new content editor
- Risk: A copy editor could introduce markup that is later rendered unsafely.
- Mitigation: content values are stored as plain text, length-bounded per field, and rendered through React text nodes only. No code path renders site content as raw HTML. The JSON-LD path is escaped (see C2).
- Status: FIXED.

### Low / Informational

| ID | Finding | Status / note |
| --- | --- | --- |
| L1 | Admin username is the fixed string `admin` | Accepted; documented in UI. |
| L2 | `adminNotConfigured` reveals whether an admin password is set | Accepted; not account-specific. |
| L3 | CSP requires `'unsafe-inline'` | OPEN; documented residual (M1). |
| L4 | Server actions rely on Next.js built-in origin checks for CSRF | Accepted; no additional token. Keep Next.js patched. |
| L5 | Local JSON adapter is the default data store | Informational. Not durable on Workers; production must use `DATA_ADAPTER=supabase`. |
| I1 | Service role key is used server-side only | Verified: never referenced under `NEXT_PUBLIC_*`. |
| I2 | RLS is a defence-in-depth layer | After `0003`, anon can read only `public_advisors`, products, categories, active promotions and settings. |

## 3. Authentication and authorisation model after this phase

- Super Admin authenticates with username `admin` and the server-side `ADMIN_PASSWORD`, compared with a timing-safe comparison.
- Sales Advisors authenticate against their stored `scrypt` hash.
- Roles: `admin` and `advisor` only. Server code checks the signed session on every protected action and page. UI hiding is not treated as security.
- Advisor data access is scoped by `advisorId` from the session (`requireAdvisorOwner`, dashboard actions, `listEnquiries({ advisorId })`).
- Password hashes use `node:crypto` scrypt. This must be confirmed on the deployed Workers runtime (`nodejs_compat`). If scrypt is unavailable or too slow on Workers, switch to Web Crypto PBKDF2 or Supabase Auth before onboarding many advisors. This is tracked as an external verification item.
- Logout clears the cookie. Stateless tokens cannot be revoked before expiry (see H4).

## 4. Supabase RLS summary after migration 0003

| Table | anon / authenticated | service_role |
| --- | --- | --- |
| `advisors` | no direct select; use `public_advisors` | full (server only) |
| `public_advisors` (view) | select (safe columns only) | n/a |
| `categories` | select | full |
| `products` | select where `status = 'active'` | full |
| `promotions` | select where active and within date window | full |
| `enquiries` | no access | full |
| `settings` | select | full |
| `site_content` | no access | full |
| `audit_logs` | no access | full |
| `rate_limits` | no access; function execute restricted to service_role | full |

## 5. Security headers applied

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:;
  font-src 'self' data:; connect-src 'self' https://*.supabase.co;
  frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload  (production only)
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-Frame-Options: SAMEORIGIN
X-DNS-Prefetch-Control: off
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
```

Verify after deployment with `https://securityheaders.com` and by loading the
main site, an advisor subdomain, the admin portal and the content editor. If the
CSP breaks any asset, adjust the specific directive rather than removing the
whole policy.

## 6. Remaining limitations and external requirements

1. Password hashing must be validated on the Workers runtime (see section 3).
2. Stateless sessions cannot be revoked mid-life (H4).
3. CSP uses `'unsafe-inline'` for scripts and styles (M1, L3).
4. Uploads are validated by declared MIME type only (M4).
5. `ALLOW_PUBLIC_REGISTRATION=false` and the new env vars must be set on the Worker.
6. Migration `0003` must be applied before the new rate limiter, content, audit and
   safe advisor view take effect.
7. Legal wording must be reviewed by Malaysian counsel (see the final report and
   `docs/CONTENT_EDITING_GUIDE.md`).
8. No independent penetration test has been performed. Treat this as a focused
   internal hardening pass, not a certification.
