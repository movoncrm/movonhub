import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { BadgeCheck, Handshake, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { EnquiryButton } from "@/components/EnquiryButton";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { ThemeToggle } from "@/components/sa/ThemeToggle";
import { ShareBar } from "@/components/advisor/ShareBar";
import { AdvisorAvatar } from "@/components/advisor/AdvisorCard";
import { getStore } from "@/lib/db";
import { getDictionary, translate } from "@/i18n";
import { LOCALE_COOKIE } from "@/i18n/config";
import { getResolvedContent } from "@/lib/content";
import { resolveProductImageUrl } from "@/lib/assets/url";
import { THEME_COOKIE } from "@/lib/theme";
import { resolveAdvisorLocale, resolveAdvisorTheme } from "@/lib/saSettings";
import { formatRM, safeJsonLd, truncate } from "@/lib/utils";
import type { Advisor, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "movonhub.com.my";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://movonhub.com.my";

const FEATURED: { slug: string; group: "aircond" | "fridge" | "washer" | "lock" | "baby" }[] = [
  { slug: "movon-space-snowmate", group: "aircond" },
  { slug: "movon-chillmateplus-mseries", group: "fridge" },
  { slug: "movon-duomateplus-mseries", group: "washer" },
  { slug: "movon-space-lockmate", group: "lock" },
  { slug: "movon-stroller", group: "baby" },
  { slug: "movon-car-seat", group: "baby" },
];

function advisorPublicUrl(slug: string): string {
  return `https://${slug}.${ROOT_DOMAIN}`;
}

async function loadAdvisor(slug: string): Promise<Advisor | null> {
  return getStore().getAdvisorBySlug(slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const advisor = await loadAdvisor(slug);
  if (!advisor || advisor.status !== "published" || !advisor.active) {
    const dict = getDictionary("en");
    return { title: dict.sa.notFoundTitle, robots: { index: false, follow: false } };
  }
  const cookieStore = await cookies();
  const locale = resolveAdvisorLocale(advisor, cookieStore.get(LOCALE_COOKIE)?.value);
  const content = await getResolvedContent(locale, advisor.id);
  const firstName = advisor.whatsappName || advisor.name.split(" ")[0];
  const description = content.get("sa.seoDescription", { name: firstName });
  const pageTitle = content.get("sa.seoTitle", { name: firstName });
  const canonical = advisorPublicUrl(advisor.slug);
  return {
    title: { absolute: pageTitle },
    description: truncate(description, 160),
    alternates: { canonical },
    openGraph: {
      title: pageTitle,
      description: truncate(description, 200),
      url: canonical,
      type: "profile",
      images: advisor.photoUrl ? [{ url: advisor.photoUrl }] : undefined,
    },
    twitter: { card: "summary", title: pageTitle, description: truncate(description, 160) },
  };
}

export default async function AdvisorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [advisor, cookieStore] = await Promise.all([loadAdvisor(slug), cookies()]);
  if (!advisor) notFound();

  const locale = resolveAdvisorLocale(advisor, cookieStore.get(LOCALE_COOKIE)?.value);
  const dict = getDictionary(locale);
  const t = (key: string, vars?: Record<string, string | number>) => translate(dict, key, vars);
  const content = await getResolvedContent(locale, advisor.id);

  const theme = resolveAdvisorTheme(advisor, cookieStore.get(THEME_COOKIE)?.value);
  const isDark = theme === "dark";
  const showLanguageToggle = advisor.allowLanguageToggle !== false;
  const showThemeToggle = advisor.allowThemeToggle !== false;

  if (advisor.status === "suspended") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <Logo />
        <h1 className="mt-8 text-2xl">{t("sa.notFoundTitle")}</h1>
        <p className="mt-3 max-w-md text-sm text-muted">{t("sa.notFoundBody")}</p>
        <Link href="/" className="mt-6 text-sm font-semibold text-primary">
          MOVONHUB
        </Link>
      </div>
    );
  }

  if (advisor.status !== "published" || !advisor.active) notFound();

  const store = getStore();
  const looked = await Promise.all(FEATURED.map((f) => store.getProductBySlug(f.slug)));
  const featured: { product: Product; group: (typeof FEATURED)[number]["group"] }[] = [];
  FEATURED.forEach((entry, index) => {
    const product = looked[index];
    if (product && product.status === "active") featured.push({ product, group: entry.group });
  });

  const publicUrl = advisorPublicUrl(advisor.slug);
  const firstName = advisor.whatsappName || advisor.name.split(" ")[0];
  const accent = advisor.accent || "#1E7BFF";
  const disclaimer = content.get("sa.disclaimer", { name: firstName });

  const c = isDark
    ? {
        page: "bg-night text-[#F8FAFC]",
        header: "border-white/10 bg-night/80",
        body: "text-[#CBD5E1]",
        muted: "text-[#94A3B8]",
        card: "rounded-2xl border border-white/10 bg-night-card shadow-card",
        soft: "rounded-2xl border border-white/10 bg-night-soft",
        heading: "text-[#F8FAFC]",
        chip: "rounded-lg border border-white/10 bg-white/5 text-[#CBD5E1]",
        accent: "text-electric",
        productImg: "bg-[#0A1024]",
        footer: "border-white/10 bg-night-soft",
        benefit: "rounded-2xl border border-white/10 bg-night-card",
      }
    : {
        page: "bg-background text-ink",
        header: "border-borderline bg-surface/90",
        body: "text-muted",
        muted: "text-muted",
        card: "card-surface",
        soft: "rounded-2xl border border-borderline bg-surface",
        heading: "text-ink",
        chip: "rounded-lg border border-borderline bg-surface text-ink/80",
        accent: "text-primary",
        productImg: "bg-white",
        footer: "border-borderline bg-surface",
        benefit: "rounded-2xl border border-borderline bg-background",
      };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: advisor.name,
    jobTitle: t("sa.role"),
    description: advisor.bio,
    image: advisor.photoUrl || undefined,
    areaServed: advisor.location || "Malaysia",
    url: publicUrl,
    telephone: `+${advisor.phone}`,
    worksFor: { "@type": "Organization", name: "MOVONHUB" },
    disambiguatingDescription:
      "Independent Movon Sales Advisor page operated by the named individual. Not the official Movon corporate website.",
  };

  const benefits = [
    { icon: BadgeCheck, title: t("sa.why1Title"), body: t("sa.why1Body") },
    { icon: Handshake, title: t("sa.why2Title"), body: t("sa.why2Body") },
    { icon: MessageCircle, title: t("sa.why3Title"), body: t("sa.why3Body") },
  ];

  return (
    <LanguageProvider initialLocale={locale}>
      <div className={`flex min-h-screen flex-col ${c.page}`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

        <header className={`sticky top-0 z-40 border-b backdrop-blur ${c.header}`}>
          <div className="container-page flex h-16 items-center justify-between gap-3">
            <Logo variant={isDark ? "light" : "dark"} />
            <div className="flex items-center gap-2">
              <span className={`hidden text-sm font-semibold sm:inline ${c.heading}`}>{advisor.name}</span>
              <EnquiryButton
                phone={advisor.phone}
                advisorSlug={advisor.slug}
                advisorName={firstName}
                sourcePage={publicUrl}
                message={advisor.greeting}
                label={t("common.whatsapp")}
                size="sm"
              />
              {showThemeToggle && <ThemeToggle initial={isDark ? "dark" : "light"} />}
              {showLanguageToggle && (
                <LanguageToggle className={isDark ? "border-white/15 bg-white/5" : undefined} />
              )}
            </div>
          </div>
        </header>

        <main className="flex-1">
          {/* HERO + PROFILE */}
          <section style={{ background: `linear-gradient(160deg, ${accent}14, transparent 62%)` }}>
            <div className="container-page grid gap-10 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:py-16">
              <div>
                <div className="flex items-center gap-4">
                  <AdvisorAvatar advisor={advisor} className="h-16 w-16 text-xl" />
                  <div>
                    <p className={`text-lg font-bold ${c.heading}`}>{advisor.name}</p>
                    <p className="text-sm font-semibold" style={{ color: accent }}>
                      {t("sa.role")}
                    </p>
                  </div>
                </div>

                <h1 className={`mt-6 text-3xl leading-tight sm:text-4xl lg:text-5xl ${c.heading}`}>
                  {content.get("sa.heroHeadline")}
                </h1>
                <p className={`mt-4 max-w-xl text-base leading-relaxed ${c.body}`}>
                  {content.get("sa.heroSubtitle", { name: firstName })}
                </p>

                <div className="mt-7">
                  <EnquiryButton
                    phone={advisor.phone}
                    advisorSlug={advisor.slug}
                    advisorName={firstName}
                    sourcePage={publicUrl}
                    label={content.get("sa.whatsappCta", { name: firstName })}
                    size="lg"
                  />
                </div>
              </div>

              <div className={`${c.card} self-start p-6`}>
                <p className={`text-sm font-bold ${c.heading}`}>{t("sa.profileIntro")}</p>
                {advisor.location && <p className={`mt-3 text-xs ${c.muted}`}>{advisor.location}</p>}
                <EnquiryButton
                  phone={advisor.phone}
                  advisorSlug={advisor.slug}
                  advisorName={firstName}
                  sourcePage={publicUrl}
                  message={advisor.greeting}
                  label={t("common.whatsapp")}
                  size="md"
                  className="mt-4 w-full"
                />
              </div>
            </div>
          </section>

          {/* INTRO */}
          <section className="container-page pt-12">
            <div className={`mx-auto max-w-2xl rounded-2xl p-6 text-center ${c.soft}`}>
              <Sparkles className={`mx-auto h-5 w-5 ${c.accent}`} />
              <p className={`mt-3 text-base leading-relaxed ${c.body}`}>{advisor.bio || t("sa.profileIntro")}</p>
            </div>
          </section>

          {/* FEATURED PRODUCTS */}
          <section className="container-page py-12">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow">{t("sa.featuredEyebrow")}</p>
                <h2 className={`mt-1 text-2xl ${c.heading}`}>{content.get("sa.productTitle")}</h2>
                <p className={`mt-2 max-w-xl text-sm ${c.body}`}>{content.get("sa.productDescription")}</p>
              </div>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map(({ product, group }) => {
                const imageUrl = resolveProductImageUrl(product.imageUrl);
                return (
                <article key={product.id} className={`flex flex-col overflow-hidden ${c.card}`}>
                  <div className={`relative aspect-[4/3] overflow-hidden ${c.productImg}`}>
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-contain p-6"
                      />
                    ) : (
                      <div className={`flex h-full items-center justify-center text-sm ${c.muted}`}>
                        {t("common.noImage")}
                      </div>
                    )}
                    <span
                      className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${
                        isDark ? "bg-night/90 text-electric" : "bg-surface/90 text-primary-dark"
                      }`}
                    >
                      {t(`sa.groups.${group}`)}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className={`text-base font-bold leading-snug ${c.heading}`}>{product.name}</h3>
                    <p className={`mt-2 line-clamp-2 flex-1 text-sm leading-relaxed ${c.body}`}>
                      {product.shortDescription}
                    </p>
                    <p className={`mt-3 text-sm font-semibold ${c.heading}`}>
                      {product.outrightPrice ? formatRM(product.outrightPrice) : t("sa.contactForDetails")}
                    </p>
                    <EnquiryButton
                      phone={advisor.phone}
                      advisorSlug={advisor.slug}
                      advisorName={firstName}
                      productInterest={`${product.name}${product.series ? ` (${product.series})` : ""}`}
                      sourcePage={publicUrl}
                      label={t("sa.enquire")}
                      size="sm"
                      className="mt-4 w-full"
                    />
                  </div>
                </article>
                );
              })}
            </div>

            <div className="mt-6">
              <Link href="/products" className={`text-sm font-semibold ${c.accent}`}>
                {t("sa.allProducts")}
              </Link>
            </div>
          </section>

          {/* WHY CONTACT */}
          <section className={`py-12 ${isDark ? "bg-night-soft" : "bg-surface"}`}>
            <div className="container-page">
              <h2 className={`text-2xl ${c.heading}`}>{content.get("sa.whyTitle")}</h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-3">
                {benefits.map((item) => (
                  <div key={item.title} className={`p-6 ${c.benefit}`}>
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                        isDark ? "bg-primary/15 text-electric" : "bg-primary/10 text-primary"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                    </span>
                    <h3 className={`mt-4 text-base ${c.heading}`}>{item.title}</h3>
                    <p className={`mt-2 text-sm leading-relaxed ${c.body}`}>{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FINAL CTA */}
          <section className="container-page py-14">
            <div className="rounded-3xl bg-gradient-to-br from-primary-dark to-primary p-8 text-center text-white sm:p-12">
              <ShieldCheck className="mx-auto h-7 w-7 text-movon-gold" />
              <h2 className="mt-4 text-3xl text-white">{content.get("sa.finalTitle")}</h2>
              <p className="mx-auto mt-3 max-w-lg text-white/85">{content.get("sa.finalDescription")}</p>
              <div className="mt-7 flex flex-col items-center gap-4">
                <EnquiryButton
                  phone={advisor.phone}
                  advisorSlug={advisor.slug}
                  advisorName={firstName}
                  sourcePage={publicUrl}
                  label={content.get("sa.finalButton", { name: firstName })}
                  size="lg"
                />
                <ShareBar
                  url={publicUrl}
                  title={`${advisor.name} | ${t("sa.role")}`}
                  text={`${t("sa.shareText")} ${advisor.name}:`}
                />
              </div>
            </div>
          </section>
        </main>

        <footer className={`border-t py-8 ${c.footer}`}>
          <div className={`container-page flex flex-col gap-5 text-xs ${c.muted}`}>
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex flex-col items-center gap-1 sm:items-start">
                <span className={`text-sm font-bold ${c.heading}`}>
                  {advisor.name} - {t("sa.role")}
                </span>
                <span>© {new Date().getFullYear()} MOVONHUB</span>
              </div>
              <div className="flex items-center gap-4">
                <EnquiryButton
                  phone={advisor.phone}
                  advisorSlug={advisor.slug}
                  advisorName={firstName}
                  sourcePage={publicUrl}
                  label={t("common.whatsapp")}
                  size="sm"
                />
                <Link href="/" className={`font-semibold ${c.accent}`}>
                  MOVONHUB
                </Link>
              </div>
            </div>

            <p className={`mx-auto max-w-3xl text-center leading-relaxed ${c.muted}`}>
              {content.get("sa.footer")} {disclaimer}{" "}
              <a href={`${SITE}/disclaimer`} className={`font-semibold ${c.accent}`}>
                {t("sa.disclaimerLink")}
              </a>
            </p>
          </div>
        </footer>
      </div>
    </LanguageProvider>
  );
}
