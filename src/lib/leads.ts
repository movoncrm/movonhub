import type { Lead, LeadCategory, LeadPlanType, LeadPromotion, LeadStatus } from "@/lib/types";
import { normaliseMyPhone } from "@/lib/utils";

/**
 * Pure, server-safe lead logic. Contains no I/O and no confidential rates —
 * incentive amounts live in `src/lib/incentive.ts`.
 */

export const LEAD_STATUSES: readonly LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "NO_REPLY",
  "INTERESTED",
  "FORM",
  "QUALIFIED",
  "NET",
  "REJECTED",
  "CANCELLED",
] as const;

export const LEAD_CATEGORIES: readonly LeadCategory[] = [
  "space",
  "baby",
  "choice",
  "cuckoo",
  "vacuum",
  "other",
] as const;

export const LEAD_PLAN_TYPES: readonly LeadPlanType[] = ["outright", "rental"] as const;

export const LEAD_PROMOTIONS: readonly LeadPromotion[] = ["none", "rm12", "samsung", "joy_pack"] as const;

/** Statuses that are still active in the pipeline (not closed). */
const OPEN_STATUSES: readonly LeadStatus[] = ["NEW", "CONTACTED", "NO_REPLY", "INTERESTED", "FORM", "QUALIFIED"];

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === "string" && (LEAD_STATUSES as readonly string[]).includes(value);
}

export function isLeadCategory(value: unknown): value is LeadCategory {
  return typeof value === "string" && (LEAD_CATEGORIES as readonly string[]).includes(value);
}

export function isLeadPlanType(value: unknown): value is LeadPlanType {
  return typeof value === "string" && (LEAD_PLAN_TYPES as readonly string[]).includes(value);
}

export function isLeadPromotion(value: unknown): value is LeadPromotion {
  return typeof value === "string" && (LEAD_PROMOTIONS as readonly string[]).includes(value);
}

/** Normalise a captured contact into 60XXXXXXXXX, or return null when invalid. */
export function normaliseLeadContact(raw?: string): string | null {
  if (!raw) return null;
  return normaliseMyPhone(raw);
}

/** WhatsApp deep link for a normalised number. */
export function buildWhatsAppLink(normalized?: string | null): string | undefined {
  if (!normalized) return undefined;
  if (!/^60\d{8,11}$/.test(normalized)) return undefined;
  return `https://wa.me/${normalized}`;
}

/** A lead counts toward incentive only once it reaches NET. */
export function isCountable(lead: Pick<Lead, "status">): boolean {
  return lead.status === "NET";
}

export function isOpen(lead: Pick<Lead, "status">): boolean {
  return OPEN_STATUSES.includes(lead.status);
}

/** Derive the incentive month (YYYY-MM) from a NET date. */
export function deriveIncentiveMonth(netDate?: string): string | undefined {
  if (!netDate) return undefined;
  const d = new Date(netDate);
  if (Number.isNaN(d.getTime())) return undefined;
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${month}`;
}

/**
 * Apply derived fields (WhatsApp link + incentive month) to a lead patch.
 * Preserves the raw contact for audit while storing the normalised value.
 */
export function withDerivedFields<T extends Partial<Lead>>(input: T): T {
  const next: Partial<Lead> = { ...input };
  if (input.contactRaw !== undefined) {
    const normalized = normaliseLeadContact(input.contactRaw);
    next.contactNormalized = normalized ?? undefined;
    next.whatsappLink = buildWhatsAppLink(normalized) ?? undefined;
  }
  if (input.status !== undefined) {
    next.netDate = input.status === "NET" ? input.netDate || input.createdAt || undefined : undefined;
  }
  if (next.netDate !== undefined || input.status !== undefined) {
    next.incentiveMonth = deriveIncentiveMonth(next.netDate ?? input.netDate);
  }
  return next as T;
}

/**
 * Resolve the NET date for a status change. When a lead is first marked NET its
 * date is anchored to the existing value (if any) or the supplied fallback, and
 * is preserved on later updates. This prevents the same lead from being counted
 * in two different incentive months.
 */
export function resolveNetDate(
  existingNetDate: string | undefined,
  status: LeadStatus,
  fallbackDate: string,
): string | undefined {
  if (status !== "NET") return undefined;
  return existingNetDate || fallbackDate;
}

export interface LeadSummary {
  total: number;
  open: number;
  net: number;
  byStatus: Record<LeadStatus, number>;
}

export function summariseLeads(leads: Lead[]): LeadSummary {
  const byStatus = Object.fromEntries(LEAD_STATUSES.map((s) => [s, 0])) as Record<LeadStatus, number>;
  for (const lead of leads) byStatus[lead.status] += 1;
  return {
    total: leads.length,
    open: leads.filter(isOpen).length,
    net: byStatus.NET,
    byStatus,
  };
}

/** Sort newest-first by createdAt without mutating the input. */
export function sortLeads(leads: Lead[]): Lead[] {
  return [...leads].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
