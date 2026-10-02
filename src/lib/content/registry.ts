import type { ContentScope } from "@/lib/types";

/**
 * Registry of editable public website copy.
 *
 * Every entry maps a stable `key` to a default i18n dictionary key. Super Admin
 * overrides are stored in `site_content`; when no published override exists the
 * dictionary default is used. This keeps the site fully functional if the
 * content table is empty or unavailable.
 */
export interface ContentKeyDef {
  key: string;
  /** Registry scope bucket: main site or SA microsite. */
  scope: "site" | "sa";
  group: string;
  label: string;
  help?: string;
  defaultKey: string;
  multiline?: boolean;
  maxLength: number;
  seo?: boolean;
}

export const SITE_CONTENT_KEYS: ContentKeyDef[] = [
  {
    key: "home.eyebrow",
    scope: "site",
    group: "Header",
    label: "Eyebrow text",
    defaultKey: "comingSoon.label",
    maxLength: 120,
  },
  {
    key: "home.headline",
    scope: "site",
    group: "Header",
    label: "Main headline",
    defaultKey: "comingSoon.title",
    maxLength: 160,
  },
  {
    key: "home.body",
    scope: "site",
    group: "Header",
    label: "Supporting paragraph",
    defaultKey: "comingSoon.body",
    multiline: true,
    maxLength: 400,
  },
  {
    key: "home.status",
    scope: "site",
    group: "Header",
    label: "Status label",
    defaultKey: "comingSoon.status",
    maxLength: 60,
  },
  {
    key: "home.primaryButton",
    scope: "site",
    group: "Buttons",
    label: "Primary button text",
    defaultKey: "comingSoon.ctaPrimary",
    maxLength: 80,
  },
  {
    key: "home.contactButton",
    scope: "site",
    group: "Buttons",
    label: "Contact button text",
    defaultKey: "comingSoon.ctaSecondary",
    maxLength: 80,
  },
  {
    key: "home.footer",
    scope: "site",
    group: "Footer",
    label: "Footer text",
    defaultKey: "footer.rights",
    maxLength: 200,
  },
  {
    key: "home.disclaimer",
    scope: "site",
    group: "Footer",
    label: "Disclaimer",
    defaultKey: "legal.mainDisclaimer",
    multiline: true,
    maxLength: 800,
  },
  {
    key: "home.seoTitle",
    scope: "site",
    group: "SEO",
    label: "SEO title",
    defaultKey: "comingSoon.metaTitle",
    maxLength: 70,
    seo: true,
  },
  {
    key: "home.seoDescription",
    scope: "site",
    group: "SEO",
    label: "SEO description",
    defaultKey: "comingSoon.metaDescription",
    multiline: true,
    maxLength: 200,
    seo: true,
  },
];

export const SA_CONTENT_KEYS: ContentKeyDef[] = [
  {
    key: "sa.heroHeadline",
    scope: "sa",
    group: "Hero",
    label: "Hero headline",
    defaultKey: "sa.heroTitle",
    maxLength: 160,
  },
  {
    key: "sa.heroSubtitle",
    scope: "sa",
    group: "Hero",
    label: "Hero introduction",
    help: "You can use {name} to insert the advisor's display name.",
    defaultKey: "sa.heroSubtitle",
    multiline: true,
    maxLength: 400,
  },
  {
    key: "sa.whatsappCta",
    scope: "sa",
    group: "Hero",
    label: "WhatsApp call to action",
    help: "You can use {name} to insert the advisor's display name.",
    defaultKey: "sa.heroCta",
    maxLength: 90,
  },
  {
    key: "sa.productTitle",
    scope: "sa",
    group: "Products",
    label: "Product section title",
    defaultKey: "sa.featuredTitle",
    maxLength: 120,
  },
  {
    key: "sa.productDescription",
    scope: "sa",
    group: "Products",
    label: "Product section description",
    defaultKey: "sa.featuredBody",
    multiline: true,
    maxLength: 400,
  },
  {
    key: "sa.whyTitle",
    scope: "sa",
    group: "Why choose Movon",
    label: "Why choose Movon section title",
    defaultKey: "sa.whyTitle",
    maxLength: 120,
  },
  {
    key: "sa.finalTitle",
    scope: "sa",
    group: "Final call to action",
    label: "Final call to action headline",
    defaultKey: "sa.finalTitle",
    maxLength: 120,
  },
  {
    key: "sa.finalDescription",
    scope: "sa",
    group: "Final call to action",
    label: "Final call to action description",
    defaultKey: "sa.finalBody",
    multiline: true,
    maxLength: 400,
  },
  {
    key: "sa.finalButton",
    scope: "sa",
    group: "Final call to action",
    label: "Final call to action button",
    help: "You can use {name} to insert the advisor's display name.",
    defaultKey: "sa.finalButton",
    maxLength: 90,
  },
  {
    key: "sa.footer",
    scope: "sa",
    group: "Footer",
    label: "Footer note",
    defaultKey: "landing.footerTagline",
    maxLength: 200,
  },
  {
    key: "sa.disclaimer",
    scope: "sa",
    group: "Footer",
    label: "Disclaimer",
    help: "You can use {name} to insert the advisor's display name.",
    defaultKey: "sa.disclaimer",
    multiline: true,
    maxLength: 800,
  },
  {
    key: "sa.seoTitle",
    scope: "sa",
    group: "SEO",
    label: "SEO title",
    help: "You can use {name} to insert the advisor's display name.",
    defaultKey: "sa.seoTitle",
    maxLength: 70,
    seo: true,
  },
  {
    key: "sa.seoDescription",
    scope: "sa",
    group: "SEO",
    label: "SEO description",
    help: "You can use {name} to insert the advisor's display name.",
    defaultKey: "sa.metaDescription",
    multiline: true,
    maxLength: 200,
    seo: true,
  },
];

export const ALL_CONTENT_KEYS: ContentKeyDef[] = [...SITE_CONTENT_KEYS, ...SA_CONTENT_KEYS];

export function contentKeysForScope(scope: ContentScope): ContentKeyDef[] {
  if (scope === "site") return SITE_CONTENT_KEYS;
  return SA_CONTENT_KEYS;
}

export function contentKeyDef(key: string): ContentKeyDef | undefined {
  return ALL_CONTENT_KEYS.find((entry) => entry.key === key);
}
