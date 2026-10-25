"use server";

import { redirect } from "next/navigation";

import { authContent } from "@/content/auth";
import { isFitvaApi, isFitvaAuth } from "@/lib/auth-mode";
import { apiSignIn, apiSignOut } from "@/lib/fitva/api";
import {
  createStaffSession,
  destroyStaffSession,
  verifyStaffCredentials,
} from "@/lib/fitva/session";
import { staffLoginSchema } from "@/lib/schemas/auth";

/**
 * Staff login (AUTH_MODE=fitva): email + password checked by fitva_db, or by the .NET API's
 * POST /auth/login when FITVA_API_URL is set.
 */
export async function staffSignIn(values: unknown): Promise<{ error: string } | undefined> {
  if (!isFitvaAuth) return { error: authContent.serverErrors.generic };

  const parsed = staffLoginSchema.safeParse(values);
  if (!parsed.success) return { error: authContent.fitva.errors.invalid };

  if (isFitvaApi) {
    let result;
    try {
      result = await apiSignIn(parsed.data.email, parsed.data.password);
    } catch (error) {
      console.error("[fitva] API login failed", error);
      return { error: authContent.fitva.errors.unavailable };
    }
    if (result === "invalid") return { error: authContent.fitva.errors.invalid };
    if (result === "rate-limited") return { error: authContent.fitva.errors.tooManyAttempts };
    redirect(authContent.afterAuthPath);
  }

  let user;
  try {
    user = await verifyStaffCredentials(parsed.data.email, parsed.data.password);
    if (user) await createStaffSession(user);
  } catch (error) {
    console.error("[fitva] login failed", error);
    return { error: authContent.fitva.errors.unavailable };
  }
  if (!user) return { error: authContent.fitva.errors.invalid };

  redirect(authContent.afterAuthPath);
}

export async function staffSignOut() {
  if (isFitvaApi) await apiSignOut();
  else await destroyStaffSession();
  redirect("/login");
}
