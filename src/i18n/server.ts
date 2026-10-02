import { cookies } from "next/headers";
import { LOCALE_COOKIE, normaliseLocale, type Locale } from "./config";
import { getDictionary, translate, type Dictionary } from "./index";

/** Server-only i18n helpers. Do not import from client components. */

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return normaliseLocale(store.get(LOCALE_COOKIE)?.value);
}

export interface ServerI18n {
  locale: Locale;
  dict: Dictionary;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

export async function getI18n(): Promise<ServerI18n> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return {
    locale,
    dict,
    t: (key, vars) => translate(dict, key, vars),
  };
}
