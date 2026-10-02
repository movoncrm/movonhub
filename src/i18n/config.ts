export const locales = ["ms", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  ms: "Bahasa Melayu",
  en: "English",
};

/** Cookie used to persist the visitor's language choice. */
export const LOCALE_COOKIE = "mh_lang";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function normaliseLocale(value: unknown): Locale {
  return isLocale(value) ? value : defaultLocale;
}
