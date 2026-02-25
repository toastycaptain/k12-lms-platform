import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = [
  "/login",
  "/docs",
  "/auth/callback",
  "/unauthorized",
  "/not-authorized",
  "/lti/launch",
  "/lti/deep-link",
];

const ADDON_ROUTES = ["/addon"];
const ADMIN_ROUTES = ["/admin"];

function routeMatches(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function withSecurityHeaders(response: NextResponse, allowIframe = false): NextResponse {
  response.headers.set("X-Frame-Options", allowIframe ? "ALLOWALL" : "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
}

function isBypassedAssetPath(pathname: string): boolean {
  return pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".");
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isBypassedAssetPath(pathname)) {
    return withSecurityHeaders(NextResponse.next());
  }

  if (routeMatches(pathname, ADDON_ROUTES)) {
    return withSecurityHeaders(NextResponse.next(), true);
  }

  if (routeMatches(pathname, PUBLIC_ROUTES)) {
    return withSecurityHeaders(NextResponse.next());
  }

  const hasSession = Boolean(request.cookies.get("_k12_lms_session")?.value);

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", `${pathname}${search || ""}`);
    return withSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  // Coarse path guard for admin routes. Fine-grained checks stay in ProtectedRoute.
  if (routeMatches(pathname, ADMIN_ROUTES)) {
    return withSecurityHeaders(NextResponse.next());
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
