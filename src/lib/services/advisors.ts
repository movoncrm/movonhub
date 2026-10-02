import { getStore } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { advisorRegisterSchema, advisorUpdateSchema } from "@/lib/validation";
import type { Advisor, AdvisorPublic } from "@/lib/types";

export interface ServiceResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export function toPublicAdvisor(advisor: Advisor): AdvisorPublic {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, email, ...rest } = advisor;
  return rest;
}

export async function isUsernameAvailable(slug: string): Promise<boolean> {
  const store = getStore();
  const existing = await store.getAdvisorBySlug(slug);
  return !existing;
}

export async function registerAdvisor(raw: unknown): Promise<ServiceResult<Advisor>> {
  const parsed = advisorRegisterSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: flatten(parsed.error) };
  }
  const input = parsed.data;
  const store = getStore();

  if (!(await isUsernameAvailable(input.slug))) {
    return { ok: false, error: "That username is taken.", fieldErrors: { slug: "This username is already taken." } };
  }

  const advisor = await store.createAdvisor({
    slug: input.slug,
    name: input.name,
    title: input.title?.trim() || "MOVON Star Advisor",
    phone: input.phone,
    phoneDisplay: input.phone,
    email: input.email || undefined,
    photoUrl: "",
    bio: input.bio || undefined,
    location: input.location || undefined,
    whatsappName: input.whatsappName || input.name.split(" ")[0],
    greeting: `Hi ${input.whatsappName || input.name.split(" ")[0]}, I'm interested in MOVON products. Can you share more information?`,
    accent: "#0077FF",
    socials: {},
    passwordHash: hashPassword(input.password),
    active: true,
    featured: false,
    status: "published",
    preferredTheme: "light",
  });

  return { ok: true, data: advisor };
}

export async function updateAdvisorProfile(
  id: string,
  raw: unknown,
): Promise<ServiceResult<Advisor>> {
  const parsed = advisorUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: flatten(parsed.error) };
  }
  const input = parsed.data;
  const store = getStore();

  const patch: Partial<Advisor> = {
    name: input.name,
    title: input.title?.trim() || "MOVON Star Advisor",
    bio: input.bio || undefined,
    location: input.location || undefined,
    whatsappName: input.whatsappName || undefined,
    email: input.email || undefined,
    accent: input.accent || undefined,
    socials: input.socials,
  };
  if (input.phone) {
    patch.phone = input.phone;
    patch.phoneDisplay = input.phoneDisplay || input.phone;
  }
  if (input.photoUrl) patch.photoUrl = input.photoUrl;

  const updated = await store.updateAdvisor(id, patch);
  if (!updated) return { ok: false, error: "Advisor not found." };
  return { ok: true, data: updated };
}

function flatten(error: { issues: { path: (string | number)[]; message: string }[] }): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
