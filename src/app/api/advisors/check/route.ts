import { NextResponse } from "next/server";
import { usernameSchema } from "@/lib/validation";
import { isUsernameAvailable } from "@/lib/services/advisors";
import { handleError } from "@/lib/http";
import { limitRequest } from "@/lib/rateLimit";

export async function GET(request: Request) {
  try {
    // Availability checks are inherently enumerable; throttle to raise the cost
    // of scripted discovery.
    if (!(await limitRequest(request, "advisor-check", 30, 60))) {
      return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
    }
    const username = new URL(request.url).searchParams.get("username")?.trim().toLowerCase() || "";
    const parsed = usernameSchema.safeParse(username);
    if (!parsed.success) {
      return NextResponse.json({
        ok: true,
        data: { available: false, valid: false, message: parsed.error.issues[0]?.message },
      });
    }
    const available = await isUsernameAvailable(parsed.data);
    return NextResponse.json({
      ok: true,
      data: {
        available,
        valid: true,
        message: available ? "Username is available." : "This username is already taken.",
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
