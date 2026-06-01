import { NextResponse, type NextRequest } from "next/server";
import { getUserFromAccessToken, extractBearerToken } from "@/lib/supabase/bearer";
import { corsPreflightResponse, isApiPath, withCors } from "@/lib/cors";
import { redirectWithSession, updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  if (isApiPath(request.nextUrl.pathname) && request.method === "OPTIONS") {
    return corsPreflightResponse(request);
  }

  const { supabaseResponse, user: cookieUser } = await updateSession(request);

  let user = cookieUser;
  if (!user) {
    const bearerToken = extractBearerToken(request.headers.get("authorization"));
    if (bearerToken) {
      user = await getUserFromAccessToken(bearerToken);
    }
  }

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/auth");
  const isApiAuth = request.nextUrl.pathname.startsWith("/api/auth");
  const isPublicApi = request.nextUrl.pathname.startsWith("/api/health");
  const isApi = isApiPath(request.nextUrl.pathname);

  if (!user && !isAuthRoute && !isApiAuth && !isPublicApi && isApi) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  if (!user && !isAuthRoute && !isApiAuth && !isPublicApi && !isApi) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return redirectWithSession(url, supabaseResponse);
  }

  if (user && isAuthRoute && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return redirectWithSession(url, supabaseResponse);
  }

  if (isApi) {
    return withCors(supabaseResponse, request);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
