import type {
  Advisor,
  AuditLog,
  ContentLocale,
  ContentScope,
  Enquiry,
  Lead,
  PlatformSettings,
  Product,
  ProductCategory,
  ProductStatus,
  Promotion,
  SiteContent,
} from "@/lib/types";

export interface DataStore {
  listAdvisors(opts?: { activeOnly?: boolean }): Promise<Advisor[]>;
  getAdvisorBySlug(slug: string): Promise<Advisor | null>;
  getAdvisorById(id: string): Promise<Advisor | null>;
  createAdvisor(data: Omit<Advisor, "id" | "createdAt" | "updatedAt">): Promise<Advisor>;
  updateAdvisor(id: string, patch: Partial<Advisor>): Promise<Advisor | null>;
  deleteAdvisor(id: string): Promise<boolean>;

  listCategories(): Promise<ProductCategory[]>;
  listProducts(opts?: { status?: ProductStatus | "all" }): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | null>;
  getProductById(id: string): Promise<Product | null>;
  createProduct(data: Omit<Product, "id" | "updatedAt">): Promise<Product>;
  updateProduct(id: string, patch: Partial<Product>): Promise<Product | null>;
  deleteProduct(id: string): Promise<boolean>;

  listPromotions(): Promise<Promotion[]>;
  getPromotionById(id: string): Promise<Promotion | null>;
  createPromotion(data: Omit<Promotion, "id" | "createdAt">): Promise<Promotion>;
  updatePromotion(id: string, patch: Partial<Promotion>): Promise<Promotion | null>;
  deletePromotion(id: string): Promise<boolean>;

  listEnquiries(opts?: { advisorId?: string }): Promise<Enquiry[]>;
  createEnquiry(data: Omit<Enquiry, "id" | "createdAt">): Promise<Enquiry>;

  /** Per-advisor leads. Always scoped by advisorId; never expose across owners. */
  listLeads(opts: { advisorId: string }): Promise<Lead[]>;
  getLeadById(id: string): Promise<Lead | null>;
  createLead(data: Omit<Lead, "id" | "createdAt">): Promise<Lead>;
  updateLead(id: string, patch: Partial<Lead>): Promise<Lead | null>;
  deleteLead(id: string): Promise<boolean>;

  getSettings(): Promise<PlatformSettings>;
  updateSettings(patch: Partial<PlatformSettings>): Promise<PlatformSettings>;

  /** Editable website copy for the main site and SA microsites. */
  listSiteContent(opts?: { scope?: ContentScope; advisorId?: string | null }): Promise<SiteContent[]>;
  upsertSiteContent(input: Omit<SiteContent, "id" | "updatedAt">): Promise<SiteContent>;
  deleteSiteContent(opts: {
    scope: ContentScope;
    advisorId?: string | null;
    contentKey?: string;
    locale?: ContentLocale;
  }): Promise<void>;

  /** Append-only audit trail for sensitive operations. */
  createAuditLog(input: Omit<AuditLog, "id" | "createdAt">): Promise<AuditLog>;
  listAuditLogs(limit?: number): Promise<AuditLog[]>;

  /**
   * Durable, cross-instance rate limiter. Returns false when the limit is
   * exceeded. The Supabase adapter uses an atomic SQL function; the local
   * adapter uses an in-memory fixed window (development only).
   */
  consumeRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean>;
}
