"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { emptyActionState } from "@/lib/actions";
import { createLead, deleteLead, updateLeadStatus } from "@/app/dashboard/leads/actions";
import {
  LEAD_CATEGORIES,
  LEAD_PLAN_TYPES,
  LEAD_PROMOTIONS,
  LEAD_STATUSES,
  isOpen,
} from "@/lib/leads";
import type { Lead, LeadCategory, LeadPlanType, LeadPromotion, LeadStatus } from "@/lib/types";

type TFn = (key: string, vars?: Record<string, string | number>) => string;

function statusLabel(t: TFn, status: LeadStatus): string {
  const map: Record<LeadStatus, string> = {
    NEW: "leads.statusNew",
    CONTACTED: "leads.statusContacted",
    NO_REPLY: "leads.statusNoReply",
    INTERESTED: "leads.statusInterested",
    FORM: "leads.statusForm",
    QUALIFIED: "leads.statusQualified",
    NET: "leads.statusNet",
    REJECTED: "leads.statusRejected",
    CANCELLED: "leads.statusCancelled",
  };
  return t(map[status]);
}

function categoryLabel(t: TFn, category: LeadCategory): string {
  const map: Record<LeadCategory, string> = {
    space: "leads.catSpace",
    baby: "leads.catBaby",
    choice: "leads.catChoice",
    cuckoo: "leads.catCuckoo",
    vacuum: "leads.catVacuum",
    other: "leads.catOther",
  };
  return t(map[category]);
}

function planLabel(t: TFn, plan: LeadPlanType): string {
  return plan === "rental" ? t("leads.planRental") : t("leads.planOutright");
}

function promotionLabel(t: TFn, promo: LeadPromotion): string {
  const map: Record<LeadPromotion, string> = {
    none: "leads.promoNone",
    rm12: "leads.promoRm12",
    samsung: "leads.promoSamsung",
    joy_pack: "leads.promoJoyPack",
  };
  return t(map[promo]);
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : label}
    </Button>
  );
}

export function LeadsManager({ leads }: { leads: Lead[] }) {
  const { t } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "net">("all");

  const visible = leads.filter((lead) => {
    if (filter === "open") return isOpen(lead);
    if (filter === "net") return lead.status === "NET";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["all", "open", "net"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                filter === key ? "bg-primary text-white" : "bg-surface text-muted hover:text-primary"
              }`}
            >
              {key === "all" ? t("leads.filterAll") : key === "open" ? t("leads.filterOpen") : t("leads.filterNet")}
            </button>
          ))}
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" /> {showForm ? t("leads.hideForm") : t("leads.add")}
        </Button>
      </div>

      {showForm && <AddLeadForm onDone={() => setShowForm(false)} />}

      {visible.length === 0 ? (
        <p className="card-surface p-6 text-sm text-muted">{t("leads.empty")}</p>
      ) : (
        <div className="space-y-3">
          {visible.map((lead) => (
            <LeadRow key={lead.id} lead={lead} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function AddLeadForm({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(createLead, emptyActionState);
  const err = state.fieldErrors || {};

  return (
    <form action={formAction} className="card-surface p-6">
      {state.ok && state.message && (
        <p className="mb-4 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-success">
          <CheckCircle2 className="h-4 w-4" /> {state.message}
        </p>
      )}
      {state.error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-destructive">{state.error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="field-label" htmlFor="customerName">{t("leads.customer")}</label>
          <input id="customerName" name="customerName" className="field-input" maxLength={80} />
        </div>
        <div>
          <label className="field-label" htmlFor="contactRaw">{t("leads.contact")}</label>
          <input id="contactRaw" name="contactRaw" className="field-input" maxLength={30} placeholder="0123456789" />
          {err.contactRaw && <p className="field-error">{err.contactRaw}</p>}
        </div>
        <div>
          <label className="field-label" htmlFor="productInterest">{t("leads.product")}</label>
          <input id="productInterest" name="productInterest" className="field-input" maxLength={160} />
        </div>
        <div>
          <label className="field-label" htmlFor="status">{t("leads.status")}</label>
          <select id="status" name="status" defaultValue="NEW" className="field-input">
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>{statusLabel(t, s)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="planType">{t("leads.plan")}</label>
          <select id="planType" name="planType" defaultValue="outright" className="field-input">
            {LEAD_PLAN_TYPES.map((p) => (
              <option key={p} value={p}>{planLabel(t, p)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="category">{t("leads.category")}</label>
          <select id="category" name="category" defaultValue="space" className="field-input">
            {LEAD_CATEGORIES.map((c) => (
              <option key={c} value={c}>{categoryLabel(t, c)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="promotion">{t("leads.promotion")}</label>
          <select id="promotion" name="promotion" defaultValue="none" className="field-input">
            {LEAD_PROMOTIONS.map((p) => (
              <option key={p} value={p}>{promotionLabel(t, p)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="proxyOwner">{t("leads.proxy")}</label>
          <input id="proxyOwner" name="proxyOwner" className="field-input" maxLength={80} />
        </div>
        <div>
          <label className="field-label" htmlFor="location">{t("leads.location")}</label>
          <input id="location" name="location" className="field-input" maxLength={80} />
        </div>
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="isDuo" /> {t("leads.isDuo")}
          </label>
        </div>
        <div>
          <label className="field-label" htmlFor="lastFollowUpAt">{t("leads.lastFollowUp")}</label>
          <input id="lastFollowUpAt" name="lastFollowUpAt" type="date" className="field-input" />
        </div>
        <div>
          <label className="field-label" htmlFor="netDate">{t("leads.netDate")}</label>
          <input id="netDate" name="netDate" type="date" className="field-input" />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="field-label" htmlFor="remarks">{t("leads.remarks")}</label>
          <textarea id="remarks" name="remarks" rows={2} maxLength={1000} className="field-input" />
        </div>
      </div>

      <p className="mt-3 text-xs text-muted">{t("leads.netHint")}</p>

      <div className="mt-5 flex items-center gap-2">
        <SubmitButton label={t("leads.add")} />
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}

function LeadRow({ lead, t }: { lead: Lead; t: TFn }) {
  const [statusState, statusAction] = useActionState(updateLeadStatus, emptyActionState);
  const [deleteState, deleteAction] = useActionState(deleteLead, emptyActionState);

  return (
    <div className="card-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{lead.customerName || t("leads.customer")}</p>
            <Badge tone={lead.status === "NET" ? "green" : "blue"}>{statusLabel(t, lead.status)}</Badge>
            {lead.isDuo && <Badge tone="amber">{t("leads.isDuo")}</Badge>}
          </div>
          <p className="mt-1 text-xs text-muted">
            {categoryLabel(t, lead.category)} · {planLabel(t, lead.planType)}
            {lead.productInterest ? ` · ${lead.productInterest}` : ""}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {lead.contactNormalized ? `+${lead.contactNormalized}` : lead.contactRaw || "—"}
            {lead.incentiveMonth ? ` · ${lead.incentiveMonth}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <form action={statusAction} className="flex items-center gap-2">
            <input type="hidden" name="leadId" value={lead.id} />
            <select name="status" defaultValue={lead.status} className="field-input py-1.5 text-sm">
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>{statusLabel(t, s)}</option>
              ))}
            </select>
            <Button type="submit" variant="secondary" size="sm">{t("leads.saveStatus")}</Button>
          </form>
          <form action={deleteAction}>
            <input type="hidden" name="leadId" value={lead.id} />
            <Button type="submit" variant="ghost" size="sm" aria-label={t("leads.delete")}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {statusState.error && <p className="mt-2 text-xs text-destructive">{statusState.error}</p>}
      {statusState.ok && statusState.message && (
        <p className="mt-2 text-xs text-success">{statusState.message}</p>
      )}
      {deleteState.error && <p className="mt-2 text-xs text-destructive">{deleteState.error}</p>}
      {deleteState.ok && deleteState.message && <p className="mt-2 text-xs text-success">{deleteState.message}</p>}
    </div>
  );
}
