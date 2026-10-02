import type { Metadata } from "next";
import { ArrowRight, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { getI18n } from "@/i18n/server";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://movonhub.com.my";
const NIK_URL = "https://nik.movonhub.com.my";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: { absolute: t("comingSoon.metaTitle") },
    description: t("comingSoon.metaDescription"),
    alternates: { canonical: SITE },
    openGraph: {
      title: t("comingSoon.metaTitle"),
      description: t("comingSoon.metaDescription"),
      url: SITE,
      type: "website",
    },
  };
}

export default async function ComingSoonPage() {
  const { t } = await getI18n();

  // Configurable contact — no phone number/email is invented in code.
  const contactWhatsapp = (process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || "").replace(/[^0-9]/g, "");
  const contactHref = contactWhatsapp
    ? `https://wa.me/${contactWhatsapp}?text=${encodeURIComponent(t("comingSoon.ctaSecondary"))}`
    : "/contact";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-[-180px] h-[520px] w-[880px] max-w-[150vw] -translate-x-1/2 rounded-full bg-primary/25 blur-[150px]" />
      <div className="pointer-events-none absolute bottom-[-160px] right-[-120px] h-[380px] w-[380px] rounded-full bg-primary-dark/20 blur-[130px]" />

      {/* Top bar */}
      <div className="relative container-page flex h-20 items-center justify-between">
        <Logo variant="light" />
        <LanguageToggle className="border-white/15 bg-white/5" />
      </div>

      {/* Content */}
      <main className="relative flex flex-1 flex-col items-center justify-center px-5 pb-16 text-center sm:px-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-electric">
          <Sparkles className="h-3.5 w-3.5" /> {t("comingSoon.label")}
        </span>

        <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.08] text-[#F8FAFC] sm:text-6xl">
          {t("comingSoon.title")}
        </h1>

        <p className="mt-5 max-w-xl text-base leading-relaxed text-[#CBD5E1] sm:text-lg">
          {t("comingSoon.body")}
        </p>

        <span className="mt-8 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-electric">
          {t("comingSoon.status")}
        </span>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <a
            href={NIK_URL}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-white shadow-lift transition hover:bg-primary-dark"
          >
            {t("comingSoon.ctaPrimary")} <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href={contactHref}
            {...(contactWhatsapp ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-white/10"
          >
            {t("comingSoon.ctaSecondary")}
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-white/10">
        <div className="container-page py-6 text-center text-xs text-white/40">
          © {new Date().getFullYear()} MOVONHUB. {t("footer.rights")}
        </div>
      </footer>
    </div>
  );
}
