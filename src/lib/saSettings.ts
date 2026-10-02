import { isLocale, type Locale } from "@/i18n/config";
import { normaliseTheme, type MicrositeTheme } from "@/lib/theme";
import type { Advisor } from "@/lib/types";

/**
 * Resolve the language for an advisor page.
 * Order: advisor default (when toggling is disabled) -> stored visitor cookie
 * -> advisor default. A visitor preference can never override a disabled toggle.
 */
export function resolveAdvisorLocale(
  advisor: Pick<Advisor, "defaultLocale" | "allowLanguageToggle">,
  cookieLocale?: string,
): Locale {
  const fallback = advisor.defaultLocale ?? "en";
  if (advisor.allowLanguageToggle === false) return fallback;
  return isLocale(cookieLocale) ? cookieLocale : fallback;
}

/** Resolve the theme for an advisor page using the same precedence rules. */
export function resolveAdvisorTheme(
  advisor: Pick<Advisor, "preferredTheme" | "allowThemeToggle">,
  cookieTheme?: string,
): MicrositeTheme {
  const fallback = advisor.preferredTheme || "light";
  if (advisor.allowThemeToggle === false) return fallback;
  return normaliseTheme(cookieTheme, fallback);
}
