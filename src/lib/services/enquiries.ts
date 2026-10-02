import { getStore } from "@/lib/db";
import type { Enquiry } from "@/lib/types";
import { enquirySchema } from "@/lib/validation";
import type { ServiceResult } from "./advisors";

export async function recordEnquiry(raw: unknown): Promise<ServiceResult<Enquiry>> {
  const parsed = enquirySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Invalid enquiry payload." };
  const input = parsed.data;

  const store = getStore();
  let advisorId: string | undefined;
  let advisorSlug = input.advisorSlug || undefined;

  if (advisorSlug) {
    const advisor = await store.getAdvisorBySlug(advisorSlug);
    if (advisor) {
      advisorId = advisor.id;
    } else {
      advisorSlug = undefined;
    }
  }

  const enquiry = await store.createEnquiry({
    advisorId,
    advisorSlug,
    customerName: input.customerName || undefined,
    customerPhone: input.customerPhone || undefined,
    productInterest: input.productInterest || undefined,
    sourcePage: input.sourcePage || undefined,
    channel: input.channel || "whatsapp",
    message: input.message || undefined,
    status: "new",
  });

  return { ok: true, data: enquiry };
}
