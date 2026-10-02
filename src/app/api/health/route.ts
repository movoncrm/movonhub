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
    const e = error as { message?: string; code?: string; details?: string; hint?: string; status?: number };
    dbError =
      [e?.message, e?.code, e?.details, e?.hint].filter(Boolean).join(" | ") ||
      (error instanceof Error ? error.message : JSON.stringify(error));
  }

  // Raw REST probe (no library) to reveal the real HTTP status/body.
  let restStatus: number | null = null;
  let restBody: string | null = null;
  try {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const res = await fetch(`${rawUrl}/rest/v1/advisors?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    restStatus = res.status;
    restBody = (await res.text()).slice(0, 300);
  } catch (error) {
    restBody = error instanceof Error ? error.message : String(error);
  }

  return NextResponse.json({ ok: !dbError, env, advisorCount, dbError, restStatus, restBody });
}
