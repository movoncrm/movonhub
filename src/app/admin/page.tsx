import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Power, Trash2 } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { ProductForm } from "@/components/admin/ProductForm";
import { PromotionForm } from "@/components/admin/PromotionForm";
import { AdvisorList } from "@/components/admin/AdvisorList";
import { CreateAdvisorForm } from "@/components/admin/CreateAdvisorForm";
import { FeaturedAdvisorsForm } from "@/components/admin/FeaturedAdvisorsForm";
import { getSession } from "@/lib/auth/session";
import { getStore } from "@/lib/db";
import { logout } from "@/app/(auth)/logout/actions";
import { deleteProduct, deletePromotion, togglePromotion } from "@/app/admin/actions";
import { getI18n } from "@/i18n/server";
import { formatDate } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("admin.title"), robots: { index: false, follow: false } };
}

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [session, { t, locale }] = await Promise.all([getSession(), getI18n()]);
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/hub");

  const store = getStore();
  const [advisors, categories, products, promotions, settings, enquiries] = await Promise.all([
    store.listAdvisors(),
    store.listCategories(),
    store.listProducts({ status: "all" }),
    store.listPromotions(),
    store.getSettings(),
    store.listEnquiries(),
  ]);

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "movonhub.com.my";
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name || "—";

  const counts = [
    { label: t("admin.sa.navAdvisors"), value: advisors.length },
    { label: t("admin.products"), value: products.length },
    { label: t("admin.promotions"), value: promotions.length },
    { label: t("admin.sa.navEnquiries"), value: enquiries.length },
  ];

  const nav = [
    { href: "#overview", label: t("admin.sa.navOverview") },
    { href: "#advisors", label: t("admin.sa.navAdvisors") },
    { href: "/admin/content", label: t("admin.navContent") },
    { href: "#products", label: t("admin.sa.navProducts") },
    { href: "#promotions", label: t("admin.sa.navPromotions") },
    { href: "#enquiries", label: t("admin.sa.navEnquiries") },
    { href: "#settings", label: t("admin.sa.navSecurity") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-borderline bg-surface">
        <div className="container-page flex h-16 items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Logo />
            <Badge tone="blue">{t("nav.admin")}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm">
                <Power className="h-4 w-4" /> {t("admin.logout")}
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container-page py-8">
        {/* OVERVIEW */}
        <section id="overview" className="scroll-mt-20">
          <h1 className="text-2xl">{t("admin.title")}</h1>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {counts.map((count) => (
              <div key={count.label} className="card-surface p-5">
                <p className="text-2xl font-bold">{count.value}</p>
                <p className="text-sm text-muted">{count.label}</p>
              </div>
            ))}
          </div>
        </section>

        <nav className="mt-8 flex flex-wrap gap-2">
          {nav.map((tab) => (
            <a
              key={tab.href}
              href={tab.href}
              className="rounded-full border border-borderline bg-surface px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary"
            >
              {tab.label}
            </a>
          ))}
        </nav>

        {/* SALES ADVISORS */}
        <section id="advisors" className="mt-10 scroll-mt-20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl">{t("admin.sa.navAdvisors")}</h2>
          </div>

          <details className="card-surface mt-4 p-5">
            <summary className="flex cursor-pointer items-center gap-2 font-semibold text-primary">
              <Plus className="h-4 w-4" /> {t("admin.sa.addNew")}
            </summary>
            <div className="mt-4 border-t border-borderline pt-4">
              <h3 className="text-base font-bold">{t("admin.sa.createTitle")}</h3>
              <p className="mb-4 text-sm text-muted">{t("admin.sa.createDesc")}</p>
              <CreateAdvisorForm />
            </div>
          </details>

          <div className="mt-4">
            <AdvisorList advisors={advisors} rootDomain={rootDomain} />
          </div>
        </section>

        {/* PRODUCTS */}
        <section id="products" className="mt-12 scroll-mt-20">
          <h2 className="text-xl">{t("admin.productCatalogue")}</h2>

          <details className="mt-4 card-surface p-5">
            <summary className="flex cursor-pointer items-center gap-2 font-semibold text-primary">
              <Plus className="h-4 w-4" /> {t("admin.addProduct")}
            </summary>
            <div className="mt-4 border-t border-borderline pt-4">
              <ProductForm categories={categories} />
            </div>
          </details>

          <div className="mt-4 space-y-3">
            {products.map((product) => (
              <div key={product.id} className="card-surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold">{product.name}</p>
                      <Badge tone={product.status === "active" ? "green" : product.status === "draft" ? "amber" : "grey"}>
                        {t(`admin.field.${product.status}`)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted">
                      {categoryName(product.categoryId)} · /{product.slug}
                    </p>
                  </div>
                  <form action={deleteProduct}>
                    <input type="hidden" name="id" value={product.id} />
                    <Button type="submit" variant="ghost" size="sm" className="text-destructive hover:bg-red-50">
                      <Trash2 className="h-4 w-4" /> {t("common.delete")}
                    </Button>
                  </form>
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-semibold text-primary">{t("admin.editProduct")}</summary>
                  <div className="mt-3 border-t border-borderline pt-3">
                    <ProductForm categories={categories} product={product} />
                  </div>
                </details>
              </div>
            ))}
          </div>
        </section>

        {/* PROMOTIONS */}
        <section id="promotions" className="mt-12 scroll-mt-20">
          <h2 className="text-xl">{t("admin.promotions")}</h2>

          <details className="mt-4 card-surface p-5">
            <summary className="flex cursor-pointer items-center gap-2 font-semibold text-primary">
              <Plus className="h-4 w-4" /> {t("admin.addPromotion")}
            </summary>
            <div className="mt-4 border-t border-borderline pt-4">
              <PromotionForm products={products} />
            </div>
          </details>

          <div className="mt-4 space-y-3">
            {promotions.map((promo) => (
              <div key={promo.id} className="card-surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold">{promo.title}</p>
                      <Badge tone={promo.active ? "green" : "grey"}>
                        {promo.active ? t("dashboard.active") : t("dashboard.inactive")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted">
                      {promo.startDate} → {promo.endDate || "—"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <form action={togglePromotion}>
                      <input type="hidden" name="id" value={promo.id} />
                      <input type="hidden" name="active" value={String(promo.active)} />
                      <Button type="submit" variant="secondary" size="sm">
                        {promo.active ? t("admin.deactivate") : t("admin.activate")}
                      </Button>
                    </form>
                    <form action={deletePromotion}>
                      <input type="hidden" name="id" value={promo.id} />
                      <Button type="submit" variant="ghost" size="sm" className="text-destructive hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-semibold text-primary">{t("admin.editPromotion")}</summary>
                  <div className="mt-3 border-t border-borderline pt-3">
                    <PromotionForm products={products} promotion={promo} />
                  </div>
                </details>
              </div>
            ))}
          </div>
        </section>

        {/* ENQUIRIES */}
        <section id="enquiries" className="mt-12 scroll-mt-20">
          <h2 className="text-xl">{t("admin.sa.navEnquiries")}</h2>
          {enquiries.length === 0 ? (
            <p className="mt-4 text-sm text-muted">{t("dashboard.noEnquiries")}</p>
          ) : (
            <div className="card-surface mt-4 divide-y divide-borderline">
              {enquiries.slice(0, 50).map((enquiry) => (
                <div key={enquiry.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm font-semibold">
                      {enquiry.productInterest || t("dashboard.generalEnquiry")}
                    </p>
                    <p className="text-xs text-muted">
                      {enquiry.customerName || t("dashboard.anonymous")} · /sa/{enquiry.advisorSlug || "—"} ·{" "}
                      {formatDate(enquiry.createdAt, locale)}
                    </p>
                  </div>
                  <Badge tone={enquiry.status === "won" ? "green" : enquiry.status === "lost" ? "grey" : "blue"}>
                    {enquiry.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SETTINGS */}
        <section id="settings" className="mt-12 scroll-mt-20">
          <h2 className="text-xl">{t("admin.settings")}</h2>
          <div className="card-surface mt-4 p-5">
            <h3 className="font-semibold">{t("admin.featuredAdvisors")}</h3>
            <p className="mb-3 text-sm text-muted">{t("admin.featuredAdvisorsBody")}</p>
            <FeaturedAdvisorsForm advisors={advisors} featuredSlugs={settings.featuredAdvisorSlugs} />
          </div>

          <div className="card-surface mt-4 p-5">
            <h3 className="font-semibold">{t("admin.platformTools")}</h3>
            <ul className="mt-3 space-y-2">
              {settings.tools.map((tool) => (
                <li key={tool.id} className="flex items-center justify-between text-sm">
                  <span>{t(`tools.items.${tool.id}.name`)}</span>
                  <Badge tone={tool.status === "live" ? "green" : "amber"}>
                    {tool.status === "live" ? t("common.live") : t("common.comingSoon")}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>

          <div className="card-surface mt-4 p-5 text-sm text-muted">
            <h3 className="font-semibold text-ink">{t("admin.dataAdapter")}</h3>
            <p className="mt-1">{t("admin.dataAdapterBody", { adapter: process.env.DATA_ADAPTER || "local" })}</p>
            <p className="mt-2">
              AI: {process.env.AI_API_KEY ? t("admin.aiConfigured") : t("admin.aiNotConfigured")} ·{" "}
              <Link href="/" className="font-semibold text-primary">
                {t("admin.viewPublicSite")}
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
