import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { getI18n } from "@/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <Logo />
      <p className="mt-8 text-sm font-bold uppercase tracking-widest text-primary">404</p>
      <h1 className="mt-2 text-3xl">{t("common.notFoundTitle")}</h1>
      <p className="mt-3 max-w-md text-sm text-muted">{t("common.notFoundBody")}</p>
      <div className="mt-6 flex gap-3">
        <ButtonLink href="/">{t("nav.backToSite")}</ButtonLink>
        <ButtonLink href="/advisors" variant="secondary">
          {t("nav.advisors")}
        </ButtonLink>
      </div>
    </div>
  );
}
