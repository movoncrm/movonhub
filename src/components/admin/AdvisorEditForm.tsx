"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { emptyActionState } from "@/lib/actions";
import { updateAdvisorAdmin } from "@/app/admin/actions";
import type { Advisor } from "@/lib/types";

function Save() {
  const { pending } = useFormStatus();
  const { t } = useI18n();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
    </Button>
  );
}

export function AdvisorEditForm({ advisor }: { advisor: Advisor }) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(updateAdvisorAdmin, emptyActionState);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={advisor.id} />
      {state.ok && state.message && (
        <p className="sm:col-span-2 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-success">
          <CheckCircle2 className="h-4 w-4" /> {state.message}
        </p>
      )}
      {state.error && <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      <div>
        <label className="field-label">{t("admin.sa.fieldName")}</label>
        <input name="name" defaultValue={advisor.name} className="field-input" />
      </div>
      <div>
        <label className="field-label">{t("dashboard.advisorTitle")}</label>
        <input name="title" defaultValue={advisor.title} className="field-input" />
      </div>
      <div>
        <label className="field-label">{t("admin.sa.fieldPhone")}</label>
        <input name="phone" defaultValue={advisor.phone} className="field-input" />
      </div>
      <div>
        <label className="field-label">{t("admin.sa.fieldEmail")}</label>
        <input name="email" type="email" defaultValue={advisor.email} className="field-input" />
      </div>
      <div className="sm:col-span-2 mt-2 border-t border-borderline pt-3">
        <p className="text-sm font-bold">{t("admin.personalPageSettings")}</p>
        <p className="mb-3 mt-1 text-xs text-muted">{t("admin.personalPageSettingsBody")}</p>
      </div>
      <div>
        <label className="field-label">{t("admin.fieldDefaultLanguage")}</label>
        <select name="defaultLocale" defaultValue={advisor.defaultLocale || "en"} className="field-input">
          <option value="en">English</option>
          <option value="ms">Bahasa Melayu</option>
        </select>
      </div>
      <div>
        <label className="field-label">{t("admin.sa.fieldTheme")}</label>
        <select name="preferredTheme" defaultValue={advisor.preferredTheme || "light"} className="field-input">
          <option value="light">{t("admin.sa.themeLight")}</option>
          <option value="dark">{t("admin.sa.themeDark")}</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="allowLanguageToggle"
          defaultChecked={advisor.allowLanguageToggle !== false}
          className="h-4 w-4"
        />
        {t("admin.fieldAllowLanguageToggle")}
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="allowThemeToggle"
          defaultChecked={advisor.allowThemeToggle !== false}
          className="h-4 w-4"
        />
        {t("admin.fieldAllowThemeToggle")}
      </label>
      <div>
        <label className="field-label">{t("admin.sa.fieldStatus")}</label>
        <select name="status" defaultValue={advisor.status} className="field-input">
          <option value="draft">{t("admin.sa.statusDraft")}</option>
          <option value="published">{t("admin.sa.statusPublished")}</option>
          <option value="suspended">{t("admin.sa.statusSuspended")}</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="field-label">{t("admin.sa.fieldBio")}</label>
        <textarea name="bio" defaultValue={advisor.bio} rows={3} className="field-input" />
      </div>
      <div className="sm:col-span-2">
        <Save />
      </div>
    </form>
  );
}
