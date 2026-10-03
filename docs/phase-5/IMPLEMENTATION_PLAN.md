# Phase 5 — Implementation Plan

> Status: **PLAN — awaiting approval.** No production migrations, deploys or data
> changes have been made. This plan is deliberately staged behind approval gates.

## 1. Goals

1. Add a secure, per‑SA **Leads Organizer** (the operational source of truth for
   a sale reaching NET and therefore for incentive counting).
2. Add a confidential, per‑SA **Incentive** view based on the official schemes.
3. Update **public product content** from the two customer promotion documents.
4. Keep all of it consistent with the existing architecture and security posture.

## 2. Architecture fit (existing patterns to reuse)

- Data access through the `DataStore` interface (`src/lib/db/store.ts`) with two
  adapters: `LocalStore` (`src/lib/db/local.ts`) and `SupabaseStore`
  (`src/lib/db/supabase.ts`). New entities must be added to **both**.
- Auth via signed cookie session (`src/lib/auth/session.ts`); ownership helpers
  `requireAdvisorOwner` / `requireRole` already exist.
- Server Actions for mutations (`src/app/dashboard/actions.ts` pattern) with Zod
  validation (`src/lib/validation.ts`).
- Supabase migrations are additive, idempotent and non-destructive
  (`supabase/migrations/000N_*.sql`).
- Bilingual strings in `src/i18n/en.ts` + `src/i18n/ms.ts`; editable copy via
  `site_content`.
- Pure logic in `src/lib/*.ts` with Vitest tests in `src/lib/__tests__/`.

## 3. Security design (non-negotiable)

| Control | Implementation |
| --- | --- |
| Authn | Every leads/incentive page + action requires a valid session |
| Authz (app) | `requireAdvisorOwner(advisorId)`; admin override only where intended |
| Authz (DB) | RLS: `advisor_id = auth.uid()`-equivalent via claim, plus service-role server access |
| No IDOR | Never trust a client-supplied advisor id; derive owner from session |
| No public exposure | Incentive tables/pages `robots: noindex`, `dynamic = "force-dynamic"`, no cache |
| PII | Customer contact stored, never logged in audit metadata; no public read policy |
| Secrets | Service-role key server-only; never imported client-side |
| Audit | Append to `audit_logs` for lead/incentive mutations without amounts/PII |

Because the current auth is **custom cookie sessions** (not Supabase Auth), RLS
cannot directly use `auth.uid()`. The plan therefore:
- keeps the **service-role server path** for all reads/writes (as today), and
- adds **defence-in-depth RLS** that denies all access to `anon`/`authenticated`
  for the new tables (no public policies), so a leaked anon key cannot read them.
This matches the existing `site_content` / `audit_logs` / `enquiries` model.

## 4. Data model (migration `0004_leads_incentives.sql`)

### `public.leads`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | |
| `advisor_id` | uuid → advisors(id) | owner; indexed |
| `customer_name` | text | |
| `contact_raw` | text | exactly as entered |
| `contact_normalized` | text | `60XXXXXXXXX`, indexed (dedupe) |
| `whatsapp_link` | text | derived, stored for convenience |
| `status` | text | constrained enum (see §5) |
| `proxy_owner` | text | optional |
| `location` | text | |
| `product_interest` | text | |
| `product_id` | uuid → products(id) | optional link |
| `remarks` | text | |
| `created_at` | timestamptz | |
| `last_follow_up_at` | timestamptz | |
| `net_date` | date | set when status reaches NET |
| `incentive_month` | text | `YYYY-MM`, derived from NET date |
| `source_enquiry_id` | uuid → enquiries(id) | optional link |

### `public.incentive_records` (confidential)

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | |
| `advisor_id` | uuid → advisors(id) | owner; indexed |
| `period` | text | `YYYY-Qn` or `YYYY-MM` |
| `scheme` | text | e.g. `SA_SBI`, `SA_PERIODIC_DUO`, `SA_PERSONAL_COMMISSION` |
| `units` | numeric | countable units |
| `amount` | numeric | computed or admin-entered |
| `status` | text | `draft` / `confirmed` / `paid` |
| `computed_at` / `confirmed_at` | timestamptz | |
| `notes` | text | |

Both tables: `enable row level security`; **no** public policies; indexes on
`advisor_id`, `status`, `net_date` / `period`.

## 5. Lead statuses

Proposed canonical set (mapped from the business language X REPLY / X LULUS /
X MINAT, subject to confirmation in §10):

`NEW → CONTACTED → NO_REPLY → INTERESTED → FORM → QUALIFIED → NET → REJECTED / CANCELLED`

- `NET` is the only status that counts toward incentive units.
- Existing term mapping is a **business decision** and will be finalised before
  the enum is frozen.

## 6. Code changes

1. `src/lib/types.ts` — add `Lead`, `LeadStatus`, `IncentiveRecord` types.
2. `src/lib/leads.ts` — pure logic: status transitions, contact normalisation,
   dedupe helper, `netDate`/`incentiveMonth` derivation.
3. `src/lib/incentive.ts` — pure, unit-tested calculator for the **confirmed**
   schemes (SA personal commission, SA SBI, periodic tiers). Inputs are raw
   facts; output is a breakdown. No hard-coded rates in UI.
4. `src/lib/db/store.ts` + `local.ts` + `supabase.ts` — CRUD for leads and
   incentive records, always scoped by `advisorId`.
5. `src/lib/validation.ts` — `leadSchema`, `leadStatusSchema`.
6. `src/app/dashboard/leads/page.tsx` + `actions.ts` — per‑SA leads list, create,
   update status, follow-up date; server-side owner checks.
7. `src/app/dashboard/incentive/page.tsx` — per‑SA confidential incentive view.
8. `src/app/dashboard/page.tsx` — nav to new sections; real lead counts.
9. i18n (`en.ts`, `ms.ts`) — new keys for both.
10. Admin (optional, later gate) — view/confirm incentives across SAs.

## 7. Public product content

- Update catalogue/promotions from `PRODUCT_CONTENT.md` only, after sign-off on
  which products/prices to publish.
- Add bilingual copy; show effective dates and "refer to MEMO" advisory.
- Never touch incentive data from public code.

## 8. Testing & verification

- Unit tests: `leads.ts`, `incentive.ts` (threshold boundaries, unit-count rules,
  arrears rule).
- Isolation tests: an SA cannot read/update another SA's lead or incentive
  (extend `src/lib/__tests__/dataIsolation.test.ts`).
- Run: `npm run typecheck`, `npm run lint`, `npm test`.
- Build checks: `npm run build`; Cloudflare `npm run cf:check` before any deploy.
- Migrations are verified on a **staging/local** Supabase project first.

## 9. Rollout gates

| Gate | Action | Approval needed |
| --- | --- | --- |
| G0 | This plan | **Yes — now** |
| G1 | Add migration `0004` + code (local adapter only) | Yes |
| G2 | Apply migration to staging | Yes |
| G3 | Apply migration to production | **Yes — explicit** |
| G4 | Publish product content updates | Yes (business sign-off) |
| G5 | Deploy to Cloudflare | **Yes — explicit** |

## 10. Decision points blocking G1

1. **Compute vs track** incentives in-app.
2. **Roles** to support first (recommend Star Advisor).
3. **Qualifying NET** definition and period attribution.
4. **Lead status** set and mapping of X REPLY / X LULUS / X MINAT.
5. **Public content** scope and approver.
6. Whether an authoritative **MEMO** supersedes the PDFs.

No code, migration or content change will be made until G0 is approved.
