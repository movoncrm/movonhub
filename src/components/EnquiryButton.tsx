"use client";

import { useState } from "react";
import { buildEnquiryMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { cn } from "@/lib/cn";

type Variant = "primary" | "whatsapp" | "secondary";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary: "bg-movon-blue text-white hover:bg-movon-blueDark shadow-lift",
  whatsapp: "bg-[#25D366] text-[#04361a] hover:brightness-105",
  secondary: "bg-white text-movon-ink border border-movon-line hover:border-[#25D366] hover:text-emerald-700",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3.5 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-base",
};

export function EnquiryButton({
  phone,
  advisorSlug,
  advisorName,
  productInterest,
  sourcePage,
  customerName,
  message,
  label = "Enquire on WhatsApp",
  variant = "whatsapp",
  size = "md",
  className,
  onRecorded,
}: {
  phone: string;
  advisorSlug?: string;
  advisorName?: string;
  productInterest?: string;
  sourcePage?: string;
  customerName?: string;
  message?: string;
  label?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  onRecorded?: () => void;
}) {
  const [busy, setBusy] = useState(false);

  function handleClick() {
    const text = message || buildEnquiryMessage({ advisorName, product: productInterest, sourceUrl: sourcePage, customerName });
    const url = buildWhatsAppUrl(phone, text);

    try {
      void fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advisorSlug,
          productInterest,
          sourcePage,
          customerName,
          channel: "whatsapp",
          message: text,
        }),
        keepalive: true,
      }).catch(() => undefined);
      onRecorded?.();
    } catch {
      /* enquiry logging must never block the customer */
    }

    setBusy(true);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => setBusy(false), 800);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/30 active:scale-[.98]",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      <WhatsAppIcon className="h-4 w-4" />
      {busy ? "Opening WhatsApp…" : label}
    </button>
  );
}
