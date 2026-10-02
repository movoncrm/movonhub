import type { Metadata } from "next";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t("about.title"),
    description: t("about.body"),
    alternates: { canonical: "/about" },
  };
}

export default async function AboutPage() {
  const { t } = await getI18n();

  return (
    <div className="container-page py-14">
      <SectionHeading eyebrow={t("about.eyebrow")} title={t("about.title")} description={t("about.body")} />
      <div className="mt-8 max-w-3xl space-y-4 text-sm leading-relaxed text-muted">
        <p>{t("about.p1")}</p>
        <p>{t("about.p2")}</p>
        <p>{t("about.p3")}</p>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/register">{t("about.ctaRegister")}</ButtonLink>
        <ButtonLink href="/products" variant="secondary">
          {t("about.ctaProducts")}
        </ButtonLink>
      </div>
    </div>
  );
}
