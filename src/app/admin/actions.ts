"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/actions";
import { getSession } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/types";
import { hashPassword } from "@/lib/auth/password";
import { getStore } from "@/lib/db";
import {
  advisorRegisterSchema,
  advisorSettingsSchema,
  contentScopeSchema,
  contentValueSchema,
  formBoolean,
  productSchema,
  promotionSchema,
} from "@/lib/validation";
import { slugify } from "@/lib/utils";
import type { AdvisorStatus, AdvisorTheme, ContentLocale, ProductStatus, RentalPlan } from "@/lib/types";
import { getI18n } from "@/i18n/server";
import { logAudit } from "@/lib/audit";
import { consumeLimit } from "@/lib/rateLimit";
import { contentKeysForScope } from "@/lib/content/registry";

function publicAdvisorUrl(slug: string): string {
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "movonhub.com.my";
  return `https://${slug}.${root}`;
}

function generatePassword(): string {
  return randomBytes(9).toString("base64url");
}

function parseStatus(value: FormDataEntryValue | null): AdvisorStatus {
  const v = String(value || "");
  return v === "draft" || v === "suspended" ? v : "published";
}

function parseTheme(value: FormDataEntryValue | null): AdvisorTheme {
  return String(value || "") === "dark" ? "dark" : "light";
}

function parseLocale(value: FormDataEntryValue | null): ContentLocale {
  return String(value || "") === "ms" ? "ms" : "en";
}

async function requireAdmin(): Promise<SessionUser | null> {
  const session = await getSession();
  return session?.role === "admin" ? session : null;
}

async function adminMsg(key: string): Promise<string> {
  const { t } = await getI18n();
  return t(key);
}

function lines(value: FormDataEntryValue | null): string[] {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parsePlans(value: FormDataEntryValue | null): RentalPlan[] {
  return lines(value).flatMap((line) => {
    const [label, monthly, tenure, note] = line.split("|").map((p) => p.trim());
    const price = Number(monthly);
    if (!label || Number.isNaN(price)) return [];
    return [
      {
        label,
        monthlyPrice: price,
        tenureMonths: tenure ? Number(tenure) || undefined : undefined,
        note: note || undefined,
      },
    ];
  });
}

function parseSpecs(value: FormDataEntryValue | null): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of lines(value)) {
    const idx = line.indexOf(":");
    if (idx > 0) out[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return out;
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/tools");
  revalidatePath("/hub");
  revalidatePath("/admin");
}

export async function saveProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requireAdmin())) return { error: await adminMsg("auth.adminOnly") };
  const id = String(formData.get("id") || "");
  const parsed = productSchema.safeParse({
    name: String(formData.get("name") || ""),
    slug: String(formData.get("slug") || "").trim() || slugify(String(formData.get("name") || "")),
    categoryId: String(formData.get("categoryId") || ""),
    series: String(formData.get("series") || ""),
    model: String(formData.get("model") || ""),
    imageUrl: String(formData.get("imageUrl") || ""),
    shortDescription: String(formData.get("shortDescription") || ""),
    fullDescription: String(formData.get("fullDescription") || ""),
    features: lines(formData.get("features")),
    rentalPlans: parsePlans(formData.get("rentalPlans")),
    outrightPrice: String(formData.get("outrightPrice") || "").trim()
      ? Number(formData.get("outrightPrice"))
      : undefined,
    warranty: String(formData.get("warranty") || ""),
    installation: String(formData.get("installation") || ""),
    status: (String(formData.get("status") || "draft") as ProductStatus),
    sourceUrl: String(formData.get("sourceUrl") || ""),
  });
  if (!parsed.success) {
    return { error: await adminMsg("auth.fixFields"), fieldErrors: flatten(parsed.error) };
  }
  const input = parsed.data;
  const store = getStore();
  const payload = {
    ...input,
    features: input.features,
    rentalPlans: input.rentalPlans,
    specifications: parseSpecs(formData.get("specifications")),
  };

  if (id) {
    await store.updateProduct(id, payload);
  } else {
    await store.createProduct({ ...payload, sortOrder: 99 });
  }
  revalidateAll();
  revalidatePath(`/products/${input.slug}`);
  return { ok: true, message: id ? "Product updated." : "Product created." };
}

export async function deleteProduct(formData: FormData): Promise<void> {
  if (!(await requireAdmin())) redirect("/login");
  const id = String(formData.get("id") || "");
  if (id) await getStore().deleteProduct(id);
  revalidateAll();
}

export async function savePromotion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requireAdmin())) return { error: await adminMsg("auth.adminOnly") };
  const id = String(formData.get("id") || "");
  const parsed = promotionSchema.safeParse({
    title: String(formData.get("title") || ""),
    description: String(formData.get("description") || ""),
    startDate: String(formData.get("startDate") || ""),
    endDate: String(formData.get("endDate") || ""),
    terms: String(formData.get("terms") || ""),
    productIds: formData.getAll("productIds").map(String),
    sourceUrl: String(formData.get("sourceUrl") || ""),
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });
  if (!parsed.success) {
    return { error: await adminMsg("auth.fixFields"), fieldErrors: flatten(parsed.error) };
  }
  const input = parsed.data;
  const store = getStore();
  const payload = {
    title: input.title,
    description: input.description,
    startDate: input.startDate,
    endDate: input.endDate || undefined,
    productIds: input.productIds,
    terms: input.terms || undefined,
    sourceUrl: input.sourceUrl || undefined,
    active: input.active,
  };
  if (id) {
    await store.updatePromotion(id, payload);
  } else {
    await store.createPromotion(payload);
  }
  revalidateAll();
  return { ok: true, message: id ? "Promotion updated." : "Promotion created." };
}

export async function togglePromotion(formData: FormData): Promise<void> {
  if (!(await requireAdmin())) redirect("/login");
  const id = String(formData.get("id") || "");
  const active = String(formData.get("active") || "") === "true";
  if (id) await getStore().updatePromotion(id, { active: !active });
  revalidateAll();
}

export async function deletePromotion(formData: FormData): Promise<void> {
  if (!(await requireAdmin())) redirect("/login");
  const id = String(formData.get("id") || "");
  if (id) await getStore().deletePromotion(id);
  revalidateAll();
}

export async function toggleAdvisorActive(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  if (!session) redirect("/login");
  const id = String(formData.get("id") || "");
  const active = String(formData.get("active") || "") === "true";
  if (id) await getStore().updateAdvisor(id, { active: !active });
  await logAudit(session, "advisor.activation_changed", { type: "advisor", id }, { active: !active });
  revalidateAll();
}

export async function toggleAdvisorFeatured(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  if (!session) redirect("/login");
  const id = String(formData.get("id") || "");
  const featured = String(formData.get("featured") || "") === "true";
  if (id) await getStore().updateAdvisor(id, { featured: !featured });
  await logAudit(session, "advisor.featured_changed", { type: "advisor", id }, { featured: !featured });
  revalidateAll();
}

export async function deleteAdvisor(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  if (!session) redirect("/login");
  const id = String(formData.get("id") || "");
  if (id) await getStore().deleteAdvisor(id);
  await logAudit(session, "advisor.deleted", { type: "advisor", id });
  revalidateAll();
}

export async function updateAdvisorAdmin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  if (!session) return { error: await adminMsg("auth.adminOnly") };
  const id = String(formData.get("id") || "");
  if (!id) return { error: "Missing advisor." };

  const parsed = advisorSettingsSchema.safeParse({
    name: String(formData.get("name") || ""),
    title: String(formData.get("title") || ""),
    phone: String(formData.get("phone") || "") || undefined,
    phoneDisplay: String(formData.get("phoneDisplay") || ""),
    email: String(formData.get("email") || ""),
    bio: String(formData.get("bio") || ""),
    location: String(formData.get("location") || ""),
    status: parseStatus(formData.get("status")),
    preferredTheme: parseTheme(formData.get("preferredTheme")),
    defaultLocale: parseLocale(formData.get("defaultLocale")),
    allowLanguageToggle: formBoolean(formData.get("allowLanguageToggle")),
    allowThemeToggle: formBoolean(formData.get("allowThemeToggle")),
  });
  if (!parsed.success) {
    return { error: await adminMsg("auth.fixFields"), fieldErrors: flatten(parsed.error) };
  }
  const input = parsed.data;
  if (input.name.length < 2) {
    return { error: "Name is required.", fieldErrors: { name: "Name is required." } };
  }

  const store = getStore();
  const before = await store.getAdvisorById(id);
  await store.updateAdvisor(id, {
    name: input.name,
    title: input.title?.trim() || "Movon Sales Advisor",
    phone: input.phone ? input.phone.replace(/[^0-9]/g, "") : undefined,
    phoneDisplay: input.phoneDisplay?.trim() || undefined,
    email: input.email || undefined,
    bio: input.bio || undefined,
    location: input.location || undefined,
    status: input.status,
    active: input.status === "published",
    preferredTheme: input.preferredTheme,
    defaultLocale: input.defaultLocale,
    allowLanguageToggle: input.allowLanguageToggle,
    allowThemeToggle: input.allowThemeToggle,
  });
  await logAudit(session, "advisor.settings_changed", { type: "advisor", id }, {
    status: input.status,
    defaultLocale: input.defaultLocale,
    preferredTheme: input.preferredTheme,
    allowLanguageToggle: input.allowLanguageToggle,
    allowThemeToggle: input.allowThemeToggle,
    role: before?.status === input.status ? undefined : "status_changed",
  });
  revalidateAll();
  if (before?.slug) revalidatePath(`/sa/${before.slug}`);
  return { ok: true, message: "Advisor updated." };
}

/** Create an SA record + microsite in one step (Super Admin onboarding). */
export async function createAdvisorAdmin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  if (!session) return { error: await adminMsg("auth.adminOnly") };

  const parsed = advisorRegisterSchema.safeParse({
    name: String(formData.get("name") || ""),
    phone: String(formData.get("phone") || ""),
    slug: String(formData.get("slug") || "").toLowerCase().trim(),
    password: String(formData.get("password") || "") || generatePassword(),
    bio: String(formData.get("bio") || ""),
    title: "Movon Sales Advisor",
    email: String(formData.get("email") || ""),
  });
  if (!parsed.success) {
    return { error: await adminMsg("auth.fixFields"), fieldErrors: flatten(parsed.error) };
  }
  const input = parsed.data;
  const store = getStore();

  if (await store.getAdvisorBySlug(input.slug)) {
    return { error: await adminMsg("auth.usernameTaken"), fieldErrors: { slug: await adminMsg("auth.usernameTaken") } };
  }

  const status = parseStatus(formData.get("status"));
  const preferredTheme = parseTheme(formData.get("preferredTheme"));
  const defaultLocale = parseLocale(formData.get("defaultLocale"));

  const created = await store.createAdvisor({
    slug: input.slug,
    name: input.name,
    title: "Movon Sales Advisor",
    phone: input.phone,
    phoneDisplay: input.phone,
    email: input.email || undefined,
    photoUrl: undefined,
    bio: input.bio || undefined,
    location: undefined,
    whatsappName: input.name.split(" ")[0],
    greeting: `Hi ${input.name.split(" ")[0]}, I'm interested in Movon products. Can you share more information?`,
    accent: "#1E7BFF",
    socials: {},
    passwordHash: hashPassword(input.password),
    active: status === "published",
    featured: false,
    status,
    preferredTheme,
    defaultLocale,
    allowLanguageToggle: true,
    allowThemeToggle: true,
  });

  await logAudit(session, "advisor.created", { type: "advisor", id: created.id }, {
    slug: input.slug,
    status,
  });

  revalidateAll();
  return {
    ok: true,
    message: "Advisor created.",
    meta: { slug: input.slug, publicUrl: publicAdvisorUrl(input.slug), password: input.password },
  };
}

/** Generate a new password for an SA and return it once to the admin. */
export async function resetAdvisorAccess(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  if (!session) return { error: await adminMsg("auth.adminOnly") };
  const id = String(formData.get("id") || "");
  if (!id) return { error: "Missing advisor." };
  const password = generatePassword();
  await getStore().updateAdvisor(id, { passwordHash: hashPassword(password) });
  await logAudit(session, "advisor.password_reset", { type: "advisor", id });
  return { ok: true, message: "Access reset.", meta: { password } };
}

/** Set publish status (draft / published / suspended); keeps `active` in sync. */
export async function setAdvisorStatus(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  if (!session) redirect("/login");
  const id = String(formData.get("id") || "");
  const status = parseStatus(formData.get("status"));
  if (id) await getStore().updateAdvisor(id, { status, active: status === "published" });
  await logAudit(session, "advisor.status_changed", { type: "advisor", id }, { status });
  revalidateAll();
}

export async function saveFeaturedAdvisors(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  if (!session) return { error: await adminMsg("auth.adminOnly") };
  const slugs = formData.getAll("slug").map(String);
  await getStore().updateSettings({ featuredAdvisorSlugs: slugs });
  await logAudit(session, "settings.featured_advisors_changed", { type: "settings", id: "platform" }, {
    count: slugs.length,
  });
  revalidateAll();
  return { ok: true, message: "Featured advisors updated." };
}

/** Save editable public copy for the main site, SA global defaults or one advisor. */
export async function saveSiteContent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  if (!session) return { error: await adminMsg("auth.adminOnly") };

  if (!(await consumeLimit(`content:${session.id}`, 60, 60))) {
    return { error: "Too many changes in a short time. Please wait a moment and try again." };
  }

  const scopeParsed = contentScopeSchema.safeParse(String(formData.get("scope") || "site"));
  if (!scopeParsed.success) return { error: "Unknown content area." };
  const scope = scopeParsed.data;

  let advisorId: string | null = null;
  let advisorSlug: string | undefined;
  if (scope === "sa") {
    advisorId = String(formData.get("advisorId") || "") || null;
    if (!advisorId) return { error: "Choose a sales advisor." };
    const advisor = await getStore().getAdvisorById(advisorId);
    if (!advisor) return { error: "Sales advisor not found." };
    advisorSlug = advisor.slug;
  }

  const store = getStore();
  const intent = String(formData.get("intent") || "save-draft");

  if (intent === "revert") {
    await store.deleteSiteContent({ scope, advisorId });
    await logAudit(session, "content.reverted", { type: scope, id: advisorId ?? scope }, { scope });
    revalidateAll();
    revalidatePath("/admin/content");
    if (advisorSlug) revalidatePath(`/sa/${advisorSlug}`);
    return { ok: true, message: (await adminMsg("admin.content.reverted")) };
  }

  const status = intent === "publish" ? "published" : "draft";
  const keys = contentKeysForScope(scope);
  let saved = 0;

  for (const locale of ["en", "ms"] as const) {
    for (const def of keys) {
      const raw = formData.get(`content.${locale}.${def.key}`);
      if (raw === null) continue;
      const parsed = contentValueSchema.safeParse(String(raw));
      if (!parsed.success) {
        return { error: `${def.label}: ${parsed.error.issues[0]?.message || "Invalid value."}` };
      }
      const value = parsed.data.trim();
      if (value.length > def.maxLength) {
        return { error: `${def.label} must be ${def.maxLength} characters or fewer.` };
      }
      if (value === "") {
        await store.deleteSiteContent({ scope, advisorId, contentKey: def.key, locale });
        continue;
      }
      await store.upsertSiteContent({
        scope,
        advisorId: advisorId ?? undefined,
        contentKey: def.key,
        locale,
        value,
        status,
        updatedBy: session.id,
      });
      saved += 1;
    }
  }

  await logAudit(
    session,
    status === "published" ? "content.published" : "content.draft_saved",
    { type: scope, id: advisorId ?? scope },
    { scope, fields: saved },
  );
  revalidateAll();
  revalidatePath("/admin/content");
  if (advisorSlug) revalidatePath(`/sa/${advisorSlug}`);
  return {
    ok: true,
    message:
      status === "published"
        ? await adminMsg("admin.content.published")
        : await adminMsg("admin.content.savedDraft"),
  };
}

function flatten(error: { issues: { path: (string | number)[]; message: string }[] }): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
