import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ProductCard } from "@/components/catalogue/ProductCard";
import { getCatalogue } from "@/lib/services/catalogue";
import { getI18n } from "@/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t("products.title"),
    description: t("products.body"),
    alternates: { canonical: "/products" },
  };
}

export default async function ProductsPage() {
  const [{ t }, catalogue] = await Promise.all([getI18n(), getCatalogue()]);

  return (
    <div className="pb-8">
      <div className="border-b border-borderline bg-background">
        <div className="container-page py-14">
          <SectionHeading
            eyebrow={t("products.eyebrow")}
            title={t("products.title")}
            description={t("products.body")}
          />
          <nav className="mt-8 flex flex-wrap gap-2">
            {catalogue.map(({ category }) => (
              <Link
                key={category.id}
                href={`#${category.slug}`}
                className="rounded-full border border-borderline bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {catalogue.length === 0 && (
        <div className="container-page py-20 text-center text-muted">{t("products.empty")}</div>
      )}

      {catalogue.map(({ category, products }) => (
        <section key={category.id} id={category.slug} className="section scroll-mt-20">
          <div className="container-page">
            <SectionHeading
              eyebrow={`${products.length} ${products.length === 1 ? t("products.productSingular") : t("products.productPlural")}`}
              title={category.name}
              description={category.description}
            />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
