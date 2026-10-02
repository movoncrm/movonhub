import { NextResponse } from "next/server";
import { getStore } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * TEMPORARY deployment diagnostic. Reports env presence (booleans only) and a
 * sanitised error so we can confirm the Worker runtime configuration.
 * Remove once the launch is verified.
 */
export async function GET() {
  const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
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

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const keyDiag = {
    serviceKeyLength: serviceKey.length,
    serviceKeyHasControlChar: /[^\x20-\x7E]/.test(serviceKey),
  };

  // Raw REST probe (no library) to reveal the real HTTP status/body.
  // Also probe with a sanitised key to detect paste corruption.
  let restStatus: number | null = null;
  let restBody: string | null = null;
  let restCleanStatus: number | null = null;
  try {
    const res = await fetch(`${rawUrl}/rest/v1/advisors?select=id&limit=1`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    restStatus = res.status;
    restBody = (await res.text()).slice(0, 200);

    const clean = serviceKey.replace(/[^\x20-\x7E]/g, "").trim();
    const res2 = await fetch(`${rawUrl}/rest/v1/advisors?select=id&limit=1`, {
      headers: { apikey: clean, Authorization: `Bearer ${clean}` },
    });
    restCleanStatus = res2.status;
  } catch (error) {
    restBody = error instanceof Error ? error.message : String(error);
  }

  return NextResponse.json({ ok: !dbError, env, keyDiag, advisorCount, dbError, restStatus, restCleanStatus, restBody });
}
