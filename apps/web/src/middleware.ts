import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = [
  "/auth",
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
const SETUP_ROUTES = ["/setup"];

function authBypassEnabled(): boolean {
  const raw = process.env.AUTH_BYPASS_MODE;
  return Boolean(raw && ["1", "true", "yes", "on"].includes(raw.toLowerCase()));
}

function welcomeTourDisabled(): boolean {
  const raw = process.env.DISABLE_WELCOME_TOUR;
  return Boolean(raw && ["1", "true", "yes", "on"].includes(raw.toLowerCase()));
}

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

function shouldEnforceSessionCookie(request: NextRequest): boolean {
  const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!configuredApiUrl) return true;

  try {
    const apiUrl = new URL(configuredApiUrl, request.url);
    return apiUrl.hostname === request.nextUrl.hostname;
  } catch {
    return true;
  }
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const bypassAuth = authBypassEnabled();
  const disableWelcomeTour = welcomeTourDisabled();

  if (isBypassedAssetPath(pathname)) {
    return withSecurityHeaders(NextResponse.next());
  }

  if (disableWelcomeTour && routeMatches(pathname, SETUP_ROUTES)) {
    return withSecurityHeaders(NextResponse.redirect(new URL("/dashboard", request.url)));
  }

  if (bypassAuth && pathname === "/") {
    return withSecurityHeaders(NextResponse.redirect(new URL("/dashboard", request.url)));
  }

  if (bypassAuth && (pathname === "/login" || pathname === "/auth/callback")) {
    return withSecurityHeaders(NextResponse.redirect(new URL("/dashboard", request.url)));
  }

  if (routeMatches(pathname, ADDON_ROUTES)) {
    return withSecurityHeaders(NextResponse.next(), true);
  }

  if (routeMatches(pathname, PUBLIC_ROUTES)) {
    return withSecurityHeaders(NextResponse.next());
  }

  const hasSession = Boolean(request.cookies.get("_k12_lms_session")?.value);

  if (!hasSession && shouldEnforceSessionCookie(request) && !bypassAuth) {
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
