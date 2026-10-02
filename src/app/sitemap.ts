import type { MetadataRoute } from "next";
import { getStore } from "@/lib/db";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://movonhub.com.my";
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "movonhub.com.my";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const store = getStore();
  const advisors = await store.listAdvisors({ activeOnly: true });

  // Controlled first launch: only the main page and legal pages are indexed.
  const staticRoutes = ["", "/contact", "/privacy", "/terms"];

  return [
    ...staticRoutes.map((route) => ({
      url: `${SITE}${route}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.7,
    })),
    // Advisor microsites are canonical on their subdomain (avoids duplicate
    // indexing of /sa/{slug} and {slug}.movonhub.com.my).
    ...advisors
      .filter((advisor) => advisor.status === "published" && advisor.active)
      .map((advisor) => ({
        url: `https://${advisor.slug}.${ROOT_DOMAIN}`,
        lastModified: new Date(advisor.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
  ];
}
