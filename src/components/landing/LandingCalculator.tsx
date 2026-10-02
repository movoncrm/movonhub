"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { estimateCommission } from "@/lib/commission";
import { formatRM } from "@/lib/utils";

export function LandingCalculator() {
  const { t } = useI18n();
  const [sales, setSales] = useState(10000);
  const [months, setMonths] = useState(3);
  const [rate, setRate] = useState(5);

  const monthly = useMemo(() => Math.round((sales * (rate / 100)) * 100) / 100, [sales, rate]);
  const total = useMemo(() => estimateCommission({ monthlySales: sales, months, ratePercent: rate }), [sales, months, rate]);

  return (
    <div className="rounded-3xl border border-white/10 bg-night-card/80 p-6 shadow-2xl backdrop-blur">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="lc-sales" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">
            {t("hub.calculatorMonthly")}
          </label>
          <input
            id="lc-sales"
            type="number"
            min={0}
            step={100}
            value={sales}
            onChange={(e) => setSales(Number(e.target.value))}
            className="w-full rounded-xl border border-white/10 bg-night px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20"
          />
        </div>
        <div>
          <label htmlFor="lc-months" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">
            {t("hub.calculatorMonths")}
          </label>
          <input
            id="lc-months"
            type="number"
            min={1}
            step={1}
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="w-full rounded-xl border border-white/10 bg-night px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20"
          />
        </div>
        <div>
          <label htmlFor="lc-rate" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">
            {t("hub.calculatorRate")}
          </label>
          <input
            id="lc-rate"
            type="number"
            min={0}
            step={0.5}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full rounded-xl border border-white/10 bg-night px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20"
          />
          <p className="mt-1 text-[11px] text-white/40">{t("hub.calculatorRateHint")}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-night p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">{t("hub.calculatorEstimate")}</p>
          <p className="mt-1 text-3xl font-bold text-electric">{formatRM(monthly)}</p>
          <p className="mt-1 text-xs text-white/40">{t("common.perMonth")}</p>
        </div>
        <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/60">{t("landing.commTotal")}</p>
          <p className="mt-1 text-3xl font-bold text-white">{formatRM(total)}</p>
          <p className="mt-1 text-xs text-white/50">
            {months} {t("product.months")}
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs text-white/40">{t("hub.calculatorNote")}</p>
    </div>
  );
}
