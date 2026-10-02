"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2, Undo2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { emptyActionState } from "@/lib/actions";
import { saveSiteContent } from "@/app/admin/actions";
import type { ContentKeyDef } from "@/lib/content/registry";
import type { ContentScope } from "@/lib/types";

type LocaleKey = "en" | "ms";
type Values = Record<LocaleKey, Record<string, string>>;

function SubmitButton({ intent, label, icon }: { intent: string; label: string; icon?: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" name="intent" value={intent} disabled={pending} variant={intent === "publish" ? "primary" : "secondary"}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {label}
    </Button>
  );
}

export function ContentEditor({
  scope,
  advisorId,
  defs,
  initial,
  defaults,
}: {
  scope: ContentScope;
  advisorId?: string;
  defs: ContentKeyDef[];
  initial: Values;
  defaults: Values;
}) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(saveSiteContent, emptyActionState);
  const [locale, setLocale] = useState<LocaleKey>("en");
  const [values, setValues] = useState<Values>(initial);
  const [savedValues, setSavedValues] = useState<Values>(initial);

  const dirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(savedValues), [values, savedValues]);

  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (state.ok) setSavedValues(values);
    // Only resync when a save completes; values is intentionally read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok]);

  function setValue(loc: LocaleKey, key: string, value: string) {
    setValues((prev) => ({ ...prev, [loc]: { ...prev[loc], [key]: value } }));
  }

  function revertAll() {
    setValues({ en: {}, ms: {} });
  }

  const groups = useMemo(() => {
    const map = new Map<string, ContentKeyDef[]>();
    for (const def of defs) {
      const list = map.get(def.group) ?? [];
      list.push(def);
      map.set(def.group, list);
    }
    return Array.from(map.entries());
  }, [defs]);

  const resolved = (key: string) => values[locale][key] ?? defaults[locale][key] ?? "";

  return (
    <form action={formAction} className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <input type="hidden" name="scope" value={scope} />
      {advisorId && <input type="hidden" name="advisorId" value={advisorId} />}

      <div>
        {state.error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-destructive">{state.error}</p>
        )}
        {state.ok && state.message && (
          <p className="mb-4 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-success">
            <CheckCircle2 className="h-4 w-4" /> {state.message}
          </p>
        )}
        {dirty && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">{t("admin.content.unsaved")}</p>
        )}

        <div className="mb-5 inline-flex rounded-full border border-borderline bg-surface p-0.5 text-sm font-bold">
          {(["en", "ms"] as LocaleKey[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setLocale(value)}
              aria-pressed={locale === value}
              className={`rounded-full px-4 py-1.5 transition ${
                locale === value ? "bg-primary text-white" : "text-muted hover:text-ink"
              }`}
            >
              {value === "en" ? "English" : "Bahasa Melayu"}
            </button>
          ))}
        </div>

        <p className="mb-5 text-xs text-muted">{t("admin.content.emptyHint")}</p>

        <div className="space-y-6">
          {groups.map(([group, items]) => (
            <fieldset key={group} className="card-surface p-5">
              <legend className="px-1 text-sm font-bold">{group}</legend>
              <div className="mt-3 space-y-4">
                {items.map((def) => (
                  <div key={def.key}>
                    <label className="field-label flex items-center gap-2">
                      {def.label}
                      {def.seo && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">SEO</span>}
                    </label>
                    {(["en", "ms"] as LocaleKey[]).map((loc) => (
                      <div key={loc} className={loc === locale ? "" : "hidden"}>
                        {def.multiline ? (
                          <textarea
                            name={`content.${loc}.${def.key}`}
                            value={values[loc][def.key] ?? ""}
                            onChange={(event) => setValue(loc, def.key, event.target.value)}
                            maxLength={def.maxLength}
                            rows={3}
                            className="field-input"
                            placeholder={defaults[loc][def.key]}
                            aria-label={`${def.label} (${loc})`}
                          />
                        ) : (
                          <input
                            name={`content.${loc}.${def.key}`}
                            value={values[loc][def.key] ?? ""}
                            onChange={(event) => setValue(loc, def.key, event.target.value)}
                            maxLength={def.maxLength}
                            className="field-input"
                            placeholder={defaults[loc][def.key]}
                            aria-label={`${def.label} (${loc})`}
                          />
                        )}
                      </div>
                    ))}
                    <div className="mt-1 flex items-center justify-between text-xs text-muted">
                      <span>{def.help}</span>
                      <span>
                        {(resolved(def.key) ?? "").length}/{def.maxLength}
                      </span>
                    </div>
                    {locale === "en" && values.en[def.key] && !values.ms[def.key] && (
                      <p className="mt-1 text-xs text-amber-700">
                        Bahasa Melayu is empty for this field. If left empty it falls back to the default Bahasa Melayu wording.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </div>

      {/* Live preview */}
      <aside className="lg:sticky lg:top-6 lg:h-fit">
        <div className="card-surface p-5">
          <h3 className="text-sm font-bold">{t("admin.content.preview")}</h3>
          <p className="mt-1 text-xs text-muted">{locale === "en" ? "English" : "Bahasa Melayu"}</p>
          <div className="mt-4 space-y-4 border-t border-borderline pt-4">
            {defs.map((def) => (
              <div key={def.key}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{def.label}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
                  {resolved(def.key) || <span className="text-muted">{t("admin.content.noOverride")}</span>}
                </p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <div className="lg:col-span-2 flex flex-wrap items-center gap-3 border-t border-borderline pt-5">
        <SubmitButton intent="save-draft" label={t("admin.content.saveDraft")} />
        <SubmitButton intent="publish" label={t("admin.content.publish")} icon={<Upload className="h-4 w-4" />} />
        <button
          type="submit"
          name="intent"
          value="revert"
          onClick={revertAll}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-destructive hover:bg-red-50"
        >
          <Undo2 className="h-4 w-4" /> {t("admin.content.revert")}
        </button>
      </div>
    </form>
  );
}
