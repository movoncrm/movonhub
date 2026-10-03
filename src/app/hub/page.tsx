import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Bell,
  BookOpen,
  Calculator,
  LayoutDashboard,
  PenLine,
  Power,
  Sparkles,
  UserCircle,
  Users,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { CopyLinkButton } from "@/components/hub/CopyLinkButton";
import { CommissionCalculator } from "@/components/hub/CommissionCalculator";
import { getSession } from "@/lib/auth/session";
import { getStore } from "@/lib/db";
import { logout } from "@/app/(auth)/logout/actions";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("hub.title"), robots: { index: false, follow: false } };
}

export const dynamic = "force-dynamic";

export default async function HubPage() {
  const [session, { t }] = await Promise.all([getSession(), getI18n()]);
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin");
  if (!session.advisorId) redirect("/login");

  const advisor = await getStore().getAdvisorById(session.advisorId);
  if (!advisor) redirect("/login");

  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "movonhub.com.my";
  const salesUrl = `https://${advisor.slug}.${root}`;

  const tools = [
    { key: "ai", icon: Sparkles, status: "soon" as const, href: undefined },
    { key: "commission", icon: Calculator, status: "live" as const, href: "#calculator" },
    { key: "leads", icon: Users, status: "live" as const, href: "/dashboard/leads" },
    { key: "knowledge", icon: BookOpen, status: "live" as const, href: "/products" },
    { key: "content", icon: PenLine, status: "soon" as const, href: undefined },
    { key: "followup", icon: Bell, status: "soon" as const, href: undefined },
    { key: "page", icon: LayoutDashboard, status: "live" as const, href: `/sa/${advisor.slug}` },
    { key: "profile", icon: UserCircle, status: "live" as const, href: "/dashboard" },
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
            <Link
              href="/dashboard"
              className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-ink hover:bg-background sm:inline-flex"
            >
              <UserCircle className="h-4 w-4" /> {advisor.name}
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
        <h1 className="text-2xl">{t("hub.welcomeTitle", { name: advisor.name })}</h1>
        <p className="mt-1 text-sm text-muted">{t("hub.welcomeSubtitle")}</p>

        {/* My Sales Page quick actions */}
        <div className="card-surface mt-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold">{t("hub.tools.page.name")}</p>
            <p className="mt-0.5 break-all text-sm text-primary">{salesUrl}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={`/sa/${advisor.slug}`} variant="secondary" size="sm">
              {t("hub.previewPage")}
            </ButtonLink>
            <CopyLinkButton url={salesUrl} />
          </div>
        </div>

        {/* SA Toolkit */}
        <section className="mt-8">
          <h2 className="text-lg">{t("hub.toolkitTitle")}</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {tools.map((tool) => {
              const card = (
                <div className="group flex h-full flex-col rounded-2xl border border-borderline bg-surface p-5 shadow-card transition hover:border-primary/40">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <tool.icon className="h-5 w-5" />
                    </span>
                    {tool.status === "live" ? (
                      <Badge tone="green">{t("common.live")}</Badge>
                    ) : (
                      <Badge tone="amber">{t("common.comingSoon")}</Badge>
                    )}
                  </div>
                  <h3 className="mt-4 text-sm font-bold">{t(`hub.tools.${tool.key}.name`)}</h3>
                  <p className="mt-1 flex-1 text-xs leading-relaxed text-muted">{t(`hub.tools.${tool.key}.desc`)}</p>
                  {tool.href && (
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                      {t("common.open")} <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </span>
                  )}
                </div>
              );
              return tool.href ? (
                <Link key={tool.key} href={tool.href}>
                  {card}
                </Link>
              ) : (
                <div key={tool.key}>{card}</div>
              );
            })}
          </div>
        </section>

        {/* Commission Calculator */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <CommissionCalculator />

          <div className="space-y-4">
            <Link href="/dashboard" className="card-surface block p-5 transition hover:border-primary/40">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <UserCircle className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold">{t("hub.myProfile")}</h3>
                  <p className="text-xs text-muted">{t("hub.tools.profile.desc")}</p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 text-muted" />
              </div>
            </Link>

            <Link href="/dashboard/leads" className="card-surface block p-5 transition hover:border-primary/40">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold">{t("hub.tools.leads.name")}</h3>
                  <p className="text-xs text-muted">{t("hub.tools.leads.desc")}</p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 text-muted" />
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
