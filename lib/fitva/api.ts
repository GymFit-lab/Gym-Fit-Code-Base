/**
 * Server-side client for the FITVA .NET API (AUTH_MODE=fitva + FITVA_API_URL). Calls carry the
 * signed-in user's access token from the httpOnly cookie; the gym always comes from that token.
 * Error bodies are the API's ProblemDetails (`{ title, status, code? }`, backend/API.md).
 */
import { cache } from "react";
import { cookies, headers } from "next/headers";

import { fitvaApiUrl } from "@/lib/auth-mode";
import {
  ACCESS_COOKIE,
  type ApiUser,
  type AuthTokens,
  clientIpFrom,
  forwardedFor,
  REFRESH_COOKIE,
  tokenCookies,
} from "@/lib/fitva/api-tokens";

export class FitvaApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
    message: string,
  ) {
    super(message);
    this.name = "FitvaApiError";
  }
}

function baseUrl() {
  if (!fitvaApiUrl) throw new Error("FITVA_API_URL is not set.");
  return fitvaApiUrl;
}

async function clientIp() {
  return clientIpFrom((await headers()).get("x-forwarded-for"));
}

async function failure(response: Response): Promise<FitvaApiError> {
  let body: { title?: string; code?: string } = {};
  try {
    body = await response.json();
  } catch {
    // not JSON
  }
  return new FitvaApiError(
    response.status,
    body.code,
    body.title ?? `API responded ${response.status}`,
  );
}

/** An authenticated API call for the signed-in user. Throws FitvaApiError when it fails. */
export async function apiFetch<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) throw new FitvaApiError(401, undefined, "Not signed in.");

  const response = await fetch(`${baseUrl()}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  if (!response.ok) throw await failure(response);
  return (response.status === 204 ? undefined : await response.json()) as T;
}

/** POST /auth/login. Sets the token cookies on success (Server Actions only). */
export async function apiSignIn(
  email: string,
  password: string,
): Promise<"ok" | "invalid" | "rate-limited"> {
  const response = await fetch(`${baseUrl()}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...forwardedFor(await clientIp()),
    },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 400) return "invalid";
  if (response.status === 429) return "rate-limited";
  if (!response.ok) throw await failure(response);

  const tokens = (await response.json()) as AuthTokens;
  const jar = await cookies();
  for (const c of tokenCookies(tokens)) jar.set(c.name, c.value, c.options);
  return "ok";
}

/** Revokes the refresh token and clears both cookies (Server Actions only). */
export async function apiSignOut() {
  const jar = await cookies();
  const refreshToken = jar.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    await fetch(`${baseUrl()}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    }).catch(() => undefined); // the cookies go either way
  }
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

/** The signed-in user (GET /auth/me), or null. Cached per request. */
export const getApiUser = cache(async (): Promise<ApiUser | null> => {
  try {
    return await apiFetch<ApiUser>("/auth/me");
  } catch (error) {
    if (error instanceof FitvaApiError && error.status === 401) return null;
    throw error;
  }
});
