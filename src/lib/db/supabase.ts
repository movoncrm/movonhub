import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  Advisor,
  AuditLog,
  ContentLocale,
  ContentScope,
  Enquiry,
  PlatformSettings,
  Product,
  ProductCategory,
  ProductStatus,
  Promotion,
  SiteContent,
} from "@/lib/types";
import { newId, nowISO } from "@/lib/id";
import type { DataStore } from "./store";

/**
 * Server-side Supabase adapter. Uses the service role key because all writes
 * happen behind server-side authorisation checks. Never import this in client code.
 */

let client: SupabaseClient | null = null;

function sb(): SupabaseClient {
  if (client) return client;
  // Prefer the runtime-only SUPABASE_URL (not inlined at build time). Fall back
  // to NEXT_PUBLIC_SUPABASE_URL for local development.
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase adapter selected but SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) / SUPABASE_SERVICE_ROLE_KEY are not set.",
    );
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

/* ----------------------------- mappers ---------------------------------- */

type Row = Record<string, unknown>;

function advisorFromRow(r: Row): Advisor {
  return {
    id: String(r.id),
    slug: String(r.slug),
    name: String(r.name),
    title: String(r.title ?? "MOVON Star Advisor"),
    phone: String(r.phone ?? ""),
    phoneDisplay: String(r.phone_display ?? r.phone ?? ""),
    email: (r.email as string) || undefined,
    photoUrl: (r.photo_url as string) || undefined,
    bio: (r.bio as string) || undefined,
    location: (r.location as string) || undefined,
    whatsappName: (r.whatsapp_name as string) || undefined,
    greeting: (r.greeting as string) || undefined,
    accent: (r.accent as string) || undefined,
    socials: (r.socials as Advisor["socials"]) ?? {},
    passwordHash: String(r.password_hash ?? ""),
    active: Boolean(r.active),
    featured: Boolean(r.featured),
    status: (r.status as Advisor["status"]) ?? (r.active ? "published" : "draft"),
    preferredTheme: (r.preferred_theme as Advisor["preferredTheme"]) ?? "light",
    defaultLocale: (r.default_locale as Advisor["defaultLocale"]) ?? "en",
    allowLanguageToggle: r.allow_language_toggle === undefined ? true : Boolean(r.allow_language_toggle),
    allowThemeToggle: r.allow_theme_toggle === undefined ? true : Boolean(r.allow_theme_toggle),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

function advisorToRow(a: Partial<Advisor>): Row {
  const row: Row = {};
  if (a.slug !== undefined) row.slug = a.slug;
  if (a.name !== undefined) row.name = a.name;
  if (a.title !== undefined) row.title = a.title;
  if (a.phone !== undefined) row.phone = a.phone;
  if (a.phoneDisplay !== undefined) row.phone_display = a.phoneDisplay;
  if (a.email !== undefined) row.email = a.email || null;
  if (a.photoUrl !== undefined) row.photo_url = a.photoUrl || null;
  if (a.bio !== undefined) row.bio = a.bio || null;
  if (a.location !== undefined) row.location = a.location || null;
  if (a.whatsappName !== undefined) row.whatsapp_name = a.whatsappName || null;
  if (a.greeting !== undefined) row.greeting = a.greeting || null;
  if (a.accent !== undefined) row.accent = a.accent || null;
  if (a.socials !== undefined) row.socials = a.socials;
  if (a.passwordHash !== undefined) row.password_hash = a.passwordHash;
  if (a.active !== undefined) row.active = a.active;
  if (a.featured !== undefined) row.featured = a.featured;
  if (a.status !== undefined) row.status = a.status;
  if (a.preferredTheme !== undefined) row.preferred_theme = a.preferredTheme;
  if (a.defaultLocale !== undefined) row.default_locale = a.defaultLocale;
  if (a.allowLanguageToggle !== undefined) row.allow_language_toggle = a.allowLanguageToggle;
  if (a.allowThemeToggle !== undefined) row.allow_theme_toggle = a.allowThemeToggle;
  return row;
}

function productFromRow(r: Row): Product {
  return {
    id: String(r.id),
    slug: String(r.slug),
    name: String(r.name),
    categoryId: String(r.category_id),
    series: (r.series as string) || undefined,
    model: (r.model as string) || undefined,
    imageUrl: (r.image_url as string) || undefined,
    shortDescription: String(r.short_description ?? ""),
    fullDescription: (r.full_description as string) || undefined,
    features: (r.features as string[]) ?? [],
    specifications: (r.specifications as Record<string, string>) ?? {},
    rentalPlans: (r.rental_plans as Product["rentalPlans"]) ?? [],
    outrightPrice: (r.outright_price as number) ?? undefined,
    warranty: (r.warranty as string) || undefined,
    installation: (r.installation as string) || undefined,
    status: r.status as ProductStatus,
    sourceUrl: (r.source_url as string) || undefined,
    sortOrder: Number(r.sort_order ?? 0),
    updatedAt: String(r.updated_at),
  };
}

function productToRow(p: Partial<Product>): Row {
  const row: Row = {};
  if (p.slug !== undefined) row.slug = p.slug;
  if (p.name !== undefined) row.name = p.name;
  if (p.categoryId !== undefined) row.category_id = p.categoryId;
  if (p.series !== undefined) row.series = p.series || null;
  if (p.model !== undefined) row.model = p.model || null;
  if (p.imageUrl !== undefined) row.image_url = p.imageUrl || null;
  if (p.shortDescription !== undefined) row.short_description = p.shortDescription;
  if (p.fullDescription !== undefined) row.full_description = p.fullDescription || null;
  if (p.features !== undefined) row.features = p.features;
  if (p.specifications !== undefined) row.specifications = p.specifications;
  if (p.rentalPlans !== undefined) row.rental_plans = p.rentalPlans;
  if (p.outrightPrice !== undefined) row.outright_price = p.outrightPrice ?? null;
  if (p.warranty !== undefined) row.warranty = p.warranty || null;
  if (p.installation !== undefined) row.installation = p.installation || null;
  if (p.status !== undefined) row.status = p.status;
  if (p.sourceUrl !== undefined) row.source_url = p.sourceUrl || null;
  if (p.sortOrder !== undefined) row.sort_order = p.sortOrder;
  row.updated_at = nowISO();
  return row;
}

function promotionFromRow(r: Row): Promotion {
  return {
    id: String(r.id),
    title: String(r.title),
    description: String(r.description ?? ""),
    startDate: String(r.start_date ?? ""),
    endDate: (r.end_date as string) || undefined,
    productIds: (r.product_ids as string[]) ?? [],
    terms: (r.terms as string) || undefined,
    active: Boolean(r.active),
    sourceUrl: (r.source_url as string) || undefined,
    createdAt: String(r.created_at),
  };
}

function enquiryFromRow(r: Row): Enquiry {
  return {
    id: String(r.id),
    advisorId: (r.advisor_id as string) || undefined,
    advisorSlug: (r.advisor_slug as string) || undefined,
    customerName: (r.customer_name as string) || undefined,
    customerPhone: (r.customer_phone as string) || undefined,
    productInterest: (r.product_interest as string) || undefined,
    sourcePage: (r.source_page as string) || undefined,
    channel: String(r.channel ?? "whatsapp"),
    message: (r.message as string) || undefined,
    status: (r.status as Enquiry["status"]) ?? "new",
    createdAt: String(r.created_at),
  };
}

function siteContentFromRow(r: Row): SiteContent {
  return {
    id: String(r.id),
    scope: r.scope as ContentScope,
    advisorId: (r.advisor_id as string) || undefined,
    contentKey: String(r.content_key),
    locale: r.locale as ContentLocale,
    value: String(r.value ?? ""),
    status: (r.status as SiteContent["status"]) ?? "draft",
    updatedBy: (r.updated_by as string) || undefined,
    updatedAt: String(r.updated_at),
  };
}

function auditFromRow(r: Row): AuditLog {
  return {
    id: String(r.id),
    actorId: String(r.actor_id),
    actorRole: String(r.actor_role),
    action: String(r.action),
    targetType: (r.target_type as string) || undefined,
    targetId: (r.target_id as string) || undefined,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    createdAt: String(r.created_at),
  };
}

/* ----------------------------- store ------------------------------------ */

export class SupabaseStore implements DataStore {
  async listAdvisors(opts?: { activeOnly?: boolean }): Promise<Advisor[]> {
    let q = sb().from("advisors").select("*").order("name");
    if (opts?.activeOnly) q = q.eq("active", true);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(advisorFromRow);
  }

  async getAdvisorBySlug(slug: string): Promise<Advisor | null> {
    const { data, error } = await sb()
      .from("advisors")
      .select("*")
      .eq("slug", slug.toLowerCase())
      .maybeSingle();
    if (error) throw error;
    return data ? advisorFromRow(data) : null;
  }

  async getAdvisorById(id: string): Promise<Advisor | null> {
    const { data, error } = await sb().from("advisors").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? advisorFromRow(data) : null;
  }

  async createAdvisor(input: Omit<Advisor, "id" | "createdAt" | "updatedAt">): Promise<Advisor> {
    const { data, error } = await sb()
      .from("advisors")
      .insert(advisorToRow(input))
      .select("*")
      .single();
    if (error) throw error;
    return advisorFromRow(data);
  }

  async updateAdvisor(id: string, patch: Partial<Advisor>): Promise<Advisor | null> {
    const { data, error } = await sb()
      .from("advisors")
      .update({ ...advisorToRow(patch), updated_at: nowISO() })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data ? advisorFromRow(data) : null;
  }

  async deleteAdvisor(id: string): Promise<boolean> {
    const { error } = await sb().from("advisors").delete().eq("id", id);
    if (error) throw error;
    return true;
  }

  async listCategories(): Promise<ProductCategory[]> {
    const { data, error } = await sb().from("categories").select("*").order("sort_order");
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: String(r.id),
      slug: String(r.slug),
      name: String(r.name),
      description: (r.description as string) || undefined,
      icon: (r.icon as string) || undefined,
      sortOrder: Number(r.sort_order ?? 0),
    }));
  }

  async listProducts(opts?: { status?: ProductStatus | "all" }): Promise<Product[]> {
    const status = opts?.status ?? "active";
    let q = sb().from("products").select("*").order("sort_order");
    if (status !== "all") q = q.eq("status", status);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(productFromRow);
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const { data, error } = await sb().from("products").select("*").eq("slug", slug).maybeSingle();
    if (error) throw error;
    return data ? productFromRow(data) : null;
  }

  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await sb().from("products").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? productFromRow(data) : null;
  }

  async createProduct(data: Omit<Product, "id" | "updatedAt">): Promise<Product> {
    const { data: row, error } = await sb()
      .from("products")
      .insert(productToRow(data))
      .select("*")
      .single();
    if (error) throw error;
    return productFromRow(row);
  }

  async updateProduct(id: string, patch: Partial<Product>): Promise<Product | null> {
    const { data, error } = await sb().from("products").update(productToRow(patch)).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    return data ? productFromRow(data) : null;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const { error } = await sb().from("products").delete().eq("id", id);
    if (error) throw error;
    return true;
  }

  async listPromotions(): Promise<Promotion[]> {
    const { data, error } = await sb().from("promotions").select("*").order("start_date", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(promotionFromRow);
  }

  async getPromotionById(id: string): Promise<Promotion | null> {
    const { data, error } = await sb().from("promotions").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? promotionFromRow(data) : null;
  }

  async createPromotion(data: Omit<Promotion, "id" | "createdAt">): Promise<Promotion> {
    const { data: row, error } = await sb()
      .from("promotions")
      .insert({
        title: data.title,
        description: data.description,
        start_date: data.startDate,
        end_date: data.endDate || null,
        product_ids: data.productIds,
        terms: data.terms || null,
        active: data.active,
        source_url: data.sourceUrl || null,
      })
      .select("*")
      .single();
    if (error) throw error;
    return promotionFromRow(row);
  }

  async updatePromotion(id: string, patch: Partial<Promotion>): Promise<Promotion | null> {
    const row: Row = {};
    if (patch.title !== undefined) row.title = patch.title;
    if (patch.description !== undefined) row.description = patch.description;
    if (patch.startDate !== undefined) row.start_date = patch.startDate;
    if (patch.endDate !== undefined) row.end_date = patch.endDate || null;
    if (patch.productIds !== undefined) row.product_ids = patch.productIds;
    if (patch.terms !== undefined) row.terms = patch.terms || null;
    if (patch.active !== undefined) row.active = patch.active;
    if (patch.sourceUrl !== undefined) row.source_url = patch.sourceUrl || null;
    const { data, error } = await sb().from("promotions").update(row).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    return data ? promotionFromRow(data) : null;
  }

  async deletePromotion(id: string): Promise<boolean> {
    const { error } = await sb().from("promotions").delete().eq("id", id);
    if (error) throw error;
    return true;
  }

  async listEnquiries(opts?: { advisorId?: string }): Promise<Enquiry[]> {
    let q = sb().from("enquiries").select("*").order("created_at", { ascending: false });
    if (opts?.advisorId) q = q.eq("advisor_id", opts.advisorId);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(enquiryFromRow);
  }

  async createEnquiry(data: Omit<Enquiry, "id" | "createdAt">): Promise<Enquiry> {
    const { data: row, error } = await sb()
      .from("enquiries")
      .insert({
        id: newId(),
        advisor_id: data.advisorId || null,
        advisor_slug: data.advisorSlug || null,
        customer_name: data.customerName || null,
        customer_phone: data.customerPhone || null,
        product_interest: data.productInterest || null,
        source_page: data.sourcePage || null,
        channel: data.channel,
        message: data.message || null,
        status: data.status,
      })
      .select("*")
      .single();
    if (error) throw error;
    return enquiryFromRow(row);
  }

  async getSettings(): Promise<PlatformSettings> {
    const { data, error } = await sb().from("settings").select("*").eq("id", "platform").maybeSingle();
    if (error) throw error;
    return {
      featuredAdvisorSlugs: (data?.featured_advisor_slugs as string[]) ?? [],
      tools: (data?.tools as PlatformSettings["tools"]) ?? [],
    };
  }

  async updateSettings(patch: Partial<PlatformSettings>): Promise<PlatformSettings> {
    const current = await this.getSettings();
    const next: PlatformSettings = { ...current, ...patch };
    const { error } = await sb()
      .from("settings")
      .upsert({ id: "platform", featured_advisor_slugs: next.featuredAdvisorSlugs, tools: next.tools });
    if (error) throw error;
    return next;
  }

  async listSiteContent(opts?: { scope?: ContentScope; advisorId?: string | null }): Promise<SiteContent[]> {
    let q = sb().from("site_content").select("*");
    if (opts?.scope) q = q.eq("scope", opts.scope);
    if (opts && "advisorId" in opts && opts.advisorId !== undefined) {
      q = opts.advisorId === null ? q.is("advisor_id", null) : q.eq("advisor_id", opts.advisorId);
    }
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(siteContentFromRow);
  }

  async upsertSiteContent(input: Omit<SiteContent, "id" | "updatedAt">): Promise<SiteContent> {
    const advisorId = input.advisorId ?? null;
    let existing = sb()
      .from("site_content")
      .select("id")
      .eq("scope", input.scope)
      .eq("content_key", input.contentKey)
      .eq("locale", input.locale);
    existing = advisorId === null ? existing.is("advisor_id", null) : existing.eq("advisor_id", advisorId);
    const { data: found, error: findError } = await existing.maybeSingle();
    if (findError) throw findError;

    const row: Row = {
      scope: input.scope,
      advisor_id: advisorId,
      content_key: input.contentKey,
      locale: input.locale,
      value: input.value,
      status: input.status,
      updated_by: input.updatedBy ?? null,
      updated_at: nowISO(),
    };

    if (found?.id) {
      const { data, error } = await sb()
        .from("site_content")
        .update(row)
        .eq("id", found.id)
        .select("*")
        .single();
      if (error) throw error;
      return siteContentFromRow(data);
    }
    const { data, error } = await sb().from("site_content").insert(row).select("*").single();
    if (error) throw error;
    return siteContentFromRow(data);
  }

  async deleteSiteContent(opts: {
    scope: ContentScope;
    advisorId?: string | null;
    contentKey?: string;
    locale?: ContentLocale;
  }): Promise<void> {
    const advisorId = opts.advisorId ?? null;
    let q = sb().from("site_content").delete().eq("scope", opts.scope);
    q = advisorId === null ? q.is("advisor_id", null) : q.eq("advisor_id", advisorId);
    if (opts.contentKey) q = q.eq("content_key", opts.contentKey);
    if (opts.locale) q = q.eq("locale", opts.locale);
    const { error } = await q;
    if (error) throw error;
  }

  async createAuditLog(input: Omit<AuditLog, "id" | "createdAt">): Promise<AuditLog> {
    const { data, error } = await sb()
      .from("audit_logs")
      .insert({
        actor_id: input.actorId,
        actor_role: input.actorRole,
        action: input.action,
        target_type: input.targetType ?? null,
        target_id: input.targetId ?? null,
        metadata: input.metadata ?? {},
      })
      .select("*")
      .single();
    if (error) throw error;
    return auditFromRow(data);
  }

  async listAuditLogs(limit = 100): Promise<AuditLog[]> {
    const { data, error } = await sb()
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map(auditFromRow);
  }

  async consumeRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    const { data, error } = await sb().rpc("consume_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) throw error;
    return Boolean(data);
  }
}
