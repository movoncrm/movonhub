import { handleError, fail, ok } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rateLimit";
import { recordEnquiry } from "@/lib/services/enquiries";

export async function POST(request: Request) {
  try {
    if (!rateLimit(clientKey(request, "enquiry"), 30, 60_000)) {
      return fail("Too many requests. Please try again shortly.", 429);
    }
    const body = await request.json().catch(() => ({}));
    const result = await recordEnquiry(body);
    if (!result.ok) return fail(result.error || "Invalid enquiry.", 422);
    return ok(result.data, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
