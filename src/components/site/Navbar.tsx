import { getSession } from "@/lib/auth/session";
import { getI18n } from "@/i18n/server";
import { NavbarClient } from "./NavbarClient";

export async function Navbar() {
  const [session, { t }] = await Promise.all([getSession(), getI18n()]);
  let accountHref = "/login";
  let accountLabel = t("nav.login");
  if (session?.role === "admin") {
    accountHref = "/admin";
    accountLabel = t("nav.admin");
  } else if (session?.role === "advisor") {
    accountHref = "/dashboard";
    accountLabel = t("nav.dashboard");
  }
  return <NavbarClient accountHref={accountHref} accountLabel={accountLabel} />;
}
