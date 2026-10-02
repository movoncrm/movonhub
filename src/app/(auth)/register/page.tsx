import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/register/RegisterForm";
import { getSession } from "@/lib/auth/session";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t("register.title"),
    description: t("register.subtitle"),
    alternates: { canonical: "/register" },
  };
}

export default async function RegisterPage() {
  const [session, { t }] = await Promise.all([getSession(), getI18n()]);
  if (session?.role === "advisor") redirect("/dashboard");
  if (session?.role === "admin") redirect("/admin");

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-6 text-center">
        <h1 className="text-3xl">{t("register.title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("register.subtitle")}</p>
      </div>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-muted">
        {t("register.hasAccount")}{" "}
        <Link href="/login" className="font-semibold text-primary">
          {t("register.loginLink")}
        </Link>
      </p>
    </div>
  );
}
