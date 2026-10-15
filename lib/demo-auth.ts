/**
 * ⚠️ TEMPORARY demo login — hard-coded credentials, no database.
 * Used only while AUTH_MODE is "demo" (see lib/auth-mode.ts). Delete this file once the
 * real backend is live.
 *
 * The session is a signed, httpOnly cookie (HMAC-SHA256), so it can't be forged from the
 * browser — but anyone who knows the credentials below can log in. Never ship demo mode
 * to a public production site.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const DEMO_CREDENTIALS = { username: "Admin", password: "1234" } as const;

export const DEMO_USER = {
  id: "demo-admin",
  name: "Admin",
  email: "admin@gymfit.demo",
  role: "owner",
} as const;

const COOKIE_NAME = "gymfit_demo_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function secret() {
  return process.env.BETTER_AUTH_SECRET || "gymfit-demo-only-secret-change-me";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/** Constant-time check of the submitted credentials. Username is case-insensitive. */
export function verifyDemoCredentials(username: string, password: string) {
  const userOk = safeEqual(username.trim().toLowerCase(), DEMO_CREDENTIALS.username.toLowerCase());
  const passOk = safeEqual(password, DEMO_CREDENTIALS.password);
  return userOk && passOk;
}

export async function createDemoSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ sub: DEMO_USER.id, exp: expiresAt })).toString(
    "base64url",
  );
  const store = await cookies();
  store.set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

/** Returns the demo user if a valid, unexpired session cookie is present. */
export async function getDemoSession() {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return null;

  const [payload, signature] = value.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;

  try {
    const { sub, exp } = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      sub?: string;
      exp?: number;
    };
    if (sub !== DEMO_USER.id || !exp || exp < Date.now() / 1000) return null;
    return { user: DEMO_USER };
  } catch {
    return null;
  }
}

export async function destroyDemoSession() {
  (await cookies()).delete(COOKIE_NAME);
}
