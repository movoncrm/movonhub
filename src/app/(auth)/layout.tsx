import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { getI18n } from "@/i18n/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getI18n();
  return (
    <div className="min-h-screen bg-background">
      <header className="container-page flex h-16 items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <Link href="/" className="text-sm font-semibold text-muted hover:text-primary">
            {t("nav.backToSite")}
          </Link>
        </div>
      </header>
      <main className="container-page flex justify-center pb-20 pt-6">{children}</main>
    </div>
  );
}
