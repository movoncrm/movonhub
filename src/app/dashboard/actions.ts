"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/actions";
import { getSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { getStore } from "@/lib/db";
import { saveAdvisorPhoto } from "@/lib/storage";
import { advisorUpdateSchema, passwordSchema } from "@/lib/validation";
import { getI18n } from "@/i18n/server";

export async function updateAdvisorProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const [{ t }, session] = await Promise.all([getI18n(), getSession()]);
  if (!session || session.role !== "advisor" || !session.advisorId) {
    return { error: t("auth.notAuthenticated") };
  }

  const parsed = advisorUpdateSchema.safeParse({
    name: String(formData.get("name") || ""),
    title: String(formData.get("title") || ""),
    phone: String(formData.get("phone") || ""),
    phoneDisplay: String(formData.get("phoneDisplay") || ""),
    bio: String(formData.get("bio") || ""),
    location: String(formData.get("location") || ""),
    whatsappName: String(formData.get("whatsappName") || ""),
    email: String(formData.get("email") || ""),
    accent: String(formData.get("accent") || ""),
    photoUrl: "",
    socials: {
      facebook: String(formData.get("socials.facebook") || ""),
      instagram: String(formData.get("socials.instagram") || ""),
      tiktok: String(formData.get("socials.tiktok") || ""),
      website: String(formData.get("socials.website") || ""),
    },
  });
  if (!parsed.success) {
    return { error: t("auth.fixFields"), fieldErrors: flatten(parsed.error) };
  }
  const input = parsed.data;
  const store = getStore();
  const patch = {
    name: input.name,
    title: input.title?.trim() || "MOVON Star Advisor",
    bio: input.bio || undefined,
    location: input.location || undefined,
    whatsappName: input.whatsappName || undefined,
    email: input.email || undefined,
    accent: input.accent || undefined,
    socials: input.socials,
    ...(input.phone ? { phone: input.phone, phoneDisplay: input.phoneDisplay || input.phone } : {}),
  };

  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const current = await store.getAdvisorById(session.advisorId);
    const upload = await saveAdvisorPhoto(photo, current?.slug || "advisor");
    if (!upload.ok) {
      const message = upload.error || t("auth.fixFields");
      return { error: message, fieldErrors: { photo: message } };
    }
    Object.assign(patch, { photoUrl: upload.url });
  }

  await store.updateAdvisor(session.advisorId, patch);
  revalidatePath("/dashboard");
  if (session.slug) revalidatePath(`/sa/${session.slug}`);
  return { ok: true, message: t("common.saveChanges") };
}

export async function changeAdvisorPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const [{ t }, session] = await Promise.all([getI18n(), getSession()]);
  if (!session || session.role !== "advisor" || !session.advisorId) {
    return { error: t("auth.notAuthenticated") };
  }
  const parsed = passwordSchema.safeParse(String(formData.get("password") || ""));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || t("auth.fixFields") };

  const store = getStore();
  await store.updateAdvisor(session.advisorId, { passwordHash: hashPassword(parsed.data) });
  return { ok: true, message: t("dashboard.updatePassword") };
}

function flatten(error: { issues: { path: (string | number)[]; message: string }[] }): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
