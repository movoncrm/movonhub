import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PartyPopper } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { ShareBar } from "@/components/advisor/ShareBar";
import { getStore } from "@/lib/db";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("success.title"), robots: { index: false, follow: false } };
}

export const dynamic = "force-dynamic";

export default async function RegisterSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const { slug } = await searchParams;
  if (!slug) redirect("/register");

  const [advisor, { t }] = await Promise.all([getStore().getAdvisorBySlug(slug), getI18n()]);
  if (!advisor) redirect("/register");

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://movonhub.com.my";
  const publicUrl = `${site}/sa/${advisor.slug}`;

  return (
    <div className="w-full max-w-xl">
      <div className="card-surface p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-success">
          <PartyPopper className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl">{t("success.title")}</h1>
        <p className="mt-2 text-sm text-muted">
          {t("success.subtitle", { name: advisor.name.split(" ")[0] })}
        </p>

        <div className="mt-5 break-all rounded-xl border border-borderline bg-background px-4 py-3 text-sm font-semibold text-primary">
          {publicUrl}
        </div>

        <div className="mt-5 flex justify-center">
          <ShareBar
            url={publicUrl}
            title={`${advisor.name} | MOVON Star Advisor`}
            text={t("success.shareText")}
          />
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href={`/sa/${advisor.slug}`}>{t("success.preview")}</ButtonLink>
          <ButtonLink href="/dashboard" variant="secondary">
            {t("success.dashboard")}
          </ButtonLink>
        </div>

        <p className="mt-6 text-xs text-muted">
          {t("success.editLater")}{" "}
          <Link href="/dashboard" className="font-semibold text-primary">
            {t("success.dashboardLink")}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
