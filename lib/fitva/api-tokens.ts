/**
 * API tokens for AUTH_MODE=fitva with FITVA_API_URL (see lib/auth-mode.ts). Shared by middleware.ts
 * and the server code, so it only uses web APIs (no next/headers, no node: modules).
 *
 * The API issues a 15-minute access token and a 30-day refresh token. Both live in httpOnly cookies;
 * the access cookie expires a minute before the token does, and middleware.ts swaps the refresh
 * token for a new pair whenever the access cookie is gone.
 */
export const ACCESS_COOKIE = "fitva_at";
export const REFRESH_COOKIE = "fitva_rt";

const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // matches Jwt:RefreshTokenDays in the API
const ACCESS_EARLY_EXPIRY = 60;

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "trainer" | "front_desk";
  gymId: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  /** Seconds until the access token expires. */
  expiresIn: number;
  user: ApiUser;
};

type CookieOptions = {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  maxAge: number;
};

/** The two cookies to set after a login or refresh. */
export function tokenCookies(
  tokens: AuthTokens,
): { name: string; value: string; options: CookieOptions }[] {
  const base = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  } as const;
  return [
    {
      name: ACCESS_COOKIE,
      value: tokens.accessToken,
      options: { ...base, maxAge: Math.max(tokens.expiresIn - ACCESS_EARLY_EXPIRY, 30) },
    },
    {
      name: REFRESH_COOKIE,
      value: tokens.refreshToken,
      options: { ...base, maxAge: REFRESH_MAX_AGE },
    },
  ];
}

/**
 * Headers for calls made on behalf of a visitor. The API trusts X-Forwarded-For only from
 * loopback, so call it at a localhost address for its per-IP login limit to see the real visitor.
 */
export function forwardedFor(clientIp: string | null): Record<string, string> {
  return clientIp ? { "X-Forwarded-For": clientIp } : {};
}

/**
 * The visitor's IP from the X-Forwarded-For header that the reverse proxy (IIS / Nginx) appends to.
 * The last entry is the one the proxy added; earlier ones can be forged by the client.
 */
export function clientIpFrom(xForwardedFor: string | null): string | null {
  const last = xForwardedFor?.split(",").pop()?.trim();
  return last || null;
}

export type RefreshResult = AuthTokens | "invalid" | "unavailable";

// The API rotates refresh tokens (each one works once). Parallel requests from one browser
// (prefetches, several tabs) would race and all but one would be rejected, so concurrent and
// recent refreshes of the same token share one result. Per server process: run one website
// instance, or sticky sessions.
const recent = new Map<string, { at: number; result: Promise<RefreshResult> }>();
const SHARE_FOR_MS = 30_000;

export function refreshTokens(
  apiUrl: string,
  refreshToken: string,
  clientIp: string | null,
): Promise<RefreshResult> {
  const now = Date.now();
  for (const [token, entry] of recent) if (now - entry.at > SHARE_FOR_MS) recent.delete(token);

  const shared = recent.get(refreshToken);
  if (shared) return shared.result;

  const result = fetch(`${apiUrl}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...forwardedFor(clientIp),
    },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  }).then(
    async (response): Promise<RefreshResult> => {
      if (response.ok) return (await response.json()) as AuthTokens;
      return response.status === 401 ? "invalid" : "unavailable";
    },
    (): RefreshResult => "unavailable",
  );
  recent.set(refreshToken, { at: now, result });
  return result;
}
