import { z } from "zod";
import { isManagedAssetUrl } from "./assets/url";
import { normaliseMyPhone } from "./utils";

/** Routes and names that must never be used as an advisor slug. */
export const RESERVED_SLUGS = new Set([
  "admin",
  "dashboard",
  "hub",
  "register",
  "login",
  "logout",
  "api",
  "sa",
  "tools",
  "ai",
  "products",
  "product",
  "about",
  "contact",
  "privacy",
  "terms",
  "disclaimer",
  "legal",
  "sitemap",
  "robots",
  "manifest",
  "favicon",
  "uploads",
  "static",
  "_next",
  "www",
  "app",
  "auth",
  "settings",
  "support",
  "help",
  "blog",
  "space",
  "baby",
  "expert",
  "choice",
  "movon",
  "movonhub",
  "mail",
  "email",
  "assets",
  "ftp",
  "cpanel",
  "portal",
  "account",
  "signin",
  "signup",
  "staging",
  "cdn",
  "status",
  "sso",
]);

/** Extra reserved slugs from env (comma-separated), merged with the built-in list. */
const EXTRA_RESERVED = (process.env.RESERVED_SLUGS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export function isReservedSlug(slug: string): boolean {
  const value = slug.trim().toLowerCase();
  return RESERVED_SLUGS.has(value) || EXTRA_RESERVED.includes(value);
}

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters.")
  .max(30, "Username must be 30 characters or fewer.")
  .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "Use lowercase letters, numbers and hyphens only.")
  .refine((v) => !v.includes("--"), "Avoid consecutive hyphens.")
  .refine((v) => !isReservedSlug(v), "This username is reserved. Please choose another.");

export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required.")
  .transform((v) => normaliseMyPhone(v))
  .refine((v): v is string => Boolean(v), "Enter a valid Malaysian phone number (e.g. 60123456789).");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(100, "Password is too long.")
  .refine((v) => /[A-Za-z]/.test(v) && /[0-9]/.test(v), "Use at least one letter and one number.");

export const advisorRegisterSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(80),
  phone: phoneSchema,
  slug: usernameSchema,
  password: passwordSchema,
  bio: z.string().trim().max(600, "Introduction is too long.").optional().or(z.literal("")),
  location: z.string().trim().max(80).optional().or(z.literal("")),
  title: z.string().trim().max(60).optional().or(z.literal("")),
  whatsappName: z.string().trim().max(60).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email.").optional().or(z.literal("")),
});

export const advisorUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  title: z.string().trim().max(60).optional().or(z.literal("")),
  phone: phoneSchema.optional(),
  phoneDisplay: z.string().trim().max(30).optional().or(z.literal("")),
  bio: z.string().trim().max(600).optional().or(z.literal("")),
  location: z.string().trim().max(80).optional().or(z.literal("")),
  whatsappName: z.string().trim().max(60).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email.").optional().or(z.literal("")),
  accent: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #0077FF.")
    .optional()
    .or(z.literal("")),
  photoUrl: z.string().trim().max(500).optional().or(z.literal("")),
  socials: z
    .object({
      facebook: z.string().trim().max(200).optional().or(z.literal("")),
      instagram: z.string().trim().max(200).optional().or(z.literal("")),
      tiktok: z.string().trim().max(200).optional().or(z.literal("")),
      website: z.string().trim().max(200).optional().or(z.literal("")),
    })
    .optional(),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Enter your username."),
  password: z.string().min(1, "Enter your password."),
});

export const enquirySchema = z.object({
  advisorSlug: z.string().trim().optional().or(z.literal("")),
  customerName: z.string().trim().max(80).optional().or(z.literal("")),
  customerPhone: z.string().trim().max(30).optional().or(z.literal("")),
  productInterest: z.string().trim().max(160).optional().or(z.literal("")),
  sourcePage: z.string().trim().max(300).optional().or(z.literal("")),
  channel: z.string().trim().max(30).default("whatsapp"),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const leadStatusSchema = z.enum([
  "NEW",
  "CONTACTED",
  "NO_REPLY",
  "INTERESTED",
  "FORM",
  "QUALIFIED",
  "NET",
  "REJECTED",
  "CANCELLED",
]);
export const leadCategorySchema = z.enum(["space", "baby", "choice", "cuckoo", "vacuum", "other"]);
export const leadPlanTypeSchema = z.enum(["outright", "rental"]);
export const leadPromotionSchema = z.enum(["none", "rm12", "samsung", "joy_pack"]);

export const leadSchema = z.object({
  customerName: z.string().trim().max(80).optional().or(z.literal("")),
  contactRaw: z.string().trim().max(30).optional().or(z.literal("")),
  status: leadStatusSchema.default("NEW"),
  planType: leadPlanTypeSchema.default("outright"),
  category: leadCategorySchema.default("space"),
  isDuo: z.boolean().default(false),
  promotion: leadPromotionSchema.default("none"),
  proxyOwner: z.string().trim().max(80).optional().or(z.literal("")),
  location: z.string().trim().max(80).optional().or(z.literal("")),
  productInterest: z.string().trim().max(160).optional().or(z.literal("")),
  productId: z.string().trim().max(64).optional().or(z.literal("")),
  remarks: z.string().trim().max(1000).optional().or(z.literal("")),
  lastFollowUpAt: z.string().trim().max(40).optional().or(z.literal("")),
  netDate: z.string().trim().max(40).optional().or(z.literal("")),
});

export const promotionSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(600),
  startDate: z.string().trim().min(1, "Start date is required."),
  endDate: z.string().trim().optional().or(z.literal("")),
  terms: z.string().trim().max(1000).optional().or(z.literal("")),
  productIds: z.array(z.string()).default([]),
  sourceUrl: z.string().trim().max(300).optional().or(z.literal("")),
  active: z.boolean().default(false),
});

export const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens."),
  categoryId: z.string().trim().min(1, "Choose a category."),
  series: z.string().trim().max(40).optional().or(z.literal("")),
  model: z.string().trim().max(60).optional().or(z.literal("")),
  // Only MOVONHUB-managed asset URLs (R2 or local dev uploads) are allowed so
  // product images cannot be hot-linked from third-party hosts.
  imageUrl: z
    .string()
    .trim()
    .max(500)
    .refine((value) => value === "" || isManagedAssetUrl(value), {
      message: "Use the upload button to add a product image.",
    })
    .optional(),
  shortDescription: z.string().trim().min(2).max(300),
  fullDescription: z.string().trim().max(2000).optional().or(z.literal("")),
  features: z.array(z.string().trim().max(160)).default([]),
  rentalPlans: z
    .array(
      z.object({
        label: z.string().trim().min(1),
        monthlyPrice: z.coerce.number().nonnegative(),
        tenureMonths: z.coerce.number().int().positive().optional(),
        note: z.string().trim().max(200).optional().or(z.literal("")),
      }),
    )
    .default([]),
  outrightPrice: z.coerce.number().nonnegative().optional(),
  warranty: z.string().trim().max(200).optional().or(z.literal("")),
  installation: z.string().trim().max(200).optional().or(z.literal("")),
  status: z.enum(["active", "draft", "archived"]).default("draft"),
  sourceUrl: z.string().trim().max(300).optional().or(z.literal("")),
});

/* ------------------------------------------------------------------ admin */

export const contentLocaleSchema = z.enum(["en", "ms"]);
export const contentScopeSchema = z.enum(["site", "sa_global", "sa"]);
export const contentStatusSchema = z.enum(["draft", "published"]);
export const advisorThemeSchema = z.enum(["light", "dark"]);
export const advisorStatusSchema = z.enum(["draft", "published", "suspended"]);

export const advisorSettingsSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(80),
  title: z.string().trim().max(60).optional().or(z.literal("")),
  phone: phoneSchema.optional(),
  phoneDisplay: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email.").optional().or(z.literal("")),
  bio: z.string().trim().max(600).optional().or(z.literal("")),
  location: z.string().trim().max(80).optional().or(z.literal("")),
  status: advisorStatusSchema.default("published"),
  preferredTheme: advisorThemeSchema.default("light"),
  defaultLocale: contentLocaleSchema.default("en"),
  allowLanguageToggle: z.boolean().default(true),
  allowThemeToggle: z.boolean().default(true),
});

/** Website copy values are plain text; length is bounded per field by the registry. */
export const contentValueSchema = z.string().max(2000, "This text is too long.").default("");

export function formBoolean(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true" || value === "1";
}

export type AdvisorRegisterInput = z.infer<typeof advisorRegisterSchema>;
export type AdvisorUpdateInput = z.infer<typeof advisorUpdateSchema>;
export type EnquiryInput = z.infer<typeof enquirySchema>;
export type LeadInput = z.infer<typeof leadSchema>;
export type AdvisorSettingsInput = z.infer<typeof advisorSettingsSchema>;
