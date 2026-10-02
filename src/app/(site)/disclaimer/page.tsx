import type { Metadata } from "next";
import { SectionHeading } from "@/components/site/SectionHeading";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("disclaimer.title"), alternates: { canonical: "/disclaimer" } };
}

export default async function DisclaimerPage() {
  const { t } = await getI18n();
  return (
    <div className="container-page py-14">
      <SectionHeading eyebrow={t("disclaimer.eyebrow")} title={t("disclaimer.title")} />
      <div className="mt-8 max-w-3xl space-y-4 text-sm leading-relaxed text-muted">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          {t("disclaimer.reviewNotice")}
        </div>
        <p>{t("disclaimer.p1")}</p>
        <p>{t("disclaimer.p2")}</p>
        <p>{t("disclaimer.p3")}</p>
        <h2 className="pt-4 text-base font-bold text-ink">{t("sa.disclaimerLink")}</h2>
        <p>{t("sa.disclaimer", { name: "the advisor" })}</p>
        <div className="pt-6">
          <h2 className="text-base font-bold text-ink">{t("legal.entityName")}</h2>
          <ul className="mt-2 space-y-1">
            <li>{t("legal.registration")}</li>
            <li>{t("legal.address")}</li>
            <li>{t("legal.contact")}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
