"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Check, Copy, ExternalLink, KeyRound, Loader2, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { emptyActionState } from "@/lib/actions";
import { AdvisorEditForm } from "@/components/admin/AdvisorEditForm";
import { deleteAdvisor, resetAdvisorAccess, setAdvisorStatus } from "@/app/admin/actions";
import type { Advisor } from "@/lib/types";

function StatusSaveButton() {
  const { pending } = useFormStatus();
  const { t } = useI18n();
  return (
    <Button type="submit" variant="secondary" size="sm" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("admin.sa.saveStatus")}
    </Button>
  );
}

function ResetAccess({ advisor }: { advisor: Advisor }) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(resetAdvisorAccess, emptyActionState);
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!state.meta?.password) return;
    try {
      await navigator.clipboard.writeText(state.meta.password);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={advisor.id} />
      <Button type="submit" variant="secondary" size="sm">
        <KeyRound className="h-4 w-4" /> {t("admin.sa.resetAccess")}
      </Button>
      {state.meta?.password && (
        <span className="flex items-center gap-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs">
          <code className="text-ink">{state.meta.password}</code>
          <button type="button" onClick={copy} className="inline-flex items-center gap-1 font-semibold text-amber-700">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? t("admin.sa.copied") : t("common.copy")}
          </button>
        </span>
      )}
    </form>
  );
}

export function AdvisorList({ advisors, rootDomain }: { advisors: Advisor[]; rootDomain: string }) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? advisors.filter(
          (a) =>
            a.name.toLowerCase().includes(q) || a.slug.toLowerCase().includes(q) || a.phone.includes(q),
        )
      : advisors;
    return list;
  }, [advisors, query]);

  async function copyUrl(id: string, slug: string) {
    try {
      await navigator.clipboard.writeText(`https://${slug}.${rootDomain}`);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  const micrositeTone = (status: Advisor["status"]) =>
    status === "published" ? "green" : status === "draft" ? "amber" : "grey";

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("admin.sa.searchPlaceholder")}
            className="field-input pl-9"
          />
        </div>
        <span className="hidden text-sm text-muted sm:inline">{t("admin.sa.resultsCount", { count: rows.length })}</span>
      </div>

      {rows.length === 0 && <p className="text-sm text-muted">{t("admin.sa.empty")}</p>}

      <div className="space-y-3">
        {rows.map((advisor) => (
          <div key={advisor.id} className="card-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold">{advisor.name}</p>
                  <Badge tone={advisor.active ? "green" : "amber"}>
                    {advisor.active ? t("dashboard.active") : t("dashboard.inactive")}
                  </Badge>
                  <Badge tone={micrositeTone(advisor.status)}>
                    {t(`admin.sa.status${advisor.status.charAt(0).toUpperCase()}${advisor.status.slice(1)}`)}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted">
                  /sa/{advisor.slug} · {advisor.phone}
                </p>
                <button
                  type="button"
                  onClick={() => copyUrl(advisor.id, advisor.slug)}
                  className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary"
                >
                  {copiedId === advisor.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  https://{advisor.slug}.{rootDomain}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/sa/${advisor.slug}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-borderline bg-surface px-3 py-2 text-sm font-semibold text-ink hover:border-primary hover:text-primary"
                >
                  <ExternalLink className="h-4 w-4" /> {t("admin.sa.preview")}
                </Link>
                <form action={setAdvisorStatus} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={advisor.id} />
                  <select name="status" defaultValue={advisor.status} className="field-input py-2 text-sm">
                    <option value="draft">{t("admin.sa.statusDraft")}</option>
                    <option value="published">{t("admin.sa.statusPublished")}</option>
                    <option value="suspended">{t("admin.sa.statusSuspended")}</option>
                  </select>
                  <StatusSaveButton />
                </form>
                <form action={deleteAdvisor}>
                  <input type="hidden" name="id" value={advisor.id} />
                  <Button type="submit" variant="ghost" size="sm" className="text-destructive hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <ResetAccess advisor={advisor} />
            </div>

            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-semibold text-primary">{t("admin.editProfile")}</summary>
              <div className="mt-3 border-t border-borderline pt-3">
                <AdvisorEditForm advisor={advisor} />
              </div>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
