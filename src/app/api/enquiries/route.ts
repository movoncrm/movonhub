import { handleError, fail, ok } from "@/lib/http";
import { limitRequest } from "@/lib/rateLimit";
import { recordEnquiry } from "@/lib/services/enquiries";

const MAX_BODY_BYTES = 16 * 1024;

export async function POST(request: Request) {
  try {
    if (!(await limitRequest(request, "enquiry", 30, 60))) {
      return fail("Too many requests. Please try again shortly.", 429);
    }
    const declared = Number(request.headers.get("content-length") || "0");
    if (declared > MAX_BODY_BYTES) {
      return fail("Enquiry payload is too large.", 413);
    }
    const body = await request.json().catch(() => ({}));
    const result = await recordEnquiry(body);
    if (!result.ok) return fail(result.error || "Invalid enquiry.", 422);
    return ok(result.data, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
