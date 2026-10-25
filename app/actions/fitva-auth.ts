"use server";

import { redirect } from "next/navigation";

import { authContent } from "@/content/auth";
import { isFitvaAuth } from "@/lib/auth-mode";
import {
  createStaffSession,
  destroyStaffSession,
  verifyStaffCredentials,
} from "@/lib/fitva/session";
import { staffLoginSchema } from "@/lib/schemas/auth";

/** Staff login (AUTH_MODE=fitva): email + password checked by fitva_db. */
export async function staffSignIn(values: unknown): Promise<{ error: string } | undefined> {
  if (!isFitvaAuth) return { error: authContent.serverErrors.generic };

  const parsed = staffLoginSchema.safeParse(values);
  if (!parsed.success) return { error: authContent.fitva.errors.invalid };

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
  await destroyStaffSession();
  redirect("/login");
}
