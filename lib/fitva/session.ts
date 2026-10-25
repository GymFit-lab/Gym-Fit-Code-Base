/**
 * Staff login against fitva_db (AUTH_MODE=fitva). Passwords are checked in the database by
 * `usp_user_verify_password` (bcrypt via pgcrypto). The session is a signed, httpOnly cookie
 * (HMAC-SHA256) holding the user id and gym id; every read re-loads the user with
 * `usp_user_get_by_id`, so deactivated accounts lose access immediately.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";

import { callFn } from "@/lib/fitva/db";

export type StaffRole = "owner" | "trainer" | "front_desk";

export type StaffUser = {
  id: string;
  gymId: string;
  name: string;
  email: string;
  role: StaffRole;
};

type UserRow = {
  id: string;
  gym_id: string;
  name: string;
  email: string;
  role: StaffRole;
  is_active: boolean;
};

const COOKIE_NAME = "fitva_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

function secret() {
  const value = process.env.FITVA_SESSION_SECRET || process.env.BETTER_AUTH_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Set FITVA_SESSION_SECRET (or BETTER_AUTH_SECRET) to sign staff sessions.");
  }
  return "fitva-dev-only-secret-change-me";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

const toUser = (row: UserRow): StaffUser => ({
  id: row.id,
  gymId: row.gym_id,
  name: row.name,
  email: row.email,
  role: row.role,
});

/** Checks email + password in the database. Returns the user, or null when they don't match. */
export async function verifyStaffCredentials(email: string, password: string) {
  const [row] = await callFn<UserRow>("usp_user_verify_password", [email, password]);
  return row ? toUser(row) : null;
}

export async function createStaffSession(user: StaffUser) {
  await callFn("usp_user_touch_login", [user.gymId, user.id]);

  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ sub: user.id, gid: user.gymId, exp })).toString(
    "base64url",
  );
  (await cookies()).set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

/** The signed-in staff user, or null. Cached per request. */
export const getStaffSession = cache(async (): Promise<StaffUser | null> => {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return null;

  const [payload, signature] = value.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;

  let claims: { sub?: string; gid?: string; exp?: number };
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    return null;
  }
  if (!claims.sub || !claims.gid || !claims.exp || claims.exp < Date.now() / 1000) return null;

  const [row] = await callFn<UserRow>("usp_user_get_by_id", [claims.gid, claims.sub]);
  return row?.is_active ? toUser(row) : null;
});

export async function destroyStaffSession() {
  (await cookies()).delete(COOKIE_NAME);
}
