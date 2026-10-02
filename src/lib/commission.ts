export interface CommissionInput {
  monthlySales: number;
  months: number;
  ratePercent: number;
}

/**
 * Pure commission estimate. No commission rate is hardcoded — the rate is always
 * supplied by the caller (a clearly-labelled sample assumption in the UI). Values
 * are treated defensively so invalid input yields 0.
 */
export function estimateCommission({ monthlySales, months, ratePercent }: CommissionInput): number {
  const sales = Number.isFinite(monthlySales) && monthlySales > 0 ? monthlySales : 0;
  const period = Number.isFinite(months) && months > 0 ? Math.floor(months) : 0;
  const rate = Number.isFinite(ratePercent) && ratePercent >= 0 ? ratePercent : 0;
  return Math.round(sales * period * (rate / 100) * 100) / 100;
}
