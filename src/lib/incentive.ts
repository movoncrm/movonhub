import type { Lead } from "@/lib/types";
import { isCountable } from "@/lib/leads";

/**
 * CONFIDENTIAL — Star Advisor incentive ESTIMATE.
 *
 * This computes an indicative STAR ADVISOR (SA) incentive figure from NET leads.
 * It is an estimate only and is NOT the official payout. Several official rules
 * are ambiguous across the source tables (e.g. RM12/Samsung unit count appears as
 * both 0.25 and 50%); the assumptions below are documented in
 * `docs/phase-5/SA_INCENTIVE_RULES.md` and must be confirmed before any figure is
 * treated as authoritative.
 *
 * Scope: Star Advisor only (per Phase 5 decision). No SM/SCM/SEO, group sales,
 * alliance or collection commission are calculated here.
 */

/** Per-unit personal sales commission (RM) for non-vacuum categories. */
export const PERSONAL_COMMISSION = {
  space: { outright: 280, rental: 230 },
  baby: { outright: 280, rental: 230 },
  choice: { outright: 100, rental: 100 },
  cuckoo: { outright: 100, rental: 100 },
} as const;

/** MOVON Vacuum personal commission tiers (RM/unit by personal vacuum units). */
export const VACUUM_TIERS: readonly { min: number; rate: number }[] = [
  { min: 20, rate: 350 },
  { min: 10, rate: 320 },
  { min: 1, rate: 300 },
];

/** Minimum personal NET sales to qualify for the Star Builder Incentive. */
export const SBI_MIN_SALES = 5;

/** Star Builder Incentive (RM) by net sales units. */
export const SBI_TIERS: readonly { min: number; amount: number }[] = [
  { min: 50, amount: 6000 },
  { min: 40, amount: 4500 },
  { min: 30, amount: 3000 },
  { min: 20, amount: 1500 },
  { min: 10, amount: 500 },
];

/** Momentum Duo Incentive (RM) by net sales units. */
export const MOMENTUM_DUO_TIERS: readonly { min: number; amount: number }[] = [
  { min: 50, amount: 7500 },
  { min: 40, amount: 5000 },
  { min: 30, amount: 4000 },
  { min: 20, amount: 3000 },
  { min: 10, amount: 1000 },
];

/** Momentum Booster Incentive (RM) by net sales units. */
export const MOMENTUM_BOOSTER_TIERS: readonly { min: number; amount: number }[] = [
  { min: 15, amount: 3700 },
  { min: 10, amount: 1800 },
  { min: 5, amount: 1200 },
];

export const ESTIMATE_ASSUMPTIONS: readonly string[] = [
  "Star Advisor only; no group, alliance or collection commission is included.",
  "Only leads with NET status are counted.",
  "SBI minimum is 5 personal NET sales; tier is then selected by net sales units.",
  "SBI unit count: MOVON Space/Baby/Choice = 1; CUCKOO = 0.5 (0.25 for RM12/Samsung); Vacuum excluded.",
  "Momentum (Duo/Booster) unit count: 1 per eligible product; Duo adds 0.5 (Joy Pack excluded).",
  "RM12/Samsung promotions are counted at 0.25 units (conflicts with the 50% wording in the Duo table).",
  "This is an estimate only and does not represent the official MOVON payout.",
];

export function tierValue<T extends { min: number }>(value: number, tiers: readonly T[], key: keyof T): number {
  for (const tier of tiers) {
    if (value >= tier.min) return Number(tier[key]);
  }
  return 0;
}

export function vacuumRate(units: number): number {
  for (const tier of VACUUM_TIERS) {
    if (units >= tier.min) return tier.rate;
  }
  return 0;
}

/** Star Builder Incentive unit count for a single NET lead. */
export function sbiUnitCount(lead: Lead): number {
  if (!isCountable(lead)) return 0;
  if (lead.promotion === "rm12" || lead.promotion === "samsung") {
    return lead.category === "cuckoo" ? 0.25 : 0;
  }
  switch (lead.category) {
    case "space":
    case "baby":
    case "choice":
      return 1;
    case "cuckoo":
      return 0.5;
    default:
      return 0;
  }
}

/** Momentum (Duo/Booster) unit count for a single NET lead. */
export function periodicUnitCount(lead: Lead): number {
  if (!isCountable(lead)) return 0;
  if (lead.promotion === "rm12" || lead.promotion === "samsung") return 0.25;
  const eligible = lead.category === "space" || lead.category === "baby" || lead.category === "choice" || lead.category === "cuckoo";
  if (!eligible) return 0;
  const base = 1;
  if (lead.isDuo && lead.promotion !== "joy_pack") return base + 0.5;
  return base;
}

export function personalCommissionForLead(lead: Lead, vacuumUnits: number): number {
  if (!isCountable(lead)) return 0;
  switch (lead.category) {
    case "space":
    case "baby":
      return lead.planType === "rental" ? PERSONAL_COMMISSION.baby.rental : PERSONAL_COMMISSION.baby.outright;
    case "choice":
    case "cuckoo":
      return PERSONAL_COMMISSION.choice.outright;
    case "vacuum":
      return vacuumRate(vacuumUnits);
    default:
      return 0;
  }
}

export interface IncentiveEstimate {
  /** Count of COUNTABLE (NET) leads in scope. */
  netSalesCount: number;
  /** Movable-unit totals used by each scheme. */
  sbiUnits: number;
  periodicUnits: number;
  vacuumUnits: number;
  personalCommission: number;
  starBuilderIncentive: number;
  momentumDuo: number;
  momentumBooster: number;
  total: number;
  qualifiesForSbi: boolean;
}

/**
 * Estimate a Star Advisor's incentive for a set of leads (typically one month or
 * quarter). Pure: the same leads always produce the same figures.
 */
export function estimateStarAdvisorIncentive(leads: Lead[]): IncentiveEstimate {
  const countable = leads.filter(isCountable);

  let sbiUnits = 0;
  let periodicUnits = 0;
  let vacuumUnits = 0;
  let nonVacuumCommission = 0;

  for (const lead of countable) {
    sbiUnits += sbiUnitCount(lead);
    periodicUnits += periodicUnitCount(lead);
    if (lead.category === "vacuum") {
      vacuumUnits += 1;
    } else {
      nonVacuumCommission += personalCommissionForLead(lead, 0);
    }
  }

  // The vacuum table is a per-unit rate selected by the bracket of total
  // personal vacuum units, so the bracket rate applies to every unit.
  const personalCommission = nonVacuumCommission + vacuumUnits * vacuumRate(vacuumUnits);

  const netSalesCount = countable.length;
  const qualifiesForSbi = netSalesCount >= SBI_MIN_SALES;
  const starBuilderIncentive = qualifiesForSbi ? tierValue(sbiUnits, SBI_TIERS, "amount") : 0;
  const momentumDuo = tierValue(periodicUnits, MOMENTUM_DUO_TIERS, "amount");
  const momentumBooster = tierValue(periodicUnits, MOMENTUM_BOOSTER_TIERS, "amount");

  return {
    netSalesCount,
    sbiUnits: round2(sbiUnits),
    periodicUnits: round2(periodicUnits),
    vacuumUnits,
    personalCommission: round2(personalCommission),
    starBuilderIncentive,
    momentumDuo,
    momentumBooster,
    total: round2(personalCommission + starBuilderIncentive + momentumDuo + momentumBooster),
    qualifiesForSbi,
  };
}

/**
 * Group NET leads by incentive month (YYYY-MM) and estimate each period.
 * Leads without a NET date are grouped under "unknown".
 */
export function estimateByMonth(leads: Lead[]): { period: string; estimate: IncentiveEstimate }[] {
  const groups = new Map<string, Lead[]>();
  for (const lead of leads) {
    if (!isCountable(lead)) continue;
    const key = lead.incentiveMonth || "unknown";
    const bucket = groups.get(key) ?? [];
    bucket.push(lead);
    groups.set(key, bucket);
  }
  return [...groups.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([period, group]) => ({ period, estimate: estimateStarAdvisorIncentive(group) }));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
