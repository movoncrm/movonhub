"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { estimateCommission } from "@/lib/commission";
import { formatRM } from "@/lib/utils";

export function CommissionCalculator() {
  const { t } = useI18n();
  const [monthlySales, setMonthlySales] = useState(10000);
  const [months, setMonths] = useState(3);
  const [ratePercent, setRatePercent] = useState(5);

  const estimate = useMemo(
    () => estimateCommission({ monthlySales, months, ratePercent }),
    [monthlySales, months, ratePercent],
  );

  return (
    <section id="calculator" className="card-surface scroll-mt-20 p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Calculator className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg">{t("hub.calculatorTitle")}</h2>
          <p className="text-sm text-muted">{t("hub.calculatorBody")}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="calc-sales" className="field-label">
            {t("hub.calculatorMonthly")}
          </label>
          <input
            id="calc-sales"
            type="number"
            min={0}
            step={100}
            value={monthlySales}
            onChange={(e) => setMonthlySales(Number(e.target.value))}
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor="calc-months" className="field-label">
            {t("hub.calculatorMonths")}
          </label>
          <input
            id="calc-months"
            type="number"
            min={1}
            step={1}
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor="calc-rate" className="field-label">
            {t("hub.calculatorRate")}
          </label>
          <input
            id="calc-rate"
            type="number"
            min={0}
            step={0.5}
            value={ratePercent}
            onChange={(e) => setRatePercent(Number(e.target.value))}
            className="field-input"
          />
          <p className="mt-1 text-xs text-muted">{t("hub.calculatorRateHint")}</p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-borderline bg-background p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("hub.calculatorEstimate")}</p>
        <p className="mt-1 text-2xl font-bold text-primary">{formatRM(estimate)}</p>
        <p className="mt-2 text-xs text-muted">{t("hub.calculatorNote")}</p>
      </div>
    </section>
  );
}
