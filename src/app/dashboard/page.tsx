import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Eye, MessageSquare, Power } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink, Button } from "@/components/ui/Button";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { ShareBar } from "@/components/advisor/ShareBar";
import { AdvisorAvatar } from "@/components/advisor/AdvisorCard";
import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { getSession } from "@/lib/auth/session";
import { getStore } from "@/lib/db";
import { logout } from "@/app/(auth)/logout/actions";
import { getI18n } from "@/i18n/server";
import { formatDate } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("dashboard.title"), robots: { index: false, follow: false } };
}

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [session, { t, locale }] = await Promise.all([getSession(), getI18n()]);
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin");
  if (!session.advisorId) redirect("/login");

  const store = getStore();
  const advisor = await store.getAdvisorById(session.advisorId);
  if (!advisor) redirect("/login");

  const enquiries = await store.listEnquiries({ advisorId: advisor.id });
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://movonhub.com.my";
  const publicUrl = `${site}/sa/${advisor.slug}`;
  const recent = enquiries.slice(0, 5);

  const stats = [
    { label: t("dashboard.totalEnquiries"), value: enquiries.length, icon: MessageSquare },
    { label: t("dashboard.newEnquiries"), value: enquiries.filter((e) => e.status === "new").length, icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-borderline bg-surface">
        <div className="container-page flex h-16 items-center justify-between gap-3">
          <Logo />
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <ButtonLink href="/hub" variant="secondary" size="sm">
              {t("nav.hub")}
            </ButtonLink>
            <ButtonLink href={`/sa/${advisor.slug}`} variant="secondary" size="sm">
              <Eye className="h-4 w-4" /> {t("dashboard.viewPage")}
            </ButtonLink>
            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm">
                <Power className="h-4 w-4" /> {t("dashboard.logout")}
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container-page py-8">
        <div className="card-surface flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <AdvisorAvatar advisor={advisor} className="h-16 w-16 text-xl" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl">{advisor.name}</h1>
                <Badge tone={advisor.active ? "green" : "amber"}>
                  {advisor.active ? t("dashboard.active") : t("dashboard.inactive")}
                </Badge>
              </div>
              <p className="text-sm text-muted">{advisor.title}</p>
              <Link href={`/sa/${advisor.slug}`} className="text-sm font-semibold text-primary">
                /sa/{advisor.slug}
              </Link>
            </div>
          </div>
          <ShareBar url={publicUrl} title={`${advisor.name} | ${t("sa.role")}`} text={t("sa.shareText")} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {stats.map((stat) => (
            <div key={stat.label} className="card-surface flex items-center gap-4 p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <stat.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <ProfileForm advisor={advisor} />

          <section className="card-surface h-fit p-6">
            <h2 className="text-lg">{t("dashboard.recentEnquiries")}</h2>
            {recent.length === 0 ? (
              <p className="mt-3 text-sm text-muted">{t("dashboard.noEnquiries")}</p>
            ) : (
              <ul className="mt-4 divide-y divide-borderline">
                {recent.map((enquiry) => (
                  <li key={enquiry.id} className="py-3">
                    <p className="text-sm font-semibold">
                      {enquiry.productInterest || t("dashboard.generalEnquiry")}
                    </p>
                    <p className="text-xs text-muted">
                      {enquiry.customerName || t("dashboard.anonymous")} · {formatDate(enquiry.createdAt, locale)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
