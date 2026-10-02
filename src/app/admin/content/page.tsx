import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { getSession } from "@/lib/auth/session";
import { getStore } from "@/lib/db";
import { getDictionary, translate } from "@/i18n";
import { getI18n } from "@/i18n/server";
import { contentKeysForScope } from "@/lib/content/registry";
import { contentScopeSchema } from "@/lib/validation";
import { logout } from "@/app/(auth)/logout/actions";
import type { ContentScope, SiteContent } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("admin.content.title"), robots: { index: false, follow: false } };
}

export const dynamic = "force-dynamic";

function pickValue(rows: SiteContent[], key: string, locale: "en" | "ms"): string {
  const candidates = rows.filter((row) => row.contentKey === key && row.locale === locale);
  const published = candidates.find((row) => row.status === "published");
  return (published ?? candidates[0])?.value ?? "";
}

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; advisor?: string }>;
}) {
  const [session, { t }] = await Promise.all([getSession(), getI18n()]);
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/hub");

  const params = await searchParams;
  const scope: ContentScope = contentScopeSchema.safeParse(params.scope).success
    ? (params.scope as ContentScope)
    : "site";

  const store = getStore();
  const advisors = await store.listAdvisors();
  const advisorId = scope === "sa" ? params.advisor || advisors[0]?.id : undefined;
  const selectedAdvisor = advisorId ? advisors.find((advisor) => advisor.id === advisorId) : undefined;

  const rows = await store.listSiteContent({
    scope,
    advisorId: scope === "sa" ? advisorId ?? null : null,
  });
  const defs = contentKeysForScope(scope);

  const dictEn = getDictionary("en");
  const dictMs = getDictionary("ms");
  const initial = { en: {} as Record<string, string>, ms: {} as Record<string, string> };
  const defaults = { en: {} as Record<string, string>, ms: {} as Record<string, string> };
  for (const def of defs) {
    initial.en[def.key] = pickValue(rows, def.key, "en");
    initial.ms[def.key] = pickValue(rows, def.key, "ms");
    const en = translate(dictEn, def.defaultKey);
    const ms = translate(dictMs, def.defaultKey);
    defaults.en[def.key] = en === def.defaultKey ? "" : en;
    defaults.ms[def.key] = ms === def.defaultKey ? "" : ms;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-borderline bg-surface">
        <div className="container-page flex h-16 items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Logo />
            <Badge tone="blue">{t("admin.content.title")}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm">
                {t("admin.logout")}
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container-page py-8">
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
          <ArrowLeft className="h-4 w-4" /> {t("nav.admin")}
        </Link>
        <h1 className="mt-3 text-2xl">{t("admin.content.title")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">{t("admin.content.intro")}</p>

        <form method="get" className="card-surface mt-5 flex flex-wrap items-end gap-3 p-4">
          <div>
            <label className="field-label">{t("admin.content.chooseScope")}</label>
            <select name="scope" defaultValue={scope} className="field-input min-w-56">
              <option value="site">{t("admin.content.scopeSite")}</option>
              <option value="sa_global">{t("admin.content.scopeSaGlobal")}</option>
              <option value="sa">{t("admin.content.scopeSa")}</option>
            </select>
          </div>
          <div>
            <label className="field-label">{t("admin.content.chooseAdvisor")}</label>
            <select name="advisor" defaultValue={advisorId} className="field-input min-w-56">
              {advisors.map((advisor) => (
                <option key={advisor.id} value={advisor.id}>
                  {advisor.name} ({advisor.slug})
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="secondary" size="md">
            {t("common.open")}
          </Button>
        </form>

        <p className="mt-3 text-xs text-muted">
          {t("admin.content.scopeSite")} / {t("admin.content.scopeSaGlobal")} / {t("admin.content.scopeSa")}
          {selectedAdvisor ? `: ${selectedAdvisor.name}` : ""}
        </p>

        <ContentEditor
          scope={scope}
          advisorId={scope === "sa" ? advisorId : undefined}
          defs={defs}
          initial={initial}
          defaults={defaults}
        />
      </main>
    </div>
  );
}
