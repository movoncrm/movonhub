import type {
  Advisor,
  Enquiry,
  PlatformSettings,
  Product,
  ProductCategory,
  ProductStatus,
  Promotion,
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

  getSettings(): Promise<PlatformSettings>;
  updateSettings(patch: Partial<PlatformSettings>): Promise<PlatformSettings>;
}
