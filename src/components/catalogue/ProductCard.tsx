import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { resolveProductImageUrl } from "@/lib/assets/url";
import { getI18n } from "@/i18n/server";
import { formatRM } from "@/lib/utils";
import type { Product } from "@/lib/types";

export async function ProductCard({
  product,
  footer,
  className,
}: {
  product: Product;
  footer?: React.ReactNode;
  className?: string;
}) {
  const { t } = await getI18n();

  const lowestPlan = product.rentalPlans.length
    ? Math.min(...product.rentalPlans.map((p) => p.monthlyPrice))
    : null;
  const imageUrl = resolveProductImageUrl(product.imageUrl);

  return (
    <article className={`card-surface group flex flex-col overflow-hidden ${className ?? ""}`}>
      <Link href={`/products/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-background">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-contain p-6 transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">{t("common.noImage")}</div>
        )}
        {product.series && (
          <span className="absolute left-3 top-3 rounded-full bg-surface/90 px-2.5 py-1 text-xs font-semibold text-primary-dark shadow-sm">
            {product.series}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-bold leading-snug">
          <Link href={`/products/${product.slug}`} className="hover:text-primary">
            {product.name}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">{product.shortDescription}</p>

        <div className="mt-4 flex items-center justify-between gap-3">
          {lowestPlan !== null ? (
            <p className="text-sm font-semibold text-ink">
              {t("common.from")} {formatRM(lowestPlan)}
              <span className="text-xs font-normal text-muted">{t("common.perMonth")}</span>
            </p>
          ) : product.outrightPrice ? (
            <p className="text-sm font-semibold text-ink">{formatRM(product.outrightPrice)}</p>
          ) : (
            <Badge tone="grey">{t("common.priceOnEnquiry")}</Badge>
          )}
        </div>

        {footer && <div className="mt-4">{footer}</div>}
      </div>
    </article>
  );
}
