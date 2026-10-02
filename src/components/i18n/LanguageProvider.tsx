"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { dictionaries, translate, type Dictionary, type Translator } from "@/i18n";
import { LOCALE_COOKIE, type Locale } from "@/i18n/config";

interface I18nContextValue {
  locale: Locale;
  dict: Dictionary;
  t: Translator;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function LanguageProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const router = useRouter();

  const dict = dictionaries[locale];
  const t = useCallback<Translator>((key, vars) => translate(dict, key, vars), [dict]);

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;
      // Persist for one year, then update client text immediately and let
      // server components re-render with the new cookie (soft refresh).
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      setLocaleState(next);
      router.refresh();
    },
    [locale, router],
  );

  const value = useMemo<I18nContextValue>(() => ({ locale, dict, t, setLocale }), [locale, dict, t, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within a LanguageProvider");
  return ctx;
}
