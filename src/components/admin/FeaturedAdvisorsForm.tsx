"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { emptyActionState } from "@/lib/actions";
import { saveFeaturedAdvisors } from "@/app/admin/actions";
import type { Advisor } from "@/lib/types";

function Save() {
  const { pending } = useFormStatus();
  const { t } = useI18n();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("admin.saveFeatured")}
    </Button>
  );
}

export function FeaturedAdvisorsForm({
  advisors,
  featuredSlugs,
}: {
  advisors: Advisor[];
  featuredSlugs: string[];
}) {
  const [state, formAction] = useActionState(saveFeaturedAdvisors, emptyActionState);

  return (
    <form action={formAction}>
      {state.ok && state.message && (
        <p className="mb-3 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-success">
          <CheckCircle2 className="h-4 w-4" /> {state.message}
        </p>
      )}
      <div className="grid gap-1 sm:grid-cols-2">
        {advisors.map((advisor) => (
          <label key={advisor.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="slug" value={advisor.slug} defaultChecked={featuredSlugs.includes(advisor.slug)} />
            {advisor.name} <span className="text-muted">/{advisor.slug}</span>
          </label>
        ))}
      </div>
      <div className="mt-3">
        <Save />
      </div>
    </form>
  );
}
