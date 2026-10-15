/**
 * Which login system is active.
 *
 * - "demo" (default): static, hard-coded credentials from lib/demo-auth.ts. No database needed.
 *   TEMPORARY — for building the dashboard before the backend exists.
 * - "better-auth": real accounts (email + password, Google) stored in Postgres via Prisma.
 *
 * Switch with the AUTH_MODE env var. To remove demo auth entirely once the backend is live:
 * set AUTH_MODE=better-auth, then delete lib/demo-auth.ts, app/actions/demo-auth.ts,
 * components/auth/demo-login-form.tsx and the `demo` branches that import them.
 */
export type AuthMode = "demo" | "better-auth";

export const AUTH_MODE: AuthMode = process.env.AUTH_MODE === "better-auth" ? "better-auth" : "demo";

export const isDemoAuth = AUTH_MODE === "demo";
