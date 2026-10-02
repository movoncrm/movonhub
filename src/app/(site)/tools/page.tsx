import type { Metadata } from "next";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/site/SectionHeading";
import { getStore } from "@/lib/db";
import { getI18n } from "@/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t("tools.title"),
    description: t("tools.body"),
    alternates: { canonical: "/tools" },
  };
}

export default async function ToolsPage() {
  const [{ t }, settings] = await Promise.all([getI18n(), getStore().getSettings()]);

  return (
    <div className="container-page py-14">
      <SectionHeading eyebrow={t("tools.eyebrow")} title={t("tools.title")} description={t("tools.body")} />

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {settings.tools.map((tool) => (
          <div key={tool.id} id={tool.id} className="card-surface flex flex-col p-6">
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon name={tool.icon} className="h-5 w-5" />
              </span>
              <Badge tone={tool.status === "live" ? "green" : "amber"}>
                {tool.status === "live" ? t("common.live") : t("common.comingSoon")}
              </Badge>
            </div>
            <h2 className="mt-5 text-base">{t(`tools.items.${tool.id}.name`)}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
              {t(`tools.items.${tool.id}.description`)}
            </p>
          </div>
        ))}
      </div>

      <section
        id="calculator"
        className="mt-14 scroll-mt-20 rounded-2xl border border-dashed border-borderline bg-background p-8"
      >
        <Badge tone="amber">{t("common.comingSoon")}</Badge>
        <h2 className="mt-3 text-xl">{t("tools.calculatorTitle")}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{t("tools.calculatorBody")}</p>
      </section>

      <section
        id="sales"
        className="mt-8 scroll-mt-20 rounded-2xl border border-dashed border-borderline bg-background p-8"
      >
        <Badge tone="amber">{t("common.comingSoon")}</Badge>
        <h2 className="mt-3 text-xl">{t("tools.salesTitle")}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{t("tools.salesBody")}</p>
      </section>
    </div>
  );
}
