import { type NextRequest, NextResponse } from "next/server";

import { fitvaApiUrl, isFitvaApi } from "@/lib/auth-mode";
import {
  ACCESS_COOKIE,
  clientIpFrom,
  REFRESH_COOKIE,
  refreshTokens,
  tokenCookies,
} from "@/lib/fitva/api-tokens";

/**
 * Keeps the FITVA API session alive (AUTH_MODE=fitva + FITVA_API_URL only): when the short-lived
 * access cookie has expired but the refresh cookie is still there, swap it for a new pair before
 * the page renders. The new tokens are set on the response (browser) and on the forwarded request
 * (so this render already sees them). Server Components can't set cookies, hence the middleware.
 */
export async function middleware(request: NextRequest) {
  if (!isFitvaApi || !fitvaApiUrl) return NextResponse.next();

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (request.cookies.has(ACCESS_COOKIE) || !refreshToken) return NextResponse.next();

  const result = await refreshTokens(
    fitvaApiUrl,
    refreshToken,
    clientIpFrom(request.headers.get("x-forwarded-for")),
  );

  if (result === "unavailable") return NextResponse.next(); // keep the cookies; the page shows the error
  if (result === "invalid") {
    const response = NextResponse.next();
    response.cookies.delete(REFRESH_COOKIE); // signed out elsewhere or expired → the layout redirects to /login
    return response;
  }

  const cookies = tokenCookies(result);
  for (const c of cookies) request.cookies.set(c.name, c.value);
  const forwarded = new Headers(request.headers);
  forwarded.set("cookie", request.cookies.toString());

  const response = NextResponse.next({ request: { headers: forwarded } });
  for (const c of cookies) response.cookies.set(c.name, c.value, c.options);
  return response;
}

export const config = {
  // Node.js runtime: reads FITVA_API_URL at run time and shares refreshes within the process.
  runtime: "nodejs",
  matcher: ["/dashboard/:path*"],
};
