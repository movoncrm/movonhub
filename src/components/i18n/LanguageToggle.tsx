"use client";

import { useI18n } from "./LanguageProvider";
import { cn } from "@/lib/cn";
import type { Locale } from "@/i18n/config";

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  const options: { value: Locale; label: string }[] = [
    { value: "en", label: "EN" },
    { value: "ms", label: "BM" },
  ];

  return (
    <div
      role="group"
      aria-label={t("common.language")}
      className={cn(
        "inline-flex items-center rounded-full border border-borderline bg-surface p-0.5 text-xs font-bold",
        className,
      )}
    >
      {options.map((option) => {
        const active = locale === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => setLocale(option.value)}
            className={cn(
              "rounded-full px-2.5 py-1 transition",
              active ? "bg-primary text-white" : "text-muted hover:text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
