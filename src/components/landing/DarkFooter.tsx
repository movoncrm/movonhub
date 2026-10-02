import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { getI18n } from "@/i18n/server";

export async function DarkFooter() {
  const { t } = await getI18n();

  const links = [
    { href: "/", label: t("landing.navHome") },
    { href: "/sa/nik", label: t("landing.navSample") },
    { href: "/login", label: t("nav.login") },
  ];

  return (
    <footer className="border-t border-white/10 bg-night-soft">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-12 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <Logo variant="light" />
          <p className="mt-4 max-w-md text-sm text-white/60">{t("landing.footerTagline")}</p>
        </div>
        <div className="flex flex-col gap-5 lg:items-end">
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2" aria-label="Footer">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm font-semibold text-white/70 hover:text-white">
                {link.label}
              </Link>
            ))}
            <LanguageToggle className="border-white/15 bg-white/5" />
          </nav>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto w-full max-w-6xl px-5 py-6 text-xs text-white/40 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} MOVONHUB. {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}
