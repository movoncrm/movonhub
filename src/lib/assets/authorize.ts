/**
 * Server-side authorization for asset mutations. UI restrictions are not a
 * security boundary; every upload/replace/delete must pass this check.
 */
export function canManageAssets(session: { role?: string } | null | undefined): boolean {
  return session?.role === "admin";
}
