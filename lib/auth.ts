import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@/lib/db";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/schemas/auth";

/** Google sign-in is enabled only when both OAuth credentials are configured. */
export const isGoogleAuthEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

/**
 * Better Auth server instance. Reads BETTER_AUTH_SECRET and BETTER_AUTH_URL from env.
 * HTTP endpoints are mounted at /api/auth/* (app/api/auth/[...all]/route.ts).
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: PASSWORD_MIN,
    maxPasswordLength: PASSWORD_MAX,
  },
  socialProviders: isGoogleAuthEnabled
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
          prompt: "select_account",
        },
      }
    : {},
  account: {
    // Signing in with Google using the same email as an existing password account links them.
    accountLinking: { enabled: true, trustedProviders: ["google"] },
  },
  // Must stay last: lets Server Actions set auth cookies.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
