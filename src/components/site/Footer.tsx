import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { getI18n } from "@/i18n/server";

export async function Footer() {
  const { t } = await getI18n();

  const links = [
    { href: "/", label: t("nav.home") },
    { href: "/sa/nik", label: t("nav.saSample") },
    { href: "/disclaimer", label: t("disclaimer.title") },
    { href: "/privacy", label: t("privacy.title") },
    { href: "/terms", label: t("terms.title") },
  ];

  return (
    <footer className="border-t border-borderline bg-movon-slateDark text-white">
      <div className="container-page flex flex-col gap-8 py-12 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Logo variant="light" />
          <p className="mt-4 max-w-sm text-sm text-white/70">{t("footer.tagline")}</p>
        </div>
        <div className="flex flex-col gap-5 lg:items-end">
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2" aria-label="Footer">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm font-semibold text-white/80 hover:text-white">
                {link.label}
              </Link>
            ))}
            <LanguageToggle className="border-white/20 bg-white/10" />
          </nav>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} MOVONHUB. {t("footer.rights")}
          </p>
          <p className="max-w-2xl">{t("legal.mainDisclaimer")}</p>
        </div>
      </div>
    </footer>
  );
}
