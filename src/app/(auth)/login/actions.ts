"use server";

import { timingSafeEqual } from "crypto";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/actions";
import { getStore } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation";
import { getI18n } from "@/i18n/server";

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

  if (username.toLowerCase() === "admin") {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return { error: t("auth.adminNotConfigured") };
    }
    if (!safeEqual(password, adminPassword)) {
      return { error: t("auth.incorrect") };
    }
    await setSessionCookie({ id: "admin", role: "admin", name: "Administrator" });
    redirect("/admin");
  }

  const advisor = await getStore().getAdvisorBySlug(username.toLowerCase());
  if (!advisor || !verifyPassword(password, advisor.passwordHash)) {
    return { error: t("auth.incorrect") };
  }
  if (!advisor.active) {
    return { error: t("auth.inactive") };
  }

  await setSessionCookie({
    id: advisor.id,
    role: "advisor",
    advisorId: advisor.id,
    slug: advisor.slug,
    name: advisor.name,
  });
  redirect("/hub");
}
