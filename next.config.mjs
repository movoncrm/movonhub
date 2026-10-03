import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: __dirname,
  images: {
    // Cloudflare Workers have no built-in Next image optimizer; set
    // NEXT_PUBLIC_UNOPTIMIZED_IMAGES=true there. Self-hosted/Vercel can keep
    // optimisation enabled.
    unoptimized: process.env.NEXT_PUBLIC_UNOPTIMIZED_IMAGES === "true",
    remotePatterns: [
      // MOVONHUB-managed assets (Cloudflare R2 behind a custom domain). Product
      // images must not be hot-linked from third-party hosts.
      { protocol: "https", hostname: "assets.movonhub.com.my" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    const baseHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-DNS-Prefetch-Control", value: "off" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          // Next.js injects inline bootstrap/flight scripts; without a nonce
          // these require 'unsafe-inline'. Documented as a residual limitation.
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https:",
          "font-src 'self' data:",
          "connect-src 'self' https://*.supabase.co",
          "frame-ancestors 'self'",
          "base-uri 'self'",
          "form-action 'self'",
          "object-src 'none'",
        ].join("; "),
      },
    ];
    if (isProd) {
      baseHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }
    return [{ source: "/:path*", headers: baseHeaders }];
  },
};

export default nextConfig;
