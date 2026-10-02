import { promises as fs } from "fs";
import path from "path";
import type {
  Advisor,
  DatabaseShape,
  Enquiry,
  PlatformSettings,
  Product,
  ProductStatus,
  Promotion,
} from "@/lib/types";
import { newId, nowISO } from "@/lib/id";
import { buildSeed } from "@/data/seed";
import type { DataStore } from "./store";

const DB_PATH = path.join(process.cwd(), "src", "data", "db.json");

let cache: DatabaseShape | null = null;
let writeQueue: Promise<void> = Promise.resolve();

async function load(): Promise<DatabaseShape> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    cache = JSON.parse(raw) as DatabaseShape;
  } catch {
    cache = buildSeed();
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
}
