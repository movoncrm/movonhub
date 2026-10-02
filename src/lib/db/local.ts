import { promises as fs } from "fs";
import path from "path";
import type {
  Advisor,
  AuditLog,
  ContentLocale,
  ContentScope,
  DatabaseShape,
  Enquiry,
  PlatformSettings,
  Product,
  ProductStatus,
  Promotion,
  SiteContent,
} from "@/lib/types";
import { newId, nowISO } from "@/lib/id";
import { buildSeed } from "@/data/seed";
import type { DataStore } from "./store";

const DB_PATH = path.join(process.cwd(), "src", "data", "db.json");

let cache: DatabaseShape | null = null;
let writeQueue: Promise<void> = Promise.resolve();

/** Older db.json files predate the content/audit tables; tolerate their absence. */
function normalise(db: DatabaseShape): DatabaseShape {
  if (!Array.isArray(db.siteContent)) db.siteContent = [];
  if (!Array.isArray(db.auditLogs)) db.auditLogs = [];
  return db;
}

async function load(): Promise<DatabaseShape> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    cache = normalise(JSON.parse(raw) as DatabaseShape);
  } catch {
    cache = normalise(buildSeed());
    await persist(cache);
  }
  return cache;
}

function persist(data: DatabaseShape): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    const tmp = `${DB_PATH}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
    await fs.rename(tmp, DB_PATH);
  });
  return writeQueue;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class LocalStore implements DataStore {
  async listAdvisors(opts?: { activeOnly?: boolean }): Promise<Advisor[]> {
    const db = await load();
    const list = opts?.activeOnly ? db.advisors.filter((a) => a.active) : db.advisors;
    return clone(list).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getAdvisorBySlug(slug: string): Promise<Advisor | null> {
    const db = await load();
    const found = db.advisors.find((a) => a.slug === slug.toLowerCase());
    return found ? clone(found) : null;
  }

  async getAdvisorById(id: string): Promise<Advisor | null> {
    const db = await load();
    const found = db.advisors.find((a) => a.id === id);
    return found ? clone(found) : null;
  }

  async createAdvisor(data: Omit<Advisor, "id" | "createdAt" | "updatedAt">): Promise<Advisor> {
    const db = await load();
    const record: Advisor = { ...data, id: newId(), createdAt: nowISO(), updatedAt: nowISO() };
    db.advisors.push(record);
    await persist(db);
    return clone(record);
  }

  async updateAdvisor(id: string, patch: Partial<Advisor>): Promise<Advisor | null> {
    const db = await load();
    const idx = db.advisors.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    const next: Advisor = { ...db.advisors[idx], ...patch, id, updatedAt: nowISO() };
    db.advisors[idx] = next;
    await persist(db);
    return clone(next);
  }

  async deleteAdvisor(id: string): Promise<boolean> {
    const db = await load();
    const idx = db.advisors.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    db.advisors.splice(idx, 1);
    await persist(db);
    return true;
  }

  async listCategories() {
    const db = await load();
    return clone(db.categories).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async listProducts(opts?: { status?: ProductStatus | "all" }): Promise<Product[]> {
    const db = await load();
    const status = opts?.status ?? "active";
    const list = status === "all" ? db.products : db.products.filter((p) => p.status === status);
    return clone(list).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const db = await load();
    const found = db.products.find((p) => p.slug === slug);
    return found ? clone(found) : null;
  }

  async getProductById(id: string): Promise<Product | null> {
    const db = await load();
    const found = db.products.find((p) => p.id === id);
    return found ? clone(found) : null;
  }

  async createProduct(data: Omit<Product, "id" | "updatedAt">): Promise<Product> {
    const db = await load();
    const record: Product = { ...data, id: newId(), updatedAt: nowISO() };
    db.products.push(record);
    await persist(db);
    return clone(record);
  }

  async updateProduct(id: string, patch: Partial<Product>): Promise<Product | null> {
    const db = await load();
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const next: Product = { ...db.products[idx], ...patch, id, updatedAt: nowISO() };
    db.products[idx] = next;
    await persist(db);
    return clone(next);
  }

  async deleteProduct(id: string): Promise<boolean> {
    const db = await load();
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    db.products.splice(idx, 1);
    await persist(db);
    return true;
  }

  async listPromotions(): Promise<Promotion[]> {
    const db = await load();
    return clone(db.promotions).sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
  }

  async getPromotionById(id: string): Promise<Promotion | null> {
    const db = await load();
    const found = db.promotions.find((p) => p.id === id);
    return found ? clone(found) : null;
  }

  async createPromotion(data: Omit<Promotion, "id" | "createdAt">): Promise<Promotion> {
    const db = await load();
    const record: Promotion = { ...data, id: newId(), createdAt: nowISO() };
    db.promotions.push(record);
    await persist(db);
    return clone(record);
  }

  async updatePromotion(id: string, patch: Partial<Promotion>): Promise<Promotion | null> {
    const db = await load();
    const idx = db.promotions.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const next: Promotion = { ...db.promotions[idx], ...patch, id };
    db.promotions[idx] = next;
    await persist(db);
    return clone(next);
  }

  async deletePromotion(id: string): Promise<boolean> {
    const db = await load();
    const idx = db.promotions.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    db.promotions.splice(idx, 1);
    await persist(db);
    return true;
  }

  async listEnquiries(opts?: { advisorId?: string }): Promise<Enquiry[]> {
    const db = await load();
    const list = opts?.advisorId
      ? db.enquiries.filter((e) => e.advisorId === opts.advisorId)
      : db.enquiries;
    return clone(list).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async createEnquiry(data: Omit<Enquiry, "id" | "createdAt">): Promise<Enquiry> {
    const db = await load();
    const record: Enquiry = { ...data, id: newId(), createdAt: nowISO() };
    db.enquiries.push(record);
    await persist(db);
    return clone(record);
  }

  async getSettings(): Promise<PlatformSettings> {
    const db = await load();
    return clone(db.settings);
  }

  async updateSettings(patch: Partial<PlatformSettings>): Promise<PlatformSettings> {
    const db = await load();
    db.settings = { ...db.settings, ...patch };
    await persist(db);
    return clone(db.settings);
  }

  async listSiteContent(opts?: { scope?: ContentScope; advisorId?: string | null }): Promise<SiteContent[]> {
    const db = await load();
    let list = db.siteContent;
    if (opts?.scope) list = list.filter((row) => row.scope === opts.scope);
    if (opts && "advisorId" in opts && opts.advisorId !== undefined) {
      list = list.filter((row) => (row.advisorId ?? null) === (opts.advisorId ?? null));
    }
    return clone(list);
  }

  async upsertSiteContent(input: Omit<SiteContent, "id" | "updatedAt">): Promise<SiteContent> {
    const db = await load();
    const advisorId = input.advisorId ?? null;
    const idx = db.siteContent.findIndex(
      (row) =>
        row.scope === input.scope &&
        (row.advisorId ?? null) === advisorId &&
        row.contentKey === input.contentKey &&
        row.locale === input.locale,
    );
    if (idx >= 0) {
      const next: SiteContent = { ...db.siteContent[idx], ...input, updatedAt: nowISO() };
      db.siteContent[idx] = next;
      await persist(db);
      return clone(next);
    }
    const record: SiteContent = { ...input, id: newId(), updatedAt: nowISO() };
    db.siteContent.push(record);
    await persist(db);
    return clone(record);
  }

  async deleteSiteContent(opts: {
    scope: ContentScope;
    advisorId?: string | null;
    contentKey?: string;
    locale?: ContentLocale;
  }): Promise<void> {
    const db = await load();
    const advisorId = opts.advisorId ?? null;
    db.siteContent = db.siteContent.filter((row) => {
      if (row.scope !== opts.scope) return true;
      if ((row.advisorId ?? null) !== advisorId) return true;
      if (opts.contentKey && row.contentKey !== opts.contentKey) return true;
      if (opts.locale && row.locale !== opts.locale) return true;
      return false;
    });
    await persist(db);
  }

  async createAuditLog(input: Omit<AuditLog, "id" | "createdAt">): Promise<AuditLog> {
    const db = await load();
    const record: AuditLog = { ...input, id: newId(), createdAt: nowISO() };
    db.auditLogs.push(record);
    await persist(db);
    return clone(record);
  }

  async listAuditLogs(limit = 100): Promise<AuditLog[]> {
    const db = await load();
    return clone(db.auditLogs).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, limit);
  }

  async consumeRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const bucket = localBuckets.get(key);
    if (!bucket || bucket.resetAt < now) {
      localBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (bucket.count >= limit) return false;
    bucket.count += 1;
    return true;
  }
}

/** In-memory fallback used by the local adapter (development only). */
const localBuckets = new Map<string, { count: number; resetAt: number }>();
