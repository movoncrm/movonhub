import { getDictionary, interpolate, translate } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { getStore } from "@/lib/db";
import type { SiteContent } from "@/lib/types";
import {
  ALL_CONTENT_KEYS,
  SA_CONTENT_KEYS,
  SITE_CONTENT_KEYS,
  contentKeyDef,
  type ContentKeyDef,
} from "./registry";

export type { ContentKeyDef } from "./registry";
export { SITE_CONTENT_KEYS, SA_CONTENT_KEYS, ALL_CONTENT_KEYS, contentKeysForScope, contentKeyDef } from "./registry";

export interface ResolvedContent {
  /** Resolve a content key for the current locale and advisor (if any). */
  get: (key: string, vars?: Record<string, string | number>) => string;
  /** True when a published Super Admin override exists for the key. */
  isOverridden: (key: string) => boolean;
}

function defaultText(def: ContentKeyDef, locale: Locale): string {
  const dict = getDictionary(locale);
  const text = translate(dict, def.defaultKey);
  // translate returns the key itself when missing; treat that as no default.
  return text === def.defaultKey ? "" : text;
}

/**
 * Resolve public copy for a locale, optionally for a specific advisor.
 *
 * Precedence per key:
 *   1. published advisor-specific override (scope = "sa")
 *   2. published SA global override (scope = "sa_global")
 *   3. published main-site override (scope = "site")
 *   4. built-in dictionary default
 *
 * Any failure to read the content table falls back to dictionary defaults so a
 * database problem can never blank the public site.
 */
export async function getResolvedContent(
  locale: Locale,
  advisorId?: string | null,
): Promise<ResolvedContent> {
  let rows: SiteContent[] = [];
  try {
    rows = await getStore().listSiteContent();
  } catch (error) {
    console.error("[content] falling back to defaults", error instanceof Error ? error.message : error);
    rows = [];
  }
  const published = rows.filter((row) => row.status === "published" && row.locale === locale);

  const find = (scope: SiteContent["scope"], advisor: string | null, key: string): string | undefined => {
    const match = published.find(
      (row) =>
        row.scope === scope &&
        (advisor === null ? !row.advisorId : row.advisorId === advisor) &&
        row.contentKey === key,
    );
    return match && match.value !== "" ? match.value : undefined;
  };

  const overrides = new Map<string, string>();
  for (const def of ALL_CONTENT_KEYS) {
    const value =
      def.scope === "site"
        ? find("site", null, def.key)
        : (advisorId ? find("sa", advisorId, def.key) : undefined) ?? find("sa_global", null, def.key);
    if (value !== undefined) overrides.set(def.key, value);
  }

  return {
    get(key, vars) {
      const def = contentKeyDef(key);
      const override = overrides.get(key);
      const raw = override ?? (def ? defaultText(def, locale) : "");
      return interpolate(raw, vars);
    },
    isOverridden(key) {
      return overrides.has(key);
    },
  };
}

export { SITE_CONTENT_KEYS as siteContentKeys, SA_CONTENT_KEYS as saContentKeys };
