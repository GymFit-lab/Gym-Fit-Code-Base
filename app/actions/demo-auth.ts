"use server";

import { redirect } from "next/navigation";

import { authContent } from "@/content/auth";
import { isDemoAuth } from "@/lib/auth-mode";
import { createDemoSession, destroyDemoSession, verifyDemoCredentials } from "@/lib/demo-auth";
import { demoLoginSchema } from "@/lib/schemas/auth";

/** ⚠️ TEMPORARY — demo login with hard-coded credentials (lib/demo-auth.ts). */
export async function demoSignIn(values: unknown): Promise<{ error: string } | undefined> {
  if (!isDemoAuth) return { error: authContent.serverErrors.generic };

  const parsed = demoLoginSchema.safeParse(values);
  if (!parsed.success || !verifyDemoCredentials(parsed.data.username, parsed.data.password)) {
    return { error: authContent.demo.errors.invalid };
  }

  await createDemoSession();
  redirect(authContent.afterAuthPath);
}

export async function demoSignOut() {
  await destroyDemoSession();
  redirect("/login");
}
