import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { isDemoAuth } from "@/lib/auth-mode";
import { getDemoSession } from "@/lib/demo-auth";

export type CurrentUser = { id: string; name: string; email: string };

/**
 * The signed-in user, whichever login system is active (see lib/auth-mode.ts).
 * Pages should use this instead of calling Better Auth or demo auth directly.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (isDemoAuth) {
    const session = await getDemoSession();
    return session
      ? { id: session.user.id, name: session.user.name, email: session.user.email }
      : null;
  }

  const session = await auth.api.getSession({ headers: await headers() });
  return session
    ? { id: session.user.id, name: session.user.name, email: session.user.email }
    : null;
}
