import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { SessionUser } from "@/lib/types";

export const SESSION_COOKIE = "mh_session";
/**
 * Short-lived sessions limit the blast radius of a leaked token. Logout clears
 * the cookie; because sessions are stateless there is no server-side session
 * store to revoke, so expiry is intentionally conservative.
 */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET must be set (min 16 chars) in production.");
    }
    return "dev-only-insecure-session-secret-change-me";
  }
  return s;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(user: SessionUser): string {
  const body = { ...user, iat: Date.now(), exp: Date.now() + MAX_AGE_SECONDS * 1000 };
  const payload = b64url(JSON.stringify(body));
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function verifySessionToken(token?: string | null): SessionUser | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data || typeof data.exp !== "number" || data.exp < Date.now()) return null;
    const { exp, iat, ...user } = data;
    void exp;
    void iat;
    return user as SessionUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function setSessionCookie(user: SessionUser): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function requireRole(role: "advisor" | "admin"): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new AuthError("Not authenticated.", 401);
  if (role === "admin" && session.role !== "admin") throw new AuthError("Admin only.", 403);
  return session;
}

export async function requireAdvisorOwner(advisorId: string): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new AuthError("Not authenticated.", 401);
  if (session.role !== "admin" && session.advisorId !== advisorId) {
    throw new AuthError("You can only manage your own profile.", 403);
  }
  return session;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}
