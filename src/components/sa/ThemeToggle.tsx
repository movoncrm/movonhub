"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { THEME_COOKIE, type MicrositeTheme } from "@/lib/theme";
import { cn } from "@/lib/cn";

export function ThemeToggle({ initial }: { initial: MicrositeTheme }) {
  const { t } = useI18n();
  const router = useRouter();
  const [theme, setTheme] = useState<MicrositeTheme>(initial);

  function toggle() {
    const next: MicrositeTheme = theme === "dark" ? "light" : "dark";
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    setTheme(next);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("sa.themeToggle")}
      title={t("sa.themeToggle")}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition",
        theme === "dark"
          ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
          : "border-borderline bg-surface text-ink hover:border-primary hover:text-primary",
      )}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
