"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2, Upload, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { emptyActionState } from "@/lib/actions";
import { registerAdvisor } from "@/app/(auth)/register/actions";
import { slugify } from "@/lib/utils";

type Availability = "idle" | "checking" | "available" | "taken" | "invalid";

function SubmitButton() {
  const { pending } = useFormStatus();
  const { t } = useI18n();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> {t("register.submitting")}
        </>
      ) : (
        t("register.submit")
      )}
    </Button>
  );
}

export function RegisterForm() {
  const { t } = useI18n();
  const [state, formAction] = useActionState(registerAdvisor, emptyActionState);
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [availability, setAvailability] = useState<Availability>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const timers = useRef<{ slug?: ReturnType<typeof setTimeout> }>({});

  useEffect(() => {
    const currentTimers = timers.current;
    if (!slug) {
      setAvailability("idle");
      return;
    }
    setAvailability("checking");
    clearTimeout(currentTimers.slug);
    currentTimers.slug = setTimeout(async () => {
      try {
        const res = await fetch(`/api/advisors/check?username=${encodeURIComponent(slug)}`);
        const json = await res.json();
        setAvailability(json.data.available ? "available" : json.data.valid ? "taken" : "invalid");
      } catch {
        setAvailability("idle");
      }
    }, 400);
    return () => clearTimeout(currentTimers.slug);
  }, [slug]);

  const err = state.fieldErrors || {};

  return (
    <form action={formAction} className="card-surface p-6 sm:p-8">
      {state.error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-destructive">
          {state.error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="field-label">
            {t("register.name")} *
          </label>
          <input
            id="name"
            name="name"
            required
            autoComplete="name"
            placeholder={t("register.namePlaceholder")}
            className="field-input"
            onChange={(e) => {
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
          />
          {err.name && <p className="field-error">{err.name}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="field-label">
            {t("register.phone")} *
          </label>
          <input id="phone" name="phone" required inputMode="tel" placeholder="60123456789" className="field-input" />
          <p className="mt-1 text-xs text-muted">{t("register.phoneHint")}</p>
          {err.phone && <p className="field-error">{err.phone}</p>}
        </div>

        <div>
          <label htmlFor="whatsappName" className="field-label">
            {t("register.whatsappName")}
          </label>
          <input id="whatsappName" name="whatsappName" placeholder="Nik" className="field-input" />
          {err.whatsappName && <p className="field-error">{err.whatsappName}</p>}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="slug" className="field-label">
            {t("register.username")} *
          </label>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted sm:inline">{t("register.usernamePrefix")}</span>
            <input
              id="slug"
              name="slug"
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              placeholder={t("register.usernamePlaceholder")}
              className="field-input"
            />
          </div>
          <div className="mt-1 min-h-[1.1rem] text-xs">
            {availability === "checking" && <span className="text-muted">{t("register.checking")}</span>}
            {availability === "available" && (
              <span className="inline-flex items-center gap-1 text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> {t("register.available")}
              </span>
            )}
            {(availability === "taken" || availability === "invalid") && (
              <span className="inline-flex items-center gap-1 text-destructive">
                <XCircle className="h-3.5 w-3.5" /> {t("register.taken")}
              </span>
            )}
          </div>
          {err.slug && <p className="field-error">{err.slug}</p>}
        </div>

        <div>
          <label htmlFor="password" className="field-label">
            {t("register.password")} *
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder={t("register.passwordPlaceholder")}
            className="field-input"
          />
          <p className="mt-1 text-xs text-muted">{t("register.passwordHint")}</p>
          {err.password && <p className="field-error">{err.password}</p>}
        </div>

        <div>
          <label htmlFor="location" className="field-label">
            {t("register.location")}
          </label>
          <input id="location" name="location" placeholder={t("register.locationPlaceholder")} className="field-input" />
          {err.location && <p className="field-error">{err.location}</p>}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="title" className="field-label">
            {t("register.advisorTitle")}
          </label>
          <input id="title" name="title" placeholder={t("register.advisorTitlePlaceholder")} className="field-input" />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="bio" className="field-label">
            {t("register.bio")}
          </label>
          <textarea id="bio" name="bio" rows={3} placeholder={t("register.bioPlaceholder")} className="field-input" />
          {err.bio && <p className="field-error">{err.bio}</p>}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="photo" className="field-label">
            {t("register.photo")}
          </label>
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
              id="photo"
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-dark"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setPreview(file ? URL.createObjectURL(file) : null);
              }}
            />
          </div>
          <p className="mt-1 text-xs text-muted">{t("register.photoHint")}</p>
          {err.photo && <p className="field-error">{err.photo}</p>}
        </div>
      </div>

      <div className="mt-7">
        <SubmitButton />
        <p className="mt-3 text-center text-xs text-muted">{t("register.note")}</p>
      </div>
    </form>
  );
}
