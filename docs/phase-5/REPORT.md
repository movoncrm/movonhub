# Phase 5 — Implementation Report

> Status: **Gate G1 complete (local code only).** No production migration,
> data change, publish or deploy has been performed.

## 1. Decisions applied

From the approval session:

- **Incentive module = estimation computed from leads.** Star Advisor only.
  No persistent payout table; figures are computed from NET leads.
- **Public product content**: study and prepare **all** products from the four
  source documents, add new products as **draft**, keep existing slugs/URLs
  intact, preserve source traceability, do not publish or deploy.
- **Gate G1 approved** for migration + code using the local adapter; production
  apply/deploy remain separately gated.

## 2. Deliverables

### 2.1 Documentation (`docs/phase-5/`)

| File | Purpose |
| --- | --- |
| `DOCUMENT_STUDY.md` | Summary of all four source documents, confidentiality, open questions |
| `PRODUCT_CONTENT.md` | Public-only product/promo tables + catalogue mapping |
| `SA_INCENTIVE_RULES.md` | **Confidential** commission/incentive rules (never public) |
| `IMPLEMENTATION_PLAN.md` | Staged plan + approval gates |
| `PRODUCT_INVENTORY.md` | Product preparation report (updated/new/missing/ready/draft) |
| `REPORT.md` | This report |

### 2.2 Leads Organizer

- `src/lib/leads.ts` — pure logic: statuses, contact normalisation, WhatsApp
  link, NET/incentive-month derivation, summary.
- `src/lib/types.ts` — `Lead`, `LeadStatus`, `LeadCategory`, `LeadPlanType`,
  `LeadPromotion`; `DatabaseShape.leads`.
- `src/lib/validation.ts` — `leadSchema` + enums.
- `src/lib/db/store.ts`, `local.ts`, `supabase.ts` — `listLeads` (scoped by
  `advisorId`), `getLeadById`, `createLead`, `updateLead`, `deleteLead`.
- `src/app/dashboard/leads/page.tsx` + `actions.ts` — per-SA page and server
  actions with ownership checks and audit logging.
- `src/components/dashboard/LeadsManager.tsx` — add/filter/update/delete UI.

### 2.3 Incentive estimation

- `src/lib/incentive.ts` — pure `estimateStarAdvisorIncentive`, `estimateByMonth`,
  and unit-count helpers for the SA schemes (personal commission, SBI, Momentum
  Duo, Momentum Booster). Documented assumptions are exported for the UI.
- `src/app/dashboard/incentive/page.tsx` — per-SA estimate with breakdown,
  SBI qualification, monthly grouping and assumptions.

### 2.4 Product preparation

- `src/data/phase5-products.ts` — 2 new categories and **30 new draft products**
  with `sourceRef` and documented pricing/rental/warranty.
- `src/data/seed.ts` — adds the new categories/products and enriches eight
  existing MOVON products with documented Q4 plans/prices (slugs unchanged).
- `src/lib/types.ts` + `supabase/migrations/0004_leads.sql` — `Product.sourceRef`
  and a `products.source_ref` column for traceability.

### 2.5 Database

- `supabase/migrations/0004_leads.sql` — `leads` table (constrained enums, owner
  FK, indexes) with **RLS enabled and no public policies**, `anon`/`authenticated`
  revoked; plus `products.source_ref`.

### 2.6 Internationalisation

- New `leads` and `incentive` namespaces added to `src/i18n/en.ts` and
  `src/i18n/ms.ts`.

## 3. Security posture

| Requirement | Implementation |
| --- | --- |
| Confidential incentive data never public | No public route/table; incentive is computed in a protected dashboard page |
| Each SA sees only own leads | `listLeads({ advisorId })` from the session; actions verify `lead.advisorId === session.advisorId` |
| No IDOR | Client-supplied ids are never trusted; ownership reloaded and checked server-side |
| RLS defence-in-depth | `leads` has RLS with no policies; `anon`/`authenticated` revoked |
| No caching/indexing of personal pages | `dynamic = "force-dynamic"` + `robots: noindex` on dashboard pages |
| PII protection | Contact kept in the confidential table; audit metadata records only status/category/plan |
| Secrets | Service-role key remains server-only (unchanged) |

The staff session uses a signed HTTP-only cookie (existing mechanism); all reads
and writes go through the service-role server path, matching the existing
`site_content` / `audit_logs` model.

## 4. Verification

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass (no warnings) |
| `npm test` | **100 passed** (12 files), including new `leads` and `incentive` tests and a lead data-isolation test |
| `npm run build` | Pass; `/dashboard/leads` and `/dashboard/incentive` compiled |

Tests cover: contact normalisation, status semantics, NET month derivation,
unit-count rules (including Duo 1.5 and RM12/Samsung 0.25), vacuum tiers, SBI
thresholds, Momentum Duo/Booster tiers, totals, month grouping, and lead
isolation between advisors.

## 5. Deviations from the plan

- `incentive_records` was **not** added. Per the "estimation" decision, figures
  are computed from leads; the approved plan's snapshot table is deferred.
- `Product.sourceRef` was added to carry traceability (the plan anticipated this
  need but did not name the field).

## 6. Gate status

| Gate | Status |
| --- | --- |
| G0 (plan) | Approved |
| G1 (migration + code, local) | **Complete** |
| G2 (apply migration to staging) | Pending |
| G3 (apply migration to production) | Pending — needs explicit approval |
| G4 (publish product content) | Pending — needs commercial approval |
| G5 (deploy to Cloudflare) | Pending — needs explicit approval |

## 7. Open business questions (still blocking production)

1. Qualifying NET definition and period attribution.
2. Which promotion MEMO governs final prices.
3. Confirmation of the SA unit-count conflicts (CUCKOO 0.5 vs 1; 0.25 vs 50%).
4. Approval to publish the "ready" products and final category naming.
5. Whether adjustment/reversal rules are needed.

## 8. Recommended next steps

1. Review this report and the product inventory.
2. Answer the open business questions.
3. On approval: apply `0004` to staging, run a migration dry-run, then production.
4. On commercial sign-off: flip selected draft products to `active`.
5. Then proceed to G5 (Cloudflare deploy) with explicit approval.
