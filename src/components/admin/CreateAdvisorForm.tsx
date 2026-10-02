"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Check, Copy, KeyRound, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { emptyActionState } from "@/lib/actions";
import { createAdvisorAdmin } from "@/app/admin/actions";

function Submit() {
  const { pending } = useFormStatus();
  const { t } = useI18n();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> {t("admin.sa.creating")}
        </>
      ) : (
        t("admin.sa.submitCreate")
      )}
    </Button>
  );
}

export function CreateAdvisorForm() {
  const { t } = useI18n();
  const [state, formAction] = useActionState(createAdvisorAdmin, emptyActionState);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const err = state.fieldErrors || {};

  function generate() {
    const value = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
    setPassword(value);
  }

  async function copy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  if (state.ok && state.meta?.publicUrl) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="flex items-center gap-2 font-bold text-emerald-800">
          <Sparkles className="h-4 w-4" /> {t("admin.sa.createdTitle")}
        </p>
        <div className="mt-4 space-y-3 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{t("admin.sa.colUrl")}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <code className="rounded-lg bg-white px-3 py-1.5 text-xs text-ink">{state.meta.publicUrl}</code>
              <button
                type="button"
                onClick={() => copy(state.meta!.publicUrl!, "url")}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800"
              >
                {copied === "url" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied === "url" ? t("admin.sa.copied") : t("admin.sa.copyUrl")}
              </button>
              <Link
                href={`/sa/${state.meta.slug}`}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
              >
                {t("admin.sa.preview")} ↗
              </Link>
            </div>
          </div>
          {state.meta.password && (
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                <KeyRound className="h-3.5 w-3.5" /> {t("admin.sa.newPassword")}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <code className="rounded-lg bg-white px-3 py-1.5 text-xs text-ink">{state.meta.password}</code>
                <button
                  type="button"
                  onClick={() => copy(state.meta!.password!, "pw")}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800"
                >
                  {copied === "pw" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === "pw" ? t("admin.sa.copied") : t("common.copy")}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-emerald-700">{t("admin.sa.createdNote")}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-destructive">{state.error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">{t("admin.sa.fieldName")} *</label>
          <input name="name" required className="field-input" />
          {err.name && <p className="field-error">{err.name}</p>}
        </div>
        <div>
          <label className="field-label">{t("admin.sa.fieldSlug")} *</label>
          <input name="slug" required placeholder="ali" className="field-input" />
          {err.slug && <p className="field-error">{err.slug}</p>}
        </div>
        <div>
          <label className="field-label">{t("admin.sa.fieldPhone")} *</label>
          <input name="phone" required placeholder="60123456789" className="field-input" />
          {err.phone && <p className="field-error">{err.phone}</p>}
        </div>
        <div>
          <label className="field-label">{t("admin.sa.fieldEmail")}</label>
          <input name="email" type="email" className="field-input" />
          {err.email && <p className="field-error">{err.email}</p>}
        </div>
        <div>
          <label className="field-label">{t("admin.sa.fieldPassword")}</label>
          <div className="flex gap-2">
            <input
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field-input"
              placeholder="••••••"
            />
            <Button type="button" variant="secondary" size="md" onClick={generate}>
              {t("admin.sa.generate")}
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted">{t("admin.sa.createdNote")}</p>
          {err.password && <p className="field-error">{err.password}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">{t("admin.sa.fieldTheme")}</label>
            <select name="preferredTheme" defaultValue="light" className="field-input">
              <option value="light">{t("admin.sa.themeLight")}</option>
              <option value="dark">{t("admin.sa.themeDark")}</option>
            </select>
          </div>
          <div>
            <label className="field-label">{t("admin.sa.fieldStatus")}</label>
            <select name="status" defaultValue="published" className="field-input">
              <option value="draft">{t("admin.sa.statusDraft")}</option>
              <option value="published">{t("admin.sa.statusPublished")}</option>
              <option value="suspended">{t("admin.sa.statusSuspended")}</option>
            </select>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">{t("admin.sa.fieldBio")}</label>
          <textarea name="bio" rows={2} className="field-input" />
        </div>
      </div>
      <Submit />
    </form>
  );
}
