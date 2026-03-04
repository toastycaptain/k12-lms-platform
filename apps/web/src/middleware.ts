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
const API_ROUTES = ["/api"];
const SESSION_COOKIE_NAMES = [
  "_k12_lms_session",
  "__Secure-k12_lms_session",
  "__Host-k12_lms_session",
];
const ASSET_PATH_EXTENSIONS =
  /\.(?:css|js|mjs|map|png|jpg|jpeg|gif|svg|webp|avif|ico|txt|xml|json|woff2?|ttf|otf)$/i;
const GOOGLE_SCRIPT_SOURCES = [
  "https://apis.google.com",
  "https://www.gstatic.com",
  "https://ssl.gstatic.com",
];
const GOOGLE_CONNECT_SOURCES = [
  "https://apis.google.com",
  "https://www.googleapis.com",
  "https://oauth2.googleapis.com",
];
const GOOGLE_FRAME_SOURCES = [
  "https://docs.google.com",
  "https://drive.google.com",
  "https://accounts.google.com",
];
const GOOGLE_IMAGE_SOURCES = [
  "https://*.googleusercontent.com",
  "https://lh3.googleusercontent.com",
  "https://drive.google.com",
  "https://docs.google.com",
];

function isTruthy(value: string | undefined | null): boolean {
  return Boolean(value && ["1", "true", "yes", "on"].includes(value.toLowerCase()));
}

function authBypassEnabled(): boolean {
  if (!isTruthy(process.env.AUTH_BYPASS_MODE)) return false;

  const nodeEnv = (process.env.NODE_ENV || "").toLowerCase();
  if (nodeEnv === "production" && !isTruthy(process.env.ALLOW_AUTH_BYPASS_IN_PRODUCTION)) {
    return false;
  }

  return true;
}

function welcomeTourDisabled(): boolean {
  return isTruthy(process.env.DISABLE_WELCOME_TOUR);
}

function routeMatches(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function parseSourceList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[,\s]+/)
    .map((entry) => entry.trim())
    .filter((entry) => Boolean(entry));
}

function mergeUniqueSources(...sourceGroups: string[][]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  sourceGroups.forEach((sources) => {
    sources.forEach((source) => {
      if (seen.has(source)) return;
      seen.add(source);
      merged.push(source);
    });
  });

  return merged;
}

function cspHeader(request: NextRequest, allowIframe = false): string {
  const isProduction = (process.env.NODE_ENV || "").toLowerCase() === "production";
  const scriptSources = mergeUniqueSources(
    ["'self'", "'unsafe-inline'"],
    isProduction ? [] : ["'unsafe-eval'"],
    GOOGLE_SCRIPT_SOURCES,
    parseSourceList(process.env.CSP_EXTRA_SCRIPT_SRC),
  );
  const styleSources = mergeUniqueSources(
    ["'self'", "'unsafe-inline'"],
    parseSourceList(process.env.CSP_EXTRA_STYLE_SRC),
  );
  const imageSources = mergeUniqueSources(
    ["'self'", "data:", "blob:"],
    GOOGLE_IMAGE_SOURCES,
    parseSourceList(process.env.CSP_EXTRA_IMG_SRC),
  );
  const connectSources = mergeUniqueSources(
    ["'self'"],
    isProduction ? [] : ["ws:", "wss:"],
    GOOGLE_CONNECT_SOURCES,
    parseSourceList(process.env.CSP_EXTRA_CONNECT_SRC),
  );
  const frameSources = mergeUniqueSources(
    ["'self'"],
    GOOGLE_FRAME_SOURCES,
    parseSourceList(process.env.CSP_EXTRA_FRAME_SRC),
  );
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    `script-src ${scriptSources.join(" ")}`,
    `style-src ${styleSources.join(" ")}`,
    `img-src ${imageSources.join(" ")}`,
    "font-src 'self' data:",
    `connect-src ${connectSources.join(" ")}`,
    `frame-src ${frameSources.join(" ")}`,
    "manifest-src 'self'",
    "worker-src 'self' blob:",
  ];

  if (allowIframe) {
    const addonAncestors = (
      process.env.ADDON_FRAME_ANCESTORS ||
      "https://docs.google.com https://drive.google.com https://classroom.google.com"
    )
      .split(/[,\s]+/)
      .map((value) => value.trim())
      .filter((value) => Boolean(value));
    directives.push(`frame-ancestors 'self' ${addonAncestors.join(" ")}`);
  } else {
    directives.push("frame-ancestors 'none'");
  }

  if (request.nextUrl.protocol === "https:") {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

function withSecurityHeaders(
  request: NextRequest,
  response: NextResponse,
  allowIframe = false,
): NextResponse {
  if (allowIframe) {
    response.headers.delete("X-Frame-Options");
  } else {
    response.headers.set("X-Frame-Options", "DENY");
  }
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Cross-Origin-Opener-Policy", allowIframe ? "unsafe-none" : "same-origin");
  response.headers.set(
    "Cross-Origin-Resource-Policy",
    allowIframe ? "cross-origin" : "same-origin",
  );
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("Content-Security-Policy", cspHeader(request, allowIframe));
  if (request.nextUrl.protocol === "https:") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  return response;
}

function isBypassedAssetPath(pathname: string): boolean {
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname.startsWith("/icons/")) return true;
  return ASSET_PATH_EXTENSIONS.test(pathname);
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

function hasSessionCookie(request: NextRequest): boolean {
  return SESSION_COOKIE_NAMES.some((cookieName) => Boolean(request.cookies.get(cookieName)?.value));
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const bypassAuth = authBypassEnabled();
  const disableWelcomeTour = welcomeTourDisabled();
  const buildNext = (allowIframe = false) => {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-k12-disable-welcome-tour", disableWelcomeTour ? "1" : "0");
    requestHeaders.set("x-k12-auth-bypass", bypassAuth ? "1" : "0");

    return withSecurityHeaders(
      request,
      NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      }),
      allowIframe,
    );
  };
  const buildRedirect = (url: URL) => withSecurityHeaders(request, NextResponse.redirect(url));

  if (isBypassedAssetPath(pathname)) {
    return withSecurityHeaders(request, NextResponse.next());
  }

  if (routeMatches(pathname, API_ROUTES)) {
    return withSecurityHeaders(request, NextResponse.next());
  }

  if (disableWelcomeTour && routeMatches(pathname, SETUP_ROUTES)) {
    return buildRedirect(new URL("/dashboard", request.url));
  }

  if (bypassAuth && pathname === "/") {
    return buildRedirect(new URL("/dashboard", request.url));
  }

  if (bypassAuth && (pathname === "/login" || pathname === "/auth/callback")) {
    return buildRedirect(new URL("/dashboard", request.url));
  }

  if (routeMatches(pathname, ADDON_ROUTES)) {
    return buildNext(true);
  }

  if (routeMatches(pathname, PUBLIC_ROUTES)) {
    return buildNext();
  }

  const hasSession = hasSessionCookie(request);

  if (!hasSession && shouldEnforceSessionCookie(request) && !bypassAuth) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", `${pathname}${search || ""}`);
    return buildRedirect(loginUrl);
  }

  // Coarse path guard for admin routes. Fine-grained checks stay in ProtectedRoute.
  if (routeMatches(pathname, ADMIN_ROUTES)) {
    return buildNext();
  }

  return buildNext();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
