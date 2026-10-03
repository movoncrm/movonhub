export type Role = "advisor" | "admin";

export type ContentLocale = "en" | "ms";
export type ContentScope = "site" | "sa_global" | "sa";
export type ContentStatus = "draft" | "published";

export interface SiteContent {
  id: string;
  scope: ContentScope;
  advisorId?: string;
  contentKey: string;
  locale: ContentLocale;
  value: string;
  status: ContentStatus;
  updatedBy?: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface SessionUser {
  id: string;
  role: Role;
  advisorId?: string;
  slug?: string;
  name: string;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  website?: string;
}

export type AdvisorStatus = "draft" | "published" | "suspended";
export type AdvisorTheme = "light" | "dark";

export interface Advisor {
  id: string;
  slug: string;
  name: string;
  title: string;
  phone: string;
  phoneDisplay: string;
  email?: string;
  photoUrl?: string;
  bio?: string;
  location?: string;
  whatsappName?: string;
  greeting?: string;
  accent?: string;
  socials?: SocialLinks;
  passwordHash: string;
  /** Kept in sync with `status` for backward compatibility (published === active). */
  active: boolean;
  featured: boolean;
  status: AdvisorStatus;
  preferredTheme?: AdvisorTheme;
  /** Default microsite language for first-time visitors. */
  defaultLocale?: ContentLocale;
  /** Whether visitors may switch language on the microsite. */
  allowLanguageToggle?: boolean;
  /** Whether visitors may switch theme on the microsite. */
  allowThemeToggle?: boolean;
  createdAt: string;
  updatedAt: string;
}

export function isAdvisorPublic(advisor: Pick<Advisor, "status" | "active">): boolean {
  return advisor.status === "published" && advisor.active;
}

export type AdvisorPublic = Omit<Advisor, "passwordHash" | "email"> & {
  email?: string;
};

export interface ProductCategory {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  sortOrder: number;
}

export interface RentalPlan {
  label: string;
  monthlyPrice: number;
  tenureMonths?: number;
  note?: string;
}

export type ProductStatus = "active" | "draft" | "archived";

export interface Product {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  series?: string;
  model?: string;
  imageUrl?: string;
  shortDescription: string;
  fullDescription?: string;
  features: string[];
  specifications: Record<string, string>;
  rentalPlans: RentalPlan[];
  outrightPrice?: number;
  warranty?: string;
  installation?: string;
  status: ProductStatus;
  sourceUrl?: string;
  /** Traceability to the Phase 5 source document + page/section. */
  sourceRef?: string;
  sortOrder: number;
  updatedAt: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  productIds: string[];
  terms?: string;
  active: boolean;
  sourceUrl?: string;
  createdAt: string;
}

export interface Enquiry {
  id: string;
  advisorId?: string;
  advisorSlug?: string;
  customerName?: string;
  customerPhone?: string;
  productInterest?: string;
  sourcePage?: string;
  channel: string;
  message?: string;
  status: "new" | "contacted" | "won" | "lost";
  createdAt: string;
}

/**
 * Lead pipeline statuses. Only NET counts toward incentive / commission.
 * The set is a superset of the business' existing X REPLY / X LULUS / X MINAT
 * language; mapping is provisional pending MOVONHUB confirmation.
 */
export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "NO_REPLY"
  | "INTERESTED"
  | "FORM"
  | "QUALIFIED"
  | "NET"
  | "REJECTED"
  | "CANCELLED";

export type LeadPlanType = "outright" | "rental";

/** Incentive-relevant product category (Star Advisor scheme). */
export type LeadCategory = "space" | "baby" | "choice" | "cuckoo" | "vacuum" | "other";

/** Promotion flags that change unit-count rules. */
export type LeadPromotion = "none" | "rm12" | "samsung" | "joy_pack";

export interface Lead {
  id: string;
  advisorId: string;
  customerName?: string;
  /** Contact exactly as captured (raw). */
  contactRaw?: string;
  /** Normalised Malaysian number in 60XXXXXXXXX form. */
  contactNormalized?: string;
  whatsappLink?: string;
  status: LeadStatus;
  planType: LeadPlanType;
  category: LeadCategory;
  /** MOVON + CUCKOO pair under a Duo sale. */
  isDuo: boolean;
  promotion: LeadPromotion;
  proxyOwner?: string;
  location?: string;
  productInterest?: string;
  productId?: string;
  remarks?: string;
  createdAt: string;
  lastFollowUpAt?: string;
  /** Set when the sale reaches NET (installation or delivery). */
  netDate?: string;
  /** Derived from netDate as YYYY-MM. */
  incentiveMonth?: string;
}

export interface PlatformSettings {
  featuredAdvisorSlugs: string[];
  tools: ToolDefinition[];
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  href?: string;
  status: "live" | "coming-soon";
  icon: string;
}

export interface DatabaseShape {
  advisors: Advisor[];
  categories: ProductCategory[];
  products: Product[];
  promotions: Promotion[];
  enquiries: Enquiry[];
  leads: Lead[];
  settings: PlatformSettings;
  siteContent: SiteContent[];
  auditLogs: AuditLog[];
}
