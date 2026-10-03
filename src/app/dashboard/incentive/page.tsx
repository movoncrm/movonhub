import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AlertTriangle, Power, Users } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { getSession } from "@/lib/auth/session";
import { getStore } from "@/lib/db";
import { logout } from "@/app/(auth)/logout/actions";
import { getI18n } from "@/i18n/server";
import { formatRM } from "@/lib/utils";
import { isCountable } from "@/lib/leads";
import {
  ESTIMATE_ASSUMPTIONS,
  SBI_MIN_SALES,
  estimateByMonth,
  estimateStarAdvisorIncentive,
  periodicUnitCount,
  sbiUnitCount,
} from "@/lib/incentive";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("incentive.title"), robots: { index: false, follow: false } };
}

export const dynamic = "force-dynamic";

export default async function IncentivePage() {
  const [session, { t }] = await Promise.all([getSession(), getI18n()]);
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin");
  if (!session.advisorId) redirect("/login");

  const store = getStore();
  const advisor = await store.getAdvisorById(session.advisorId);
  if (!advisor) redirect("/login");

  const leads = await store.listLeads({ advisorId: advisor.id });
  const estimate = estimateStarAdvisorIncentive(leads);
  const byMonth = estimateByMonth(leads);
  const netLeads = leads
    .filter(isCountable)
    .sort((a, b) => ((a.netDate ?? "") < (b.netDate ?? "") ? 1 : -1));
  const remainingForSbi = Math.max(0, SBI_MIN_SALES - estimate.netSalesCount);

  const breakdown = [
    { label: t("incentive.personal"), value: estimate.personalCommission },
    { label: t("incentive.sbi"), value: estimate.starBuilderIncentive },
    { label: t("incentive.duo"), value: estimate.momentumDuo },
    { label: t("incentive.booster"), value: estimate.momentumBooster },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-borderline bg-surface">
        <div className="container-page flex h-16 items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Logo />
            <Badge tone="blue">{t("nav.hub")}</Badge>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle />
            <ButtonLink href="/dashboard/leads" variant="secondary" size="sm">
              <Users className="h-4 w-4" /> <span className="hidden sm:inline">{t("leads.title")}</span>
            </ButtonLink>
            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm">
                <Power className="h-4 w-4" /> <span className="hidden sm:inline">{t("dashboard.logout")}</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container-page py-8">
        <h1 className="text-2xl">{t("incentive.title")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">{t("incentive.subtitle")}</p>

        <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{t("incentive.disclaimer")}</p>
        </div>

        {estimate.netSalesCount === 0 ? (
          <p className="card-surface mt-6 p-6 text-sm text-muted">{t("incentive.empty")}</p>
        ) : (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="card-surface p-5">
                <p className="text-2xl font-bold">{estimate.netSalesCount}</p>
                <p className="text-sm text-muted">{t("incentive.netSales")}</p>
              </div>
              <div className="card-surface p-5">
                <p className="text-2xl font-bold">{estimate.sbiUnits}</p>
                <p className="text-sm text-muted">{t("incentive.sbiUnits")}</p>
              </div>
              <div className="card-surface p-5">
                <p className="text-2xl font-bold">{estimate.periodicUnits}</p>
                <p className="text-sm text-muted">{t("incentive.periodicUnits")}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <section className="card-surface p-6">
                <h2 className="text-lg">{t("incentive.total")}</h2>
                <table className="mt-4 w-full text-sm">
                  <tbody className="divide-y divide-borderline">
                    {breakdown.map((row) => (
                      <tr key={row.label}>
                        <td className="py-2.5 text-muted">{row.label}</td>
                        <td className="py-2.5 text-right font-semibold">{formatRM(row.value)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td className="py-3 font-bold">{t("incentive.total")}</td>
                      <td className="py-3 text-right text-lg font-bold text-primary">{formatRM(estimate.total)}</td>
                    </tr>
                  </tbody>
                </table>

                <p className="mt-4 text-xs text-muted">
                  {estimate.qualifiesForSbi
                    ? t("incentive.qualifies")
                    : t("incentive.notQualifies", { count: remainingForSbi })}
                  {" · "}
                  {t("incentive.vacuumUnits")}: {estimate.vacuumUnits}
                </p>
              </section>

              <section className="card-surface p-6">
                <h2 className="text-lg">{t("incentive.assumptions")}</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-xs text-muted">
                  {ESTIMATE_ASSUMPTIONS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </div>

            {byMonth.length > 1 && (
              <section className="card-surface mt-6 p-6">
                <h2 className="text-lg">{t("incentive.byMonth")}</h2>
                <table className="mt-4 w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-muted">
                      <th className="pb-2">{t("incentive.period")}</th>
                      <th className="pb-2 text-right">{t("incentive.netSales")}</th>
                      <th className="pb-2 text-right">{t("incentive.total")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderline">
                    {byMonth.map((row) => (
                      <tr key={row.period}>
                        <td className="py-2.5">{row.period === "unknown" ? t("incentive.unknown") : row.period}</td>
                        <td className="py-2.5 text-right">{row.estimate.netSalesCount}</td>
                        <td className="py-2.5 text-right font-semibold">{formatRM(row.estimate.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {netLeads.length > 0 && (
              <section className="card-surface mt-6 p-6">
                <h2 className="text-lg">{t("incentive.qualifyingLeads")}</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-muted">
                        <th className="pb-2">{t("leads.customer")}</th>
                        <th className="pb-2">{t("leads.category")}</th>
                        <th className="pb-2">{t("leads.plan")}</th>
                        <th className="pb-2">{t("leads.netDate")}</th>
                        <th className="pb-2">{t("incentive.period")}</th>
                        <th className="pb-2 text-right">{t("incentive.sbiUnits")}</th>
                        <th className="pb-2 text-right">{t("incentive.periodicUnits")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-borderline">
                      {netLeads.map((lead) => (
                        <tr key={lead.id}>
                          <td className="py-2.5">{lead.customerName || t("dashboard.anonymous")}</td>
                          <td className="py-2.5 capitalize">{lead.category}</td>
                          <td className="py-2.5 capitalize">{lead.planType}</td>
                          <td className="py-2.5">{lead.netDate || "—"}</td>
                          <td className="py-2.5">{lead.incentiveMonth || t("incentive.unknown")}</td>
                          <td className="py-2.5 text-right">{sbiUnitCount(lead)}</td>
                          <td className="py-2.5 text-right">{periodicUnitCount(lead)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}

        <div className="mt-8">
          <ButtonLink href="/dashboard/leads" variant="secondary" size="sm">
            {t("incentive.openLeads")}
          </ButtonLink>
        </div>
      </main>
    </div>
  );
}
