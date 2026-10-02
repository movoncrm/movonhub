import { getStore } from "@/lib/db";
import type { Product, ProductCategory, Promotion } from "@/lib/types";
import { isExpired, isUpcoming } from "@/lib/utils";

export interface CatalogueCategory {
  category: ProductCategory;
  products: Product[];
}

export async function getCatalogue(): Promise<CatalogueCategory[]> {
  const store = getStore();
  const [categories, products] = await Promise.all([
    store.listCategories(),
    store.listProducts({ status: "active" }),
  ]);
  return categories
    .map((category) => ({
      category,
      products: products.filter((p) => p.categoryId === category.id),
    }))
    .filter((entry) => entry.products.length > 0);
}

export async function getProductDetail(slug: string) {
  const store = getStore();
  const product = await store.getProductBySlug(slug);
  if (!product || product.status !== "active") return null;
  const category = (await store.listCategories()).find((c) => c.id === product.categoryId) ?? null;
  const related = (await store.listProducts({ status: "active" }))
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 3);
  return { product, category, related };
}

/** Promotions that are active AND within their date window. */
export async function getActivePromotions(): Promise<Promotion[]> {
  const store = getStore();
  const all = await store.listPromotions();
  return all.filter((p) => p.active && !isExpired(p.endDate) && !isUpcoming(p.startDate));
}

export async function getPromotionProductMap(): Promise<Map<string, Product[]>> {
  const [promotions, products] = await Promise.all([
    getActivePromotions(),
    getStore().listProducts({ status: "active" }),
  ]);
  const map = new Map<string, Product[]>();
  for (const promo of promotions) {
    map.set(
      promo.id,
      promo.productIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p)),
    );
  }
  return map;
}
