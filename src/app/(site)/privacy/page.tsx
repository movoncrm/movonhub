import type { Metadata } from "next";
import { SectionHeading } from "@/components/site/SectionHeading";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("privacy.title"), alternates: { canonical: "/privacy" } };
}

export default async function PrivacyPage() {
  const { t } = await getI18n();
  return (
    <div className="container-page py-14">
      <SectionHeading eyebrow={t("privacy.eyebrow")} title={t("privacy.title")} />
      <div className="mt-8 max-w-3xl space-y-4 text-sm leading-relaxed text-muted">
        <p>{t("privacy.p1")}</p>
        <p>{t("privacy.p2")}</p>
        <p>{t("privacy.p3")}</p>
        <p>{t("privacy.p4")}</p>
      </div>
    </div>
  );
}
