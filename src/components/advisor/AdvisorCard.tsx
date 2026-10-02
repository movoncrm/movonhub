import Image from "next/image";
import { MapPin } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { EnquiryButton } from "@/components/EnquiryButton";
import { getI18n } from "@/i18n/server";
import type { Advisor } from "@/lib/types";

export function AdvisorAvatar({ advisor, className }: { advisor: Advisor; className?: string }) {
  if (advisor.photoUrl) {
    return (
      <span className={`relative block overflow-hidden rounded-full bg-background ${className ?? "h-16 w-16"}`}>
        <Image src={advisor.photoUrl} alt={advisor.name} fill sizes="96px" className="object-cover" />
      </span>
    );
  }
  const initials = advisor.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
  return (
    <span
      className={`flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark font-bold text-white ${className ?? "h-16 w-16 text-xl"}`}
      aria-hidden="true"
    >
      {initials || "SA"}
    </span>
  );
}

export async function AdvisorCard({ advisor }: { advisor: Advisor }) {
  const { t } = await getI18n();

  return (
    <article className="card-surface flex flex-col p-6">
      <div className="flex items-center gap-4">
        <AdvisorAvatar advisor={advisor} className="h-16 w-16 shrink-0 text-xl" />
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold">{advisor.name}</h3>
          <p className="text-sm text-primary">{advisor.title}</p>
          {advisor.location && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
              <MapPin className="h-3.5 w-3.5" /> {advisor.location}
            </p>
          )}
        </div>
      </div>

      {advisor.bio && <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted">{advisor.bio}</p>}

      <div className="mt-5 flex flex-wrap gap-2">
        <ButtonLink href={`/sa/${advisor.slug}`} variant="secondary" size="sm">
          {t("advisors.viewProfile")}
        </ButtonLink>
        <EnquiryButton
          phone={advisor.phone}
          advisorSlug={advisor.slug}
          advisorName={advisor.whatsappName || advisor.name}
          sourcePage={`/sa/${advisor.slug}`}
          label={t("common.whatsapp")}
          size="sm"
        />
      </div>
    </article>
  );
}
