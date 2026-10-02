"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { buttonClasses } from "@/components/ui/Button";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { cn } from "@/lib/cn";

export function NavbarClient({ accountHref, accountLabel }: { accountHref: string; accountLabel: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useI18n();

  const links = [
    { href: "/", label: t("nav.home") },
    { href: "/sa/nik", label: t("nav.saSample") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-borderline/80 bg-surface/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-semibold transition",
                pathname === link.href ? "text-primary" : "text-ink/80 hover:bg-background hover:text-ink",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageToggle />
          <Link href={accountHref} className={buttonClasses("primary", "sm")}>
            {accountLabel}
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <LanguageToggle />
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-borderline"
            aria-label={open ? t("nav.close") : t("nav.menu")}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-borderline bg-surface lg:hidden">
          <nav className="container-page flex flex-col py-3" aria-label="Mobile">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-semibold text-ink hover:bg-background"
              >
                {link.label}
              </Link>
            ))}
            <Link href={accountHref} onClick={() => setOpen(false)} className={buttonClasses("primary", "md", "mt-2")}>
              {accountLabel}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
