# Phase 5 — Document Study

> Status: extracted from the four official source PDFs supplied for Phase 5.
> This document is an internal working summary. It is **not** published to the
> public website, and it is **not** a substitute for the source PDFs, which remain
> the authoritative record.

## 1. Purpose

Phase 5 has two source-driven goals:

1. **Public product information** — keep the MOVONHUB catalogue and public pages
   aligned with the latest official promotional material.
2. **Internal SA tools** — build a per‑SA Leads Organizer and a personal SA
   Incentive module that reflect the official commission / incentive documents.

This study identifies exactly what the source documents contain, what can be
reused publicly, what is confidential, and what business decisions must be
confirmed by MOVONHUB before any rules are coded.

## 2. Confidentiality classification

| Document | Classification | May be shown publicly? |
| --- | --- | --- |
| OCT 2026 CKI Customer Promotion | Customer promotion | Yes (public prices/promos) |
| Q4 2026 MOVON Promotion | Customer promotion | Yes (public prices/promos) |
| MOVON Sales Commission Plan (Oct 2026) | **CONFIDENTIAL — internal** | **No** |
| Q4 2026 Periodic Sales Incentive | **CONFIDENTIAL — internal** | **No** |

Both internal documents carry an explicit notice:
*"This document is for your internal use only and should not be distributed to
external parties."* Public product pages must never surface commission rates,
incentive tiers, unit-count rules or SBI/group commission.

## 3. Source inventory

Located under `docs/source-materials/phase-5/`:

| # | File | Pages | Text extractable | Role |
| --- | --- | --- | --- | --- |
| 1 | `01-product-information/OCT 2026 CKI CUSTOMER PROMOTION (as at 02102026,V7).pdf` | 55 | Yes (~20k chars) | Public pricing/promos (CKI/CUCKOO range) |
| 2 | `01-product-information/Q4 2026 MOVON PROMOTION (as at 03102026).pdf` | 24 | **No (image-only)** | Public pricing/promos (MOVON range) |
| 3 | `02-sa-incentives/MOVON Sales Commission Plan (as at October 2026, v1) SASM.pdf` | 22 | Yes (~10k chars) | **Confidential** commission plan |
| 4 | `02-sa-incentives/Q4 2026 Periodic Sales Incentive (SASM).pdf` | 13 | Yes (~4.6k chars) | **Confidential** periodic incentive |

Document 2 is a set of rendered slide images with no embedded text. Its content
was recovered by rendering the pages to images and reading them; the recovered
detail is recorded in `PRODUCT_CONTENT.md`. Any future re-verification must use
the source PDF.

## 4. Document 1 — OCT 2026 CKI Customer Promotion (outright + rental)

Effective **1 Oct 2026 – 31 Oct 2026**. Positions water purifiers, outdoor
filters, air purifiers, massage chairs, mattresses, treadmills, dishwashers,
kitchen appliances and a Samsung series under both **outright** and **rental**
plans. Every page ends with *"For more info, please refer to MEMO."*

Highlights (see `PRODUCT_CONTENT.md` for the full tables):

- **Water purifier outright** (was → promo): FLO 4,450→4,150; GRANDE 4,750→4,450;
  TITAN 4,550→4,250; GLAMOUR 4,350→4,050; XCEL 2 4,200→3,900; KIUT 3,050→2,750;
  WARRIOR 3,400→3,100; KING TOP 2 3,850→3,550; VIVID TOP 3,360→3,060;
  GRANITE 7,200 (no discount); ACE 6,850→6,350.
- **Rental** uses `RM1 + 50% off for 3 months` and `3+2yr` / `5+2yr` plans, with
  commission unit count `1` per listed product.
- **KING TOP 2** rental has an `RM12 for 12 months` promo with a `50%` unit count,
  and the RM12 rate is conditional on on-time payment.
- **Samsung Series** outright (Bespoke AI Laundry, 65" Mini LED TV, 583L SBS
  fridge) and rental at `50%` unit count.

## 5. Document 2 — Q4 2026 MOVON Promotion (outright + rental)

Effective **1 Oct 2026 – 31 Dec 2026** (rental section) and **1 Oct – 31 Dec 2026**
for MOVON product pages. Marketing theme: **"Bayar Ringan Je"**.

Outright structure:

- **Promo 1:** 15% off + FREE HyperMate (worth RM2,399) or HydroMate (RM2,999).
- **Promo 2:** 20% off + 2‑year extended warranty (1+2 protection).
- **Promo 3 (combos):** Combo A CoolMate + WashMate NP RM7,300 → **RM4,599**
  (37% off); Combo B CoolMate + DuoMate NP RM7,800 → **RM4,999** (36% off).

Representative outright prices (normal → promo):

| Product | Normal | 15% + gift | 20% + warranty |
| --- | --- | --- | --- |
| DuoMate (V 10/6kg) | 3,500 | 2,975 | 2,800 |
| DuoMate+ (M 10/7kg) | 3,700 | 3,145 | 2,960 |
| CoolMate (M 418L) | 4,300 | 3,655 | 3,440 |
| ChillMate+ (M 601L) | 6,300 | 5,355 | 5,040 |

Also: **LockMate** outright 2,400→1,600 (bare unit 1,200, 2yr warranty, install
included, FOC 3 cards); **HyperMate** 2,399→1,599; **HydroMate** 2,999→1,799.

Rental section: `RM1 advance rental OR 50% off` (on advance rental and month 1–3
fee), **Rental Processing Fee (RPF) RM250 waived**, and "Smart Rental Plans"
(A/B/C/D) per product, e.g. DuoMate RM125×36 / RM109×48 / RM99×60 / RM89×72.
Lower section covers WashMate, CoolMate, ChillMate+, LockMate (RM69×36),
air‑conditioner (CHiQ, 1.0HP/1.5HP), FoldMate & StrollMate (MOVON Baby, outright
after RM500 rebate: FoldMate 1,500; StrollMate 1,800).

## 6. Document 3 — MOVON Sales Commission Plan (CONFIDENTIAL)

Effective **1 Oct 2026**. Covers Star Advisor (SA), Star Manager (SM), Star Chief
Manager (SCM), Star Elite Officer (SEO), Star Builder Incentive (SBI), rank
promotion / maintenance, and a glossary. Full detail is captured in
`SA_INCENTIVE_RULES.md`. Key structural facts:

- Personal Sales Commission: MOVON Space / Baby outright **RM280/unit**, rental
  **RM230/unit**; MOVON Choice / CUCKOO **RM100/unit**; MOVON Vacuum by tier.
- **SBI** tiers for SA (min 5 personal net sales to qualify): ≥10 = RM500,
  ≥20 = RM1,500, ≥30 = RM3,000, ≥40 = RM4,500, ≥50 = RM6,000.
- Unit count: MOVON Space / Baby / Choice = 1; CUCKOO = 0.5 (RM12 promo &
  Samsung = 0.25).
- **Net Sales** is defined in the glossary as *completion of product installation
  or delivery*.
- SA Collection Commission – Rental (1st month onward): **1.0%** based on
  successful collection, eligibility min 5 units, up to 12 months.

## 7. Document 4 — Q4 2026 Periodic Sales Incentive (CONFIDENTIAL)

Effective **1 Oct 2026 – 31 Dec 2026**. Two advisor roles and their periodic
incentives:

- **Star Advisor — Momentum Duo Incentive** (NET SALES UNITS):
  ≥50 = RM7,500; ≥40 = RM5,000; ≥30 = RM4,000; ≥20 = RM3,000; ≥10 = RM1,000.
- **Star Advisor — Momentum Booster Incentive:**
  ≥15 = RM3,700; ≥10 = RM1,800; ≥5 = RM1,200.
- **Star Manager — Momentum Boost Incentive:**
  ≥120 = RM9,000; ≥80 = RM7,000; ≥40 = RM5,000.
- Quarterly Sales Performers (Top 5) are individual and role-based.
- Unit-count rules differ by role and by plan (Duo = 1.5; RM12 promo & Samsung
  = 0.25 / 50% depending on table).

## 8. Cross-cutting definitions and notes

- **Net Sales** = completion of product installation or delivery (glossary).
- **Unit count** is not the same as quantity sold: it varies by product, by
  whether the sale is MOVON vs CUCKOO, by Duo combinations, and by promotion.
- Periodic incentive tables and commission tables do **not** use identical unit
  counts; the applicable table must be selected per scheme and role.
- **"Refer to MEMO"** appears on essentially every promotional table — final
  figures are governed by the memo, so nothing should be hard-coded without
  confirming against the current memo.
- Dates on the MOVON promotion PDF cover `1 Oct – 31 Dec 2026`; the CKI promotion
  covers `1 Oct – 31 Oct 2026`. These differ and must be respected per document.

## 9. Open questions requiring MOVONHUB confirmation

These are business decisions, not technical ones. They must be answered before
the incentive module encodes any rule:

1. Which exact **NET / qualifying status** marks a sale as countable (install vs
   delivery vs payment)?
2. How is a sale **attributed to a month/quarter** (booking date, install date,
   NET date)?
3. Do the two internal documents apply to **all** SAs, or only SASM-tier staff?
   (Both are labelled "SASM".)
4. Should the app compute incentives, or only record/track them with the amounts
   entered by an admin?
5. Which role(s) should the Phase 5 module support first — Star Advisor only, or
   SM/SCM/SEO too?
6. How should **adjustments/reversals** (cancellations after NET) be handled?
7. Which public product fields may be updated from these PDFs now, and who signs
   off the public pricing before it goes live?
8. Is there a current **MEMO** that supersedes any figure in these PDFs?

## 10. How this maps to the application

- `PRODUCT_CONTENT.md` → drives public catalogue/product page updates only.
- `SA_INCENTIVE_RULES.md` → drives the confidential, per‑SA incentive module.
- Existing schema (`advisors`, `products`, `promotions`, `enquiries`,
  `site_content`, `audit_logs`, `rate_limits`) has **no** leads or incentive
  tables yet; Phase 5 must add them with RLS and server-side authorisation.
