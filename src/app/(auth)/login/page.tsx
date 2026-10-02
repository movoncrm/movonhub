import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getSession } from "@/lib/auth/session";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t("login.title"),
    description: t("login.subtitle"),
    alternates: { canonical: "/login" },
    robots: { index: false, follow: false },
  };
}

export default async function LoginPage() {
  const [session, { t }] = await Promise.all([getSession(), getI18n()]);
  if (session?.role === "advisor") redirect("/dashboard");
  if (session?.role === "admin") redirect("/admin");

  return (
    <div className="w-full max-w-md">
      <div className="mb-6 text-center">
        <h1 className="text-3xl">{t("login.title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("login.subtitle")}</p>
      </div>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-muted">
        {t("login.notAdvisor")}{" "}
        <Link href="/register" className="font-semibold text-primary">
          {t("login.createPage")}
        </Link>
      </p>
    </div>
  );
}
