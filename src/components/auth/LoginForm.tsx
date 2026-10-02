"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { emptyActionState } from "@/lib/actions";
import { login } from "@/app/(auth)/login/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  const { t } = useI18n();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> {t("login.submitting")}
        </>
      ) : (
        t("login.submit")
      )}
    </Button>
  );
}

export function LoginForm() {
  const { t } = useI18n();
  const [state, formAction] = useActionState(login, emptyActionState);

  return (
    <form action={formAction} className="card-surface p-6 sm:p-8">
      {state.error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-destructive">
          {state.error}
        </div>
      )}
      <div className="space-y-5">
        <div>
          <label htmlFor="username" className="field-label">
            {t("login.username")}
          </label>
          <input id="username" name="username" required autoComplete="username" className="field-input" />
        </div>
        <div>
          <label htmlFor="password" className="field-label">
            {t("login.password")}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="field-input"
          />
        </div>
      </div>
      <div className="mt-6">
        <SubmitButton />
      </div>
      <p className="mt-4 text-center text-xs text-muted">{t("login.adminHint")}</p>
    </form>
  );
}
