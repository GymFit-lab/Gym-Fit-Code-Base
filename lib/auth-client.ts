import { createAuthClient } from "better-auth/react";

import { authContent } from "@/content/auth";

/** Browser-side auth client. Talks to /api/auth/* on the current origin. */
export const authClient = createAuthClient();

/** Map a Better Auth error to user-facing copy from content/auth.ts. */
export function authErrorMessage(error: { code?: string; status?: number } | null | undefined) {
  const { serverErrors } = authContent;
  if (error?.status === 429) return serverErrors.TOO_MANY_REQUESTS;
  return (error?.code && serverErrors[error.code]) || serverErrors.generic;
}
