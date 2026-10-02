import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://movonhub.com.my";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /sa/ is not canonical (advisor pages are canonical on their subdomain).
        disallow: ["/admin", "/dashboard", "/hub", "/api/", "/sa/", "/register/success"],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
