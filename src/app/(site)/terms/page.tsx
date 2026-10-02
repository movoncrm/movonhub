import type { Metadata } from "next";
import { SectionHeading } from "@/components/site/SectionHeading";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("terms.title"), alternates: { canonical: "/terms" } };
}

export default async function TermsPage() {
  const { t } = await getI18n();
  return (
    <div className="container-page py-14">
      <SectionHeading eyebrow={t("terms.eyebrow")} title={t("terms.title")} />
      <div className="mt-8 max-w-3xl space-y-4 text-sm leading-relaxed text-muted">
        <p>{t("terms.p1")}</p>
        <p>{t("terms.p2")}</p>
        <p>{t("terms.p3")}</p>
        <p>{t("terms.p4")}</p>
      </div>
    </div>
  );
}
