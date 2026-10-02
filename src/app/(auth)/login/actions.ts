"use server";

import { timingSafeEqual } from "crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/actions";
import { getStore } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation";
import { getI18n } from "@/i18n/server";
import { consumeLimit, clientIp } from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();

  const parsed = loginSchema.safeParse({
    username: String(formData.get("username") || ""),
    password: String(formData.get("password") || ""),
  });
  if (!parsed.success) {
    return { error: t("auth.enterCredentials") };
  }
  const { username, password } = parsed.data;
  const normalised = username.toLowerCase();

  // Durable, cross-instance throttling. Limits are applied per client IP and
  // per supplied username so neither spraying nor a single-account lockout
  // dominates. A generic message avoids leaking which limit was hit.
  const ip = clientIp(await headers());
  const [ipAllowed, userAllowed] = await Promise.all([
    consumeLimit(`login:ip:${ip}`, 10, 300),
    consumeLimit(`login:user:${normalised}`, 5, 300),
  ]);
  if (!ipAllowed || !userAllowed) {
    await logAudit({ id: normalised, role: "anonymous" }, "auth.login_throttled", { type: "auth" }, { ip });
    return { error: t("auth.tooManyAttempts") };
  }

  if (normalised === "admin") {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return { error: t("auth.adminNotConfigured") };
    }
    if (!safeEqual(password, adminPassword)) {
      await logAudit({ id: "admin", role: "anonymous" }, "auth.login_failed", { type: "auth" }, { ip });
      return { error: t("auth.incorrect") };
    }
    await setSessionCookie({ id: "admin", role: "admin", name: "Administrator" });
    await logAudit({ id: "admin", role: "admin" }, "auth.login_success", { type: "auth" });
    redirect("/admin");
  }

  const advisor = await getStore().getAdvisorBySlug(normalised);
  if (!advisor || !verifyPassword(password, advisor.passwordHash)) {
    await logAudit({ id: normalised, role: "anonymous" }, "auth.login_failed", { type: "auth" }, { ip });
    return { error: t("auth.incorrect") };
  }
  // Suspended and inactive accounts return the same generic message so the
  // existence or state of an account cannot be enumerated.
  if (!advisor.active || advisor.status === "suspended") {
    await logAudit({ id: normalised, role: "anonymous" }, "auth.login_blocked", { type: "advisor", id: advisor.id });
    return { error: t("auth.incorrect") };
  }

  await setSessionCookie({
    id: advisor.id,
    role: "advisor",
    advisorId: advisor.id,
    slug: advisor.slug,
    name: advisor.name,
  });
  await logAudit({ id: advisor.id, role: "advisor" }, "auth.login_success", { type: "advisor", id: advisor.id });
  redirect("/hub");
}
