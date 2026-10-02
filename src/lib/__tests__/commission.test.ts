import { describe, expect, it } from "vitest";
import { estimateCommission } from "@/lib/commission";

describe("estimateCommission", () => {
  it("multiplies sales, months and rate", () => {
    expect(estimateCommission({ monthlySales: 10000, months: 3, ratePercent: 5 })).toBe(1500);
  });

  it("returns 0 for invalid or negative input", () => {
    expect(estimateCommission({ monthlySales: -1, months: 3, ratePercent: 5 })).toBe(0);
    expect(estimateCommission({ monthlySales: 1000, months: 0, ratePercent: 5 })).toBe(0);
    expect(estimateCommission({ monthlySales: 1000, months: 3, ratePercent: -5 })).toBe(0);
    expect(estimateCommission({ monthlySales: Number.NaN, months: 3, ratePercent: 5 })).toBe(0);
  });

  it("rounds to two decimals", () => {
    expect(estimateCommission({ monthlySales: 333.33, months: 1, ratePercent: 2.5 })).toBe(8.33);
  });
});
