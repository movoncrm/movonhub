import ms, { type Dictionary } from "./ms";
import en from "./en";
import { defaultLocale, type Locale } from "./config";

export { locales, defaultLocale, localeNames, isLocale, normaliseLocale, LOCALE_COOKIE } from "./config";
export type { Locale } from "./config";
export type { Dictionary } from "./ms";

export const dictionaries: Record<Locale, Dictionary> = { ms, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

export type TranslationVars = Record<string, string | number>;

/** Resolve a dot-path key and interpolate {placeholders}. Falls back to the key. */
export function translate(dict: Dictionary, key: string, vars?: TranslationVars): string {
  const value = key
    .split(".")
    .reduce<unknown>((acc, part) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[part] : undefined), dict);

  if (typeof value !== "string") return key;
  return interpolate(value, vars);
}

export function interpolate(template: string, vars?: TranslationVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in vars ? String(vars[name]) : `{${name}}`,
  );
}

export type Translator = (key: string, vars?: TranslationVars) => string;
