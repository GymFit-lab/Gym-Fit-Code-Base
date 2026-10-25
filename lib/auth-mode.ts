/**
 * Which login system is active.
 *
 * - "demo" (default): static, hard-coded credentials from lib/demo-auth.ts. No database needed.
 *   TEMPORARY — for building the dashboard before the backend exists.
 * - "fitva": gym staff accounts in the FITVA database (lib/fitva/session.ts). Also switches the
 *   dashboard and gym pages from dummy data to fitva_db (needs FITVA_DATABASE_URL).
 * - "better-auth": real accounts (email + password, Google) stored in Postgres via Prisma.
 *
 * Switch with the AUTH_MODE env var. To remove demo auth entirely once the backend is live:
 * set AUTH_MODE=better-auth, then delete lib/demo-auth.ts, app/actions/demo-auth.ts,
 * components/auth/demo-login-form.tsx and the `demo` branches that import them.
 */
export type AuthMode = "demo" | "fitva" | "better-auth";

export const AUTH_MODE: AuthMode =
  process.env.AUTH_MODE === "better-auth"
    ? "better-auth"
    : process.env.AUTH_MODE === "fitva"
      ? "fitva"
      : "demo";

export const isDemoAuth = AUTH_MODE === "demo";

/** Staff login + live gym data from fitva_db. */
export const isFitvaAuth = AUTH_MODE === "fitva";
