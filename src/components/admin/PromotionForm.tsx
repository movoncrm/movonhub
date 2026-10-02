"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { emptyActionState } from "@/lib/actions";
import { savePromotion } from "@/app/admin/actions";
import type { Product, Promotion } from "@/lib/types";

function Save({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : label}
    </Button>
  );
}

export function PromotionForm({ products, promotion }: { products: Product[]; promotion?: Promotion }) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(savePromotion, emptyActionState);
  const err = state.fieldErrors || {};

  return (
    <form action={formAction} className="space-y-4">
      {promotion && <input type="hidden" name="id" value={promotion.id} />}
      {state.ok && state.message && (
        <p className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-success">
          <CheckCircle2 className="h-4 w-4" /> {state.message}
        </p>
      )}
      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-destructive">{state.error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label">{t("admin.field.title")} *</label>
          <input name="title" defaultValue={promotion?.title} required className="field-input" />
          {err.title && <p className="field-error">{err.title}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">{t("admin.field.description")} *</label>
          <textarea name="description" defaultValue={promotion?.description} rows={2} required className="field-input" />
          {err.description && <p className="field-error">{err.description}</p>}
        </div>
        <div>
          <label className="field-label">{t("admin.field.startDate")} *</label>
          <input name="startDate" type="date" defaultValue={promotion?.startDate} required className="field-input" />
          {err.startDate && <p className="field-error">{err.startDate}</p>}
        </div>
        <div>
          <label className="field-label">{t("admin.field.endDate")}</label>
          <input name="endDate" type="date" defaultValue={promotion?.endDate} className="field-input" />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">{t("admin.field.terms")}</label>
          <textarea name="terms" defaultValue={promotion?.terms} rows={2} className="field-input" />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">{t("admin.field.applicableProducts")}</label>
          <div className="grid max-h-44 gap-1 overflow-y-auto rounded-xl border border-borderline p-3 sm:grid-cols-2">
            {products.map((product) => (
              <label key={product.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="productIds" value={product.id} defaultChecked={promotion?.productIds.includes(product.id)} />
                {product.name}
              </label>
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">{t("admin.field.sourceUrl")}</label>
          <input name="sourceUrl" defaultValue={promotion?.sourceUrl} className="field-input" />
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="active" defaultChecked={promotion?.active} /> {t("admin.field.activeCheckbox")}
        </label>
      </div>

      <Save label={promotion ? t("admin.updatePromotion") : t("admin.createPromotion")} />
    </form>
  );
}
