import { describe, expect, it } from "vitest";
import {
  buildWhatsAppLink,
  deriveIncentiveMonth,
  isCountable,
  isOpen,
  normaliseLeadContact,
  resolveNetDate,
  summariseLeads,
  withDerivedFields,
} from "@/lib/leads";
import type { Lead } from "@/lib/types";

function makeLead(partial: Partial<Lead>): Lead {
  return {
    id: partial.id ?? "lead-1",
    advisorId: partial.advisorId ?? "adv-1",
    status: partial.status ?? "NEW",
    planType: partial.planType ?? "outright",
    category: partial.category ?? "space",
    isDuo: partial.isDuo ?? false,
    promotion: partial.promotion ?? "none",
    createdAt: partial.createdAt ?? "2026-10-05T00:00:00.000Z",
    ...partial,
  };
}

describe("lead contact normalisation", () => {
  it("normalises Malaysian numbers to 60XXXXXXXXX", () => {
    expect(normaliseLeadContact("012-345 6789")).toBe("60123456789");
    expect(normaliseLeadContact("+60 12-345 6789")).toBe("60123456789");
  });

  it("returns null for invalid or empty input", () => {
    expect(normaliseLeadContact("")).toBeNull();
    expect(normaliseLeadContact(undefined)).toBeNull();
    expect(normaliseLeadContact("abc")).toBeNull();
  });

  it("builds a WhatsApp link only for valid numbers", () => {
    expect(buildWhatsAppLink("60123456789")).toBe("https://wa.me/60123456789");
    expect(buildWhatsAppLink("123")).toBeUndefined();
    expect(buildWhatsAppLink(undefined)).toBeUndefined();
  });
});

describe("lead status helpers", () => {
  it("counts only NET toward incentive", () => {
    expect(isCountable(makeLead({ status: "NET" }))).toBe(true);
    expect(isCountable(makeLead({ status: "QUALIFIED" }))).toBe(false);
  });

  it("treats pre-NET statuses as open and NET/closed as not open", () => {
    expect(isOpen(makeLead({ status: "NEW" }))).toBe(true);
    expect(isOpen(makeLead({ status: "INTERESTED" }))).toBe(true);
    expect(isOpen(makeLead({ status: "NET" }))).toBe(false);
    expect(isOpen(makeLead({ status: "REJECTED" }))).toBe(false);
  });
});

describe("deriveIncentiveMonth", () => {
  it("derives YYYY-MM from a valid date", () => {
    expect(deriveIncentiveMonth("2026-10-31")).toBe("2026-10");
    expect(deriveIncentiveMonth("2026-01-05T12:00:00.000Z")).toBe("2026-01");
  });

  it("returns undefined for missing or invalid dates", () => {
    expect(deriveIncentiveMonth(undefined)).toBeUndefined();
    expect(deriveIncentiveMonth("not-a-date")).toBeUndefined();
  });
});

describe("withDerivedFields", () => {
  it("stores normalised contact and WhatsApp link", () => {
    const result = withDerivedFields<Partial<Lead>>({ contactRaw: "012-345 6789" });
    expect(result.contactNormalized).toBe("60123456789");
    expect(result.whatsappLink).toBe("https://wa.me/60123456789");
  });

  it("sets the NET date when moving to NET and clears it otherwise", () => {
    const net = withDerivedFields<Partial<Lead>>({
      status: "NET",
      netDate: "2026-10-20",
    });
    expect(net.netDate).toBe("2026-10-20");
    expect(net.incentiveMonth).toBe("2026-10");

    const reopened = withDerivedFields<Partial<Lead>>({ status: "INTERESTED" });
    expect(reopened.netDate).toBeUndefined();
    expect(reopened.incentiveMonth).toBeUndefined();
  });
});

describe("resolveNetDate", () => {
  it("anchors the NET date on first NET and preserves it afterwards", () => {
    expect(resolveNetDate(undefined, "NET", "2026-10-01")).toBe("2026-10-01");
    // Re-saving NET (e.g. toggling back and forth) keeps the original date, so
    // a lead cannot be counted in two incentive months.
    expect(resolveNetDate("2026-09-15", "NET", "2026-10-01")).toBe("2026-09-15");
  });

  it("clears the NET date when a lead leaves NET", () => {
    expect(resolveNetDate("2026-09-15", "CONTACTED", "2026-10-01")).toBeUndefined();
    expect(resolveNetDate("2026-09-15", "REJECTED", "2026-10-01")).toBeUndefined();
  });
});

describe("summariseLeads", () => {
  it("counts total, open and NET", () => {
    const leads = [
      makeLead({ id: "1", status: "NEW" }),
      makeLead({ id: "2", status: "NET" }),
      makeLead({ id: "3", status: "REJECTED" }),
    ];
    const summary = summariseLeads(leads);
    expect(summary.total).toBe(3);
    expect(summary.open).toBe(1);
    expect(summary.net).toBe(1);
    expect(summary.byStatus.NET).toBe(1);
  });
});
