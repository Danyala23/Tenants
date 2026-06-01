import { NextResponse, type NextRequest } from "next/server";

const ALLOWED_METHODS = "GET, POST, PUT, DELETE, PATCH, OPTIONS";
const ALLOWED_HEADERS = "Content-Type, Authorization";

/** CORS for mobile clients (Expo web) calling /api with Bearer tokens. */
export function corsHeaders(request: NextRequest): HeadersInit {
  const origin = request.headers.get("origin");
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Max-Age": "86400",
    ...(origin ? { Vary: "Origin" } : {}),
  };
}

export function withCors(response: NextResponse, request: NextRequest): NextResponse {
  for (const [key, value] of Object.entries(corsHeaders(request))) {
    response.headers.set(key, value);
  }
  return response;
}

export function corsPreflightResponse(request: NextRequest): NextResponse {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

export function isApiPath(pathname: string): boolean {
  return pathname.startsWith("/api");
}
