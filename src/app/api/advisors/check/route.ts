import { NextResponse } from "next/server";
import { usernameSchema } from "@/lib/validation";
import { isUsernameAvailable } from "@/lib/services/advisors";
import { handleError } from "@/lib/http";

export async function GET(request: Request) {
  try {
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
