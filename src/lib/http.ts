import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/session";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(message: string, status = 400, fieldErrors?: Record<string, string>) {
  return NextResponse.json({ ok: false, error: message, fieldErrors }, { status });
}

export function handleError(error: unknown) {
  if (error instanceof AuthError) return fail(error.message, error.status);
  console.error("[api] unhandled error:", error instanceof Error ? error.message : error);
  return fail("Something went wrong. Please try again.", 500);
}
