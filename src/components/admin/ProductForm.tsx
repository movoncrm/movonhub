"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { emptyActionState } from "@/lib/actions";
import { saveProduct } from "@/app/admin/actions";
import type { Product, ProductCategory } from "@/lib/types";

function Save({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : label}
    </Button>
  );
}

function plansToText(product?: Product): string {
  if (!product) return "";
  return product.rentalPlans
    .map((p) => [p.label, p.monthlyPrice, p.tenureMonths ?? "", p.note ?? ""].join(" | "))
    .join("\n");
}

function specsToText(product?: Product): string {
  if (!product) return "";
  return Object.entries(product.specifications)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

export function ProductForm({ categories, product }: { categories: ProductCategory[]; product?: Product }) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(saveProduct, emptyActionState);
  const err = state.fieldErrors || {};

  return (
    <form action={formAction} className="space-y-4">
      {product && <input type="hidden" name="id" value={product.id} />}
      {state.ok && state.message && (
        <p className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-success">
          <CheckCircle2 className="h-4 w-4" /> {state.message}
        </p>
      )}
      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-destructive">{state.error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label">{t("admin.field.name")} *</label>
          <input name="name" defaultValue={product?.name} required className="field-input" />
          {err.name && <p className="field-error">{err.name}</p>}
        </div>
        <div>
          <label className="field-label">{t("admin.field.slug")}</label>
          <input name="slug" defaultValue={product?.slug} placeholder={t("admin.field.slugPlaceholder")} className="field-input" />
          {err.slug && <p className="field-error">{err.slug}</p>}
        </div>
        <div>
          <label className="field-label">{t("admin.field.category")} *</label>
          <select name="categoryId" defaultValue={product?.categoryId} required className="field-input">
            <option value="">{t("admin.field.selectPlaceholder")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {err.categoryId && <p className="field-error">{err.categoryId}</p>}
        </div>
        <div>
          <label className="field-label">{t("admin.field.series")}</label>
          <input name="series" defaultValue={product?.series} className="field-input" />
        </div>
        <div>
          <label className="field-label">{t("admin.field.model")}</label>
          <input name="model" defaultValue={product?.model} className="field-input" />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">{t("admin.field.imageUrl")}</label>
          <input name="imageUrl" defaultValue={product?.imageUrl} className="field-input" />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">{t("admin.field.shortDescription")} *</label>
          <input name="shortDescription" defaultValue={product?.shortDescription} required className="field-input" />
          {err.shortDescription && <p className="field-error">{err.shortDescription}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">{t("admin.field.fullDescription")}</label>
          <textarea name="fullDescription" defaultValue={product?.fullDescription} rows={3} className="field-input" />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">{t("admin.field.features")}</label>
          <textarea name="features" defaultValue={product?.features.join("\n")} rows={3} className="field-input" />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">{t("admin.field.rentalPlans")}</label>
          <textarea name="rentalPlans" defaultValue={plansToText(product)} rows={3} className="field-input" />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">{t("admin.field.specifications")}</label>
          <textarea name="specifications" defaultValue={specsToText(product)} rows={3} className="field-input" />
        </div>
        <div>
          <label className="field-label">{t("admin.field.outrightPrice")}</label>
          <input name="outrightPrice" type="number" step="0.01" min="0" defaultValue={product?.outrightPrice} className="field-input" />
        </div>
        <div>
          <label className="field-label">{t("admin.field.status")}</label>
          <select name="status" defaultValue={product?.status ?? "draft"} className="field-input">
            <option value="draft">{t("admin.field.draft")}</option>
            <option value="active">{t("admin.field.active")}</option>
            <option value="archived">{t("admin.field.archived")}</option>
          </select>
        </div>
        <div>
          <label className="field-label">{t("admin.field.warranty")}</label>
          <input name="warranty" defaultValue={product?.warranty} className="field-input" />
        </div>
        <div>
          <label className="field-label">{t("admin.field.installation")}</label>
          <input name="installation" defaultValue={product?.installation} className="field-input" />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">{t("admin.field.sourceUrl")}</label>
          <input name="sourceUrl" defaultValue={product?.sourceUrl} className="field-input" />
        </div>
      </div>

      <Save label={product ? t("admin.updateProduct") : t("admin.createProduct")} />
    </form>
  );
}
