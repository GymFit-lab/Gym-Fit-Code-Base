import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { isDemoAuth, isFitvaApi, isFitvaAuth } from "@/lib/auth-mode";
import { getDemoSession } from "@/lib/demo-auth";
import { getApiUser } from "@/lib/fitva/api";
import { getStaffSession } from "@/lib/fitva/session";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  /** The user's gym in fitva_db — only set while AUTH_MODE is "fitva". */
  gymId?: string;
};

/**
 * The signed-in user, whichever login system is active (see lib/auth-mode.ts).
 * Pages should use this instead of calling Better Auth, demo or staff auth directly.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (isDemoAuth) {
    const session = await getDemoSession();
    return session
      ? { id: session.user.id, name: session.user.name, email: session.user.email }
      : null;
  }

  if (isFitvaAuth) {
    const user = isFitvaApi ? await getApiUser() : await getStaffSession();
    return user ? { id: user.id, name: user.name, email: user.email, gymId: user.gymId } : null;
  }

  const session = await auth.api.getSession({ headers: await headers() });
  return session
    ? { id: session.user.id, name: session.user.name, email: session.user.email }
    : null;
}

/** The signed-in user's gym id (AUTH_MODE=fitva). Throws when there is none. */
export async function requireGymId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user?.gymId) throw new Error("Not signed in to a FITVA gym.");
  return user.gymId;
}
