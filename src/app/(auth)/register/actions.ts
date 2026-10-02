"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/actions";
import { getStore } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth/session";
import { registrationEnabled } from "@/lib/auth/registration";
import { advisorRegisterSchema } from "@/lib/validation";
import { saveAdvisorPhoto } from "@/lib/storage";
import { hashPassword } from "@/lib/auth/password";
import { getI18n } from "@/i18n/server";
import { consumeLimit, clientIp } from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";

export async function registerAdvisor(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();

  if (!registrationEnabled()) {
    return { error: t("auth.registrationDisabled") };
  }

  const ip = clientIp(await headers());
  if (!(await consumeLimit(`register:${ip}`, 5, 3600))) {
    return { error: t("auth.tooManyAttempts") };
  }

  const raw = {
    name: String(formData.get("name") || ""),
    phone: String(formData.get("phone") || ""),
    slug: String(formData.get("slug") || "").toLowerCase().trim(),
    password: String(formData.get("password") || ""),
    bio: String(formData.get("bio") || ""),
    location: String(formData.get("location") || ""),
    title: String(formData.get("title") || ""),
    whatsappName: String(formData.get("whatsappName") || ""),
    email: String(formData.get("email") || ""),
  };

  const parsed = advisorRegisterSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: t("auth.fixFields"), fieldErrors: flatten(parsed.error) };
  }
  const input = parsed.data;
  const store = getStore();

  if (await store.getAdvisorBySlug(input.slug)) {
    return { error: t("auth.usernameTaken"), fieldErrors: { slug: t("auth.usernameTaken") } };
  }

  const photo = formData.get("photo");
  let photoUrl = "";
  if (photo instanceof File && photo.size > 0) {
    const upload = await saveAdvisorPhoto(photo, input.slug);
    if (!upload.ok) {
      const message = upload.error || t("auth.fixFields");
      return { error: message, fieldErrors: { photo: message } };
    }
    photoUrl = upload.url || "";
  }

  const advisor = await store.createAdvisor({
    slug: input.slug,
    name: input.name,
    title: input.title?.trim() || "MOVON Star Advisor",
    phone: input.phone,
    phoneDisplay: input.phone,
    email: input.email || undefined,
    photoUrl: photoUrl || undefined,
    bio: input.bio || undefined,
    location: input.location || undefined,
    whatsappName: input.whatsappName || input.name.split(" ")[0],
    greeting: `Hi ${input.whatsappName || input.name.split(" ")[0]}, I'm interested in MOVON products. Can you share more information?`,
    accent: "#1E7BFF",
    socials: {},
    passwordHash: hashPassword(input.password),
    active: true,
    featured: false,
    status: "published",
    preferredTheme: "light",
    defaultLocale: "en",
    allowLanguageToggle: true,
    allowThemeToggle: true,
  });

  await logAudit({ id: advisor.id, role: "advisor" }, "advisor.self_registered", { type: "advisor", id: advisor.id }, {
    slug: advisor.slug,
  });

  await setSessionCookie({
    id: advisor.id,
    role: "advisor",
    advisorId: advisor.id,
    slug: advisor.slug,
    name: advisor.name,
  });

  redirect(`/register/success?slug=${encodeURIComponent(advisor.slug)}`);
}

function flatten(error: { issues: { path: (string | number)[]; message: string }[] }): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
