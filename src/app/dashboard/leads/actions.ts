"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/actions";
import { getSession } from "@/lib/auth/session";
import { getStore } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { formBoolean, leadSchema, leadStatusSchema } from "@/lib/validation";
import { withDerivedFields, resolveNetDate } from "@/lib/leads";
import { getI18n } from "@/i18n/server";
import type { Lead } from "@/lib/types";

function blankToUndefined(value: string | undefined): string | undefined {
  return value && value.trim() ? value : undefined;
}

/** Today as YYYY-MM-DD, used to anchor a lead's NET date when first marked NET. */
function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function leadFromForm(formData: FormData) {
  return leadSchema.safeParse({
    customerName: String(formData.get("customerName") || ""),
    contactRaw: String(formData.get("contactRaw") || ""),
    status: String(formData.get("status") || "NEW"),
    planType: String(formData.get("planType") || "outright"),
    category: String(formData.get("category") || "space"),
    isDuo: formBoolean(formData.get("isDuo")),
    promotion: String(formData.get("promotion") || "none"),
    proxyOwner: String(formData.get("proxyOwner") || ""),
    location: String(formData.get("location") || ""),
    productInterest: String(formData.get("productInterest") || ""),
    remarks: String(formData.get("remarks") || ""),
    lastFollowUpAt: String(formData.get("lastFollowUpAt") || ""),
    netDate: String(formData.get("netDate") || ""),
  });
}

function flatten(error: { issues: { path: (string | number)[]; message: string }[] }): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function createLead(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const [{ t }, session] = await Promise.all([getI18n(), getSession()]);
  if (!session || session.role !== "advisor" || !session.advisorId) {
    return { error: t("auth.notAuthenticated") };
  }
  const parsed = leadFromForm(formData);
  if (!parsed.success) {
    return { error: t("auth.fixFields"), fieldErrors: flatten(parsed.error) };
  }
  const input = parsed.data;
  const record = withDerivedFields<Omit<Lead, "id" | "createdAt">>({
    advisorId: session.advisorId,
    customerName: blankToUndefined(input.customerName),
    contactRaw: blankToUndefined(input.contactRaw),
    status: input.status,
    planType: input.planType,
    category: input.category,
    isDuo: input.isDuo,
    promotion: input.promotion,
    proxyOwner: blankToUndefined(input.proxyOwner),
    location: blankToUndefined(input.location),
    productInterest: blankToUndefined(input.productInterest),
    remarks: blankToUndefined(input.remarks),
    lastFollowUpAt: blankToUndefined(input.lastFollowUpAt),
    netDate: blankToUndefined(input.netDate) ?? (input.status === "NET" ? todayDate() : undefined),
    whatsappLink: undefined,
    contactNormalized: undefined,
    incentiveMonth: undefined,
  });

  const store = getStore();
  const created = await store.createLead(record);
  await logAudit(session, "lead.create", { type: "lead", id: created.id }, {
    status: created.status,
    category: created.category,
    planType: created.planType,
  });
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard/incentive");
  revalidatePath("/dashboard");
  return { ok: true, message: t("leads.saved") };
}

export async function updateLeadStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const [{ t }, session] = await Promise.all([getI18n(), getSession()]);
  if (!session || session.role !== "advisor" || !session.advisorId) {
    return { error: t("auth.notAuthenticated") };
  }
  const id = String(formData.get("leadId") || "");
  const parsedStatus = leadStatusSchema.safeParse(String(formData.get("status") || ""));
  if (!id || !parsedStatus.success) {
    return { error: t("auth.fixFields") };
  }

  const store = getStore();
  const existing = await store.getLeadById(id);
  if (!existing || existing.advisorId !== session.advisorId) {
    return { error: t("leads.notFound") };
  }

  // Anchor the NET date the first time a lead is marked NET, and preserve it on
  // later updates so a lead can never be counted in two months (no duplicate
  // NET counting). Clearing the status clears the derived month.
  const patch = withDerivedFields<Partial<Lead>>({
    status: parsedStatus.data,
    netDate: resolveNetDate(existing.netDate, parsedStatus.data, todayDate()),
  });
  await store.updateLead(id, patch);
  await logAudit(session, "lead.status", { type: "lead", id }, { status: parsedStatus.data });
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard/incentive");
  revalidatePath("/dashboard");
  return { ok: true, message: t("leads.saved") };
}

export async function deleteLead(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const [{ t }, session] = await Promise.all([getI18n(), getSession()]);
  if (!session || session.role !== "advisor" || !session.advisorId) {
    return { error: t("auth.notAuthenticated") };
  }
  const id = String(formData.get("leadId") || "");
  if (!id) return { error: t("auth.fixFields") };

  const store = getStore();
  const existing = await store.getLeadById(id);
  if (!existing || existing.advisorId !== session.advisorId) {
    return { error: t("leads.notFound") };
  }
  await store.deleteLead(id);
  await logAudit(session, "lead.delete", { type: "lead", id });
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard/incentive");
  revalidatePath("/dashboard");
  return { ok: true, message: t("leads.deleted") };
}
