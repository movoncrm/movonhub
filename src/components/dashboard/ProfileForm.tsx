"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { emptyActionState } from "@/lib/actions";
import { changeAdvisorPassword, updateAdvisorProfile } from "@/app/dashboard/actions";
import type { Advisor } from "@/lib/types";

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> {label}
        </>
      ) : (
        label
      )}
    </Button>
  );
}

export function ProfileForm({ advisor }: { advisor: Advisor }) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(updateAdvisorProfile, emptyActionState);
  const [pwState, pwAction] = useActionState(changeAdvisorPassword, emptyActionState);
  const [preview, setPreview] = useState<string | null>(advisor.photoUrl || null);
  const err = state.fieldErrors || {};

  return (
    <div className="space-y-6">
      <form action={formAction} className="card-surface p-6">
        <h2 className="text-lg">{t("dashboard.profileDetails")}</h2>
        {state.ok && state.message && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-success">
            <CheckCircle2 className="h-4 w-4" /> {state.message}
          </p>
        )}
        {state.error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-destructive">{state.error}</p>
        )}

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="field-label">{t("dashboard.profilePhoto")}</label>
            <div className="flex items-center gap-4">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-background text-muted">
                  <Upload className="h-5 w-5" />
                </span>
              )}
              <input
                name="photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-dark"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setPreview(file ? URL.createObjectURL(file) : advisor.photoUrl || null);
                }}
              />
            </div>
            {err.photo && <p className="field-error">{err.photo}</p>}
          </div>

          <div>
            <label htmlFor="name" className="field-label">
              {t("dashboard.name")}
            </label>
            <input id="name" name="name" defaultValue={advisor.name} required className="field-input" />
            {err.name && <p className="field-error">{err.name}</p>}
          </div>
          <div>
            <label htmlFor="title" className="field-label">
              {t("dashboard.advisorTitle")}
            </label>
            <input id="title" name="title" defaultValue={advisor.title} className="field-input" />
            {err.title && <p className="field-error">{err.title}</p>}
          </div>
          <div>
            <label htmlFor="phone" className="field-label">
              {t("dashboard.phone")}
            </label>
            <input id="phone" name="phone" defaultValue={advisor.phone} className="field-input" />
            {err.phone && <p className="field-error">{err.phone}</p>}
          </div>
          <div>
            <label htmlFor="phoneDisplay" className="field-label">
              {t("dashboard.phoneDisplay")}
            </label>
            <input id="phoneDisplay" name="phoneDisplay" defaultValue={advisor.phoneDisplay} className="field-input" />
          </div>
          <div>
            <label htmlFor="whatsappName" className="field-label">
              {t("dashboard.whatsappName")}
            </label>
            <input id="whatsappName" name="whatsappName" defaultValue={advisor.whatsappName} className="field-input" />
          </div>
          <div>
            <label htmlFor="location" className="field-label">
              {t("dashboard.location")}
            </label>
            <input id="location" name="location" defaultValue={advisor.location} className="field-input" />
          </div>
          <div>
            <label htmlFor="email" className="field-label">
              {t("dashboard.email")}
            </label>
            <input id="email" name="email" type="email" defaultValue={advisor.email} className="field-input" />
            {err.email && <p className="field-error">{err.email}</p>}
          </div>
          <div>
            <label htmlFor="accent" className="field-label">
              {t("dashboard.accent")}
            </label>
            <input
              id="accent"
              name="accent"
              type="color"
              defaultValue={advisor.accent || "#1E7BFF"}
              className="h-11 w-full rounded-xl border border-borderline p-1"
            />
            {err.accent && <p className="field-error">{err.accent}</p>}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="bio" className="field-label">
              {t("dashboard.bio")}
            </label>
            <textarea id="bio" name="bio" rows={4} defaultValue={advisor.bio} className="field-input" />
            {err.bio && <p className="field-error">{err.bio}</p>}
          </div>

          <div className="sm:col-span-2">
            <p className="field-label">{t("dashboard.socialLinks")}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <input name="socials.facebook" defaultValue={advisor.socials?.facebook} placeholder={t("dashboard.facebook")} className="field-input" />
              <input name="socials.instagram" defaultValue={advisor.socials?.instagram} placeholder={t("dashboard.instagram")} className="field-input" />
              <input name="socials.tiktok" defaultValue={advisor.socials?.tiktok} placeholder={t("dashboard.tiktok")} className="field-input" />
              <input name="socials.website" defaultValue={advisor.socials?.website} placeholder={t("dashboard.website")} className="field-input" />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <SaveButton label={t("common.saveChanges")} />
        </div>
      </form>

      <form action={pwAction} className="card-surface p-6">
        <h2 className="text-lg">{t("dashboard.changePassword")}</h2>
        {pwState.ok && pwState.message && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-success">
            <CheckCircle2 className="h-4 w-4" /> {pwState.message}
          </p>
        )}
        {pwState.error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-destructive">{pwState.error}</p>
        )}
        <div className="mt-5 max-w-sm">
          <label htmlFor="new-password" className="field-label">
            {t("dashboard.newPassword")}
          </label>
          <input
            id="new-password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="field-input"
          />
        </div>
        <div className="mt-5">
          <SaveButton label={t("dashboard.updatePassword")} />
        </div>
      </form>
    </div>
  );
}
