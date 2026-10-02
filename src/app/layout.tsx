import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { getI18n } from "@/i18n/server";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://movonhub.com.my"),
    title: {
      default: dict.meta.homeTitle,
      template: "%s | MOVONHUB",
    },
    description: dict.meta.homeDescription,
    applicationName: "MOVONHUB",
    icons: {
      icon: [{ url: "/brand/favicon.svg", type: "image/svg+xml" }],
    },
    openGraph: {
      type: "website",
      siteName: "MOVONHUB",
      locale: "ms_MY",
    },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale } = await getI18n();
  return (
    <html lang={locale} className={inter.variable}>
      <body className="min-h-screen font-sans">
        <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
