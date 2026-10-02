import { NextResponse, type NextRequest } from "next/server";

/**
 * Advisor subdomain routing.
 * `{slug}.movonhub.com.my/...` is rewritten to `/sa/{slug}/...` so the same
 * advisor profile and components serve both:
 *   - https://movonhub.com.my/sa/nik
 *   - https://nik.movonhub.com.my
 *
 * Configure a wildcard DNS record (*.movonhub.com.my) plus wildcard SSL at the
 * deployment platform (e.g. Cloudflare). `www` and bare domains are ignored.
 */

const RESERVED = new Set([
  "www",
  "api",
  "app",
  "admin",
  "dashboard",
  "hub",
  "sa",
  "login",
  "register",
  "static",
  "assets",
  "support",
  "mail",
  "cdn",
  "status",
  "sso",
]);

export function middleware(request: NextRequest) {
  const hostname = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "movonhub.com.my").toLowerCase();

  let subdomain: string | null = null;

  if (hostname.endsWith(`.${rootDomain}`)) {
    subdomain = hostname.slice(0, -(rootDomain.length + 1));
  } else if (hostname.endsWith(".localhost")) {
    subdomain = hostname.slice(0, -".localhost".length);
  }

  if (!subdomain || subdomain.includes(".") || RESERVED.has(subdomain)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  const suffix = url.pathname === "/" ? "" : url.pathname;
  url.pathname = `/sa/${subdomain}${suffix}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|brand|uploads|robots.txt|sitemap.xml).*)"],
};
