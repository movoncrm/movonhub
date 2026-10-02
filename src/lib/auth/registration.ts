/**
 * Public self-registration is disabled by default. Super Admin onboards Sales
 * Advisors from /admin, which keeps account creation under an authorised actor.
 * Set ALLOW_PUBLIC_REGISTRATION=true only if open sign-up is intended.
 */
export function registrationEnabled(): boolean {
  const value = (process.env.ALLOW_PUBLIC_REGISTRATION || "").toLowerCase();
  return value === "true" || value === "1";
}
