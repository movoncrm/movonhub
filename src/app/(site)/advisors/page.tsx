import type { Metadata } from "next";
import { SectionHeading } from "@/components/site/SectionHeading";
import { AdvisorCard } from "@/components/advisor/AdvisorCard";
import { getStore } from "@/lib/db";
import { getI18n } from "@/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t("advisors.title"),
    description: t("advisors.body"),
    alternates: { canonical: "/advisors" },
  };
}

export default async function AdvisorsPage() {
  const [{ t }, advisors] = await Promise.all([
    getI18n(),
    getStore().listAdvisors({ activeOnly: true }),
  ]);

  return (
    <div className="container-page py-14">
      <SectionHeading
        eyebrow={t("advisors.eyebrow")}
        title={t("advisors.title")}
        description={t("advisors.body")}
      />
      {advisors.length === 0 ? (
        <p className="mt-10 text-muted">{t("advisors.empty")}</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {advisors.map((advisor) => (
            <AdvisorCard key={advisor.id} advisor={advisor} />
          ))}
        </div>
      )}
    </div>
  );
}
