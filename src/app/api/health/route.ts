import { NextResponse } from "next/server";
import { getStore } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * TEMPORARY deployment diagnostic. Reports env presence (booleans only) and a
 * sanitised error so we can confirm the Worker runtime configuration.
 * Remove once the launch is verified.
 */
export async function GET() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  let supabaseHost: string | null = null;
  try {
    supabaseHost = rawUrl ? new URL(rawUrl).host : null;
  } catch {
    supabaseHost = "invalid";
  }

  const env = {
    adapter: process.env.DATA_ADAPTER || "local",
    hasSupabaseUrl: Boolean(rawUrl),
    supabaseHost,
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasSessionSecret: Boolean(process.env.SESSION_SECRET),
    hasAdminPassword: Boolean(process.env.ADMIN_PASSWORD),
    hasUnoptimizedFlag: Boolean(process.env.NEXT_PUBLIC_UNOPTIMIZED_IMAGES),
    rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN || null,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
  };

  let advisorCount: number | null = null;
  let dbError: string | null = null;
  try {
    advisorCount = (await getStore().listAdvisors()).length;
  } catch (error) {
    dbError = error instanceof Error ? error.message : String(error);
  }

  return NextResponse.json({ ok: !dbError, env, advisorCount, dbError });
}
