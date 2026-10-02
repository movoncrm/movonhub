"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { useI18n } from "@/components/i18n/LanguageProvider";

export function ShareBar({ url, title, text }: { url: string; title: string; text?: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be unavailable */
    }
  }

  function share() {
    const shareText = `${text || title} ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer");
  }

  async function nativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        /* fall through to copy */
      }
    }
    void copy();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-2 rounded-xl border border-borderline bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary"
      >
        {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
        {copied ? t("common.copied") : t("common.copy")}
      </button>
      <button
        type="button"
        onClick={share}
        className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-[#04361a] transition hover:brightness-105"
      >
        <WhatsAppIcon className="h-4 w-4" /> {t("common.shareWhatsApp")}
      </button>
      <button
        type="button"
        onClick={nativeShare}
        className="inline-flex items-center gap-2 rounded-xl border border-borderline bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary"
      >
        <Share2 className="h-4 w-4" /> {t("common.share")}
      </button>
    </div>
  );
}
