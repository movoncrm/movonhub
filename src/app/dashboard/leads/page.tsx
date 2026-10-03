import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Calculator, LayoutDashboard, Power, UserCircle } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { LeadsManager } from "@/components/dashboard/LeadsManager";
import { getSession } from "@/lib/auth/session";
import { getStore } from "@/lib/db";
import { logout } from "@/app/(auth)/logout/actions";
import { getI18n } from "@/i18n/server";
import { summariseLeads } from "@/lib/leads";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("leads.title"), robots: { index: false, follow: false } };
}

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const [session, { t }] = await Promise.all([getSession(), getI18n()]);
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin");
  if (!session.advisorId) redirect("/login");

  const store = getStore();
  const advisor = await store.getAdvisorById(session.advisorId);
  if (!advisor) redirect("/login");

  const leads = await store.listLeads({ advisorId: advisor.id });
  const summary = summariseLeads(leads);

  const stats = [
    { label: t("leads.filterAll"), value: summary.total },
    { label: t("leads.filterOpen"), value: summary.open },
    { label: t("leads.filterNet"), value: summary.net },
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
            <ButtonLink href="/dashboard/incentive" variant="secondary" size="sm">
              <Calculator className="h-4 w-4" /> <span className="hidden sm:inline">{t("incentive.title")}</span>
            </ButtonLink>
            <Link
              href="/dashboard"
              className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-ink hover:bg-background sm:inline-flex"
            >
              <LayoutDashboard className="h-4 w-4" /> {advisor.name}
            </Link>
            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm">
                <Power className="h-4 w-4" /> <span className="hidden sm:inline">{t("dashboard.logout")}</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container-page py-8">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="text-sm text-muted hover:text-primary">
            <UserCircle className="mr-1 inline h-4 w-4" />
            {t("dashboard.title")}
          </Link>
        </div>
        <h1 className="mt-3 text-2xl">{t("leads.title")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">{t("leads.subtitle")}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="card-surface p-5">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <LeadsManager leads={leads} />
        </div>
      </main>
    </div>
  );
}
