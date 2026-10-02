import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ProductCard } from "@/components/catalogue/ProductCard";
import { getProductDetail } from "@/lib/services/catalogue";
import { getI18n } from "@/i18n/server";
import { formatRM, truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getProductDetail(slug);
  if (!detail) return { title: "Product not found" };
  const { product } = detail;
  return {
    title: product.name,
    description: truncate(product.shortDescription, 160),
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description: truncate(product.shortDescription, 200),
      images: product.imageUrl ? [{ url: product.imageUrl }] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [{ t }, detail] = await Promise.all([getI18n(), getProductDetail(slug)]);
  if (!detail) notFound();
  const { product, category, related } = detail;

  return (
    <div className="container-page py-10">
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> {t("product.back")}
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-3xl border border-borderline bg-background">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain p-10"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">{t("common.noImage")}</div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {category && (
              <Link href={`/products#${category.slug}`}>
                <Badge tone="blue">{category.name}</Badge>
              </Link>
            )}
            {product.series && <Badge tone="grey">{product.series}</Badge>}
            {product.status === "draft" && <Badge tone="amber">{t("product.draft")}</Badge>}
          </div>
          <h1 className="mt-4 text-3xl sm:text-4xl">{product.name}</h1>
          <p className="mt-4 text-base leading-relaxed text-muted">{product.shortDescription}</p>

          {product.fullDescription && (
            <p className="mt-4 text-sm leading-relaxed text-muted">{product.fullDescription}</p>
          )}

          <div className="mt-6 rounded-2xl border border-borderline bg-background p-5">
            {product.rentalPlans.length > 0 ? (
              <>
                <p className="text-sm font-semibold text-ink">{t("product.plansTitle")}</p>
                <ul className="mt-3 space-y-2">
                  {product.rentalPlans.map((plan) => (
                    <li key={plan.label} className="flex items-center justify-between text-sm">
                      <span className="text-muted">
                        {plan.label}
                        {plan.tenureMonths ? ` · ${plan.tenureMonths} ${t("product.months")}` : ""}
                      </span>
                      <span className="font-semibold">
                        {formatRM(plan.monthlyPrice)}
                        {t("common.perMonth")}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : product.outrightPrice ? (
              <p className="text-sm">
                <span className="font-semibold text-ink">
                  {t("product.price")}: {formatRM(product.outrightPrice)}
                </span>
              </p>
            ) : (
              <p className="text-sm text-muted">{t("product.plansNone")}</p>
            )}
            <div className="mt-5 flex flex-wrap gap-3">
              <ButtonLink href="/advisors" size="lg">
                {t("product.askAdvisor")}
              </ButtonLink>
              {product.sourceUrl && (
                <a
                  href={product.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-xl border border-borderline px-5 py-3 text-sm font-semibold text-ink hover:border-primary hover:text-primary"
                >
                  {t("product.officialPage")} <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {product.features.length > 0 && (
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {product.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-muted">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {feature}
                </li>
              ))}
            </ul>
          )}

          {(product.warranty || product.installation) && (
            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
              {product.warranty && (
                <div>
                  <dt className="text-muted">{t("product.warranty")}</dt>
                  <dd className="font-semibold">{product.warranty}</dd>
                </div>
              )}
              {product.installation && (
                <div>
                  <dt className="text-muted">{t("product.installation")}</dt>
                  <dd className="font-semibold">{product.installation}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl">
            {t("product.moreFrom")} {category?.name}
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
