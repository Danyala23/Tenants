import { NextResponse, type NextRequest } from "next/server";
import { redirectWithSession, updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/auth");
  const isApiAuth = request.nextUrl.pathname.startsWith("/api/auth");
  const isPublicApi = request.nextUrl.pathname.startsWith("/api/health");

  if (!user && !isAuthRoute && !isApiAuth && !isPublicApi && request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user && !isAuthRoute && !isApiAuth && !isPublicApi && !request.nextUrl.pathname.startsWith("/api")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return redirectWithSession(url, supabaseResponse);
  }

  if (user && isAuthRoute && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return redirectWithSession(url, supabaseResponse);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
