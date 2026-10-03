import { describe, expect, it } from "vitest";
import {
  estimateByMonth,
  estimateStarAdvisorIncentive,
  periodicUnitCount,
  sbiUnitCount,
} from "@/lib/incentive";
import type { Lead } from "@/lib/types";

function lead(partial: Partial<Lead>): Lead {
  return {
    id: partial.id ?? `lead-${Math.random().toString(36).slice(2)}`,
    advisorId: "adv-1",
    status: "NET",
    planType: "outright",
    category: "space",
    isDuo: false,
    promotion: "none",
    createdAt: "2026-10-05T00:00:00.000Z",
    ...partial,
  };
}

function repeat(count: number, partial: Partial<Lead>): Lead[] {
  return Array.from({ length: count }, (_, i) => lead({ ...partial, id: `${partial.id ?? "x"}-${i}` }));
}

describe("unit counts", () => {
  it("uses 1 for space/baby/choice and 0.5 for CUCKOO on SBI", () => {
    expect(sbiUnitCount(lead({ category: "space" }))).toBe(1);
    expect(sbiUnitCount(lead({ category: "cuckoo" }))).toBe(0.5);
  });

  it("reduces CUCKOO SBI unit to 0.25 under RM12/Samsung", () => {
    expect(sbiUnitCount(lead({ category: "cuckoo", promotion: "rm12" }))).toBe(0.25);
    expect(sbiUnitCount(lead({ category: "cuckoo", promotion: "samsung" }))).toBe(0.25);
    expect(sbiUnitCount(lead({ category: "space", promotion: "rm12" }))).toBe(0);
  });

  it("excludes non-NET leads from all unit counts", () => {
    expect(sbiUnitCount(lead({ status: "CONTACTED" }))).toBe(0);
    expect(periodicUnitCount(lead({ status: "CONTACTED" }))).toBe(0);
  });

  it("adds 0.5 for a Duo pairing but not for Joy Pack", () => {
    expect(periodicUnitCount(lead({ isDuo: true }))).toBe(1.5);
    expect(periodicUnitCount(lead({ isDuo: true, promotion: "joy_pack" }))).toBe(1);
  });
});

describe("estimateStarAdvisorIncentive", () => {
  it("sums personal commission per category and plan", () => {
    const outright = estimateStarAdvisorIncentive(repeat(2, { category: "space", planType: "outright" }));
    expect(outright.personalCommission).toBe(560);
    expect(outright.total).toBe(560);

    const rental = estimateStarAdvisorIncentive([lead({ category: "baby", planType: "rental" })]);
    expect(rental.personalCommission).toBe(230);

    const choice = estimateStarAdvisorIncentive([lead({ category: "choice" }), lead({ category: "cuckoo" })]);
    expect(choice.personalCommission).toBe(200);
  });

  it("applies vacuum tiers by cumulative personal vacuum units", () => {
    // 3 vacuum units -> 300 each
    expect(estimateStarAdvisorIncentive(repeat(3, { category: "vacuum" })).personalCommission).toBe(900);
    // 10 vacuum units -> 320 each
    expect(estimateStarAdvisorIncentive(repeat(10, { category: "vacuum" })).personalCommission).toBe(3200);
    // 20 vacuum units -> 350 each
    expect(estimateStarAdvisorIncentive(repeat(20, { category: "vacuum" })).personalCommission).toBe(7000);
  });

  it("awards SBI only at or above the lowest tier and only with 5+ sales", () => {
    expect(estimateStarAdvisorIncentive(repeat(4, { category: "space" })).starBuilderIncentive).toBe(0);
    expect(estimateStarAdvisorIncentive(repeat(5, { category: "space" })).starBuilderIncentive).toBe(0);
    expect(estimateStarAdvisorIncentive(repeat(10, { category: "space" })).starBuilderIncentive).toBe(500);
    expect(estimateStarAdvisorIncentive(repeat(20, { category: "space" })).starBuilderIncentive).toBe(1500);
  });

  it("applies Momentum Duo and Booster tiers", () => {
    const booster = estimateStarAdvisorIncentive(repeat(5, { category: "space" }));
    expect(booster.momentumBooster).toBe(1200);
    expect(booster.momentumDuo).toBe(0);

    const duo = estimateStarAdvisorIncentive(repeat(20, { category: "space", isDuo: true }));
    expect(duo.periodicUnits).toBe(30);
    expect(duo.momentumDuo).toBe(4000);
    expect(duo.momentumBooster).toBe(3700);
  });

  it("totals all components", () => {
    const result = estimateStarAdvisorIncentive(repeat(20, { category: "space", isDuo: true }));
    expect(result.personalCommission).toBe(5600);
    expect(result.starBuilderIncentive).toBe(1500);
    expect(result.total).toBe(5600 + 1500 + 4000 + 3700);
  });

  it("returns zeroed estimate with no leads", () => {
    const result = estimateStarAdvisorIncentive([]);
    expect(result.netSalesCount).toBe(0);
    expect(result.total).toBe(0);
    expect(result.qualifiesForSbi).toBe(false);
  });
});

describe("estimateByMonth", () => {
  it("groups NET leads by incentive month", () => {
    const leads = [
      lead({ id: "a", netDate: "2026-10-10", incentiveMonth: "2026-10" }),
      lead({ id: "b", netDate: "2026-10-20", incentiveMonth: "2026-10" }),
      lead({ id: "c", netDate: "2026-11-01", incentiveMonth: "2026-11" }),
      lead({ id: "d", status: "CONTACTED" }),
    ];
    const months = estimateByMonth(leads);
    expect(months.map((m) => m.period)).toEqual(["2026-11", "2026-10"]);
    expect(months.find((m) => m.period === "2026-10")?.estimate.netSalesCount).toBe(2);
  });
});
