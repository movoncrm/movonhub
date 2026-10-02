import type { Metadata } from "next";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { getStore } from "@/lib/db";
import { getI18n } from "@/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t("contact.title"),
    description: t("contact.body"),
    alternates: { canonical: "/contact" },
  };
}

export default async function ContactPage() {
  const [{ t }, advisors] = await Promise.all([
    getI18n(),
    getStore().listAdvisors({ activeOnly: true }),
  ]);

  return (
    <div className="container-page py-14">
      <SectionHeading eyebrow={t("contact.eyebrow")} title={t("contact.title")} description={t("contact.body")} />
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/advisors">{t("contact.advisors")}</ButtonLink>
        <a
          href="https://movon.com.my/find-us/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-xl border border-borderline px-5 py-2.5 text-sm font-semibold hover:border-primary hover:text-primary"
        >
          {t("contact.officialLocations")}
        </a>
      </div>
      {advisors.length > 0 && (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {advisors.map((advisor) => (
            <li key={advisor.id} className="card-surface p-5">
              <p className="font-bold">{advisor.name}</p>
              <p className="text-sm text-primary">{advisor.title}</p>
              <p className="mt-1 text-sm text-muted">{advisor.phoneDisplay || advisor.phone}</p>
              <ButtonLink href={`/sa/${advisor.slug}`} variant="secondary" size="sm" className="mt-3">
                {t("contact.viewPage")}
              </ButtonLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
