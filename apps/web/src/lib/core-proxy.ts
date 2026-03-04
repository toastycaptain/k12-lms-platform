import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PROXY_TIMEOUT_MS = 15000;
const DEFAULT_MAX_PROXY_BODY_BYTES = 10 * 1024 * 1024;
const RATE_LIMIT_WINDOW_MS = 60_000;
const AUTH_RATE_LIMIT = 60;
const MUTATION_RATE_LIMIT = 180;
const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const ALLOWED_REQUEST_HEADERS = [
  "accept",
  "accept-language",
  "authorization",
  "content-type",
  "cookie",
  "origin",
  "referer",
  "user-agent",
  "x-csrf-token",
  "x-request-id",
  "x-requested-with",
  "x-school-id",
] as const;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

declare global {
  var __k12CoreProxyRateLimitStore: Map<string, RateLimitEntry> | undefined;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

const MAX_PROXY_BODY_BYTES = parsePositiveInt(
  process.env.MAX_PROXY_BODY_BYTES,
  DEFAULT_MAX_PROXY_BODY_BYTES,
);

function resolveCoreOrigin(): URL | null {
  const candidates = [process.env.CORE_URL, process.env.RAILWAY_SERVICE_K12_CORE_URL].filter(
    (value): value is string => Boolean(value && value.trim()),
  );
  const allowInsecureInProduction = process.env.ALLOW_INSECURE_CORE_URL === "true";
  const isProduction = (process.env.NODE_ENV || "").toLowerCase() === "production";

  for (const candidate of candidates) {
    const trimmed = candidate.trim();
    const normalized =
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`;

    try {
      const nextOrigin = new URL(normalized.replace(/\/+$/, ""));
      if (isProduction && nextOrigin.protocol !== "https:" && !allowInsecureInProduction) {
        continue;
      }
      return nextOrigin;
    } catch {
      // Skip malformed candidate.
    }
  }

  return null;
}

function isApiV1Path(pathname: string): boolean {
  return pathname === "/api/v1" || pathname.startsWith("/api/v1/");
}

function isAuthPath(pathname: string): boolean {
  return pathname === "/auth" || pathname.startsWith("/auth/");
}

function isMutationMethod(method: string): boolean {
  return MUTATION_METHODS.has(method.toUpperCase());
}

function readForwardedIp(request: NextRequest): string | null {
  const nextRequestWithIp = request as NextRequest & { ip?: string };
  const requestIp = nextRequestWithIp.ip;
  if (requestIp && /^[0-9a-fA-F:.]+$/.test(requestIp)) {
    return requestIp;
  }

  const headerValue = request.headers.get("x-forwarded-for");
  if (!headerValue) return null;

  const firstIp = headerValue
    .split(",")
    .map((value) => value.trim())
    .find((value) => /^[0-9a-fA-F:.]+$/.test(value));

  return firstIp || null;
}

function copyRequestHeaders(request: NextRequest, requestId: string): Headers {
  const headers = new Headers();

  for (const key of ALLOWED_REQUEST_HEADERS) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }

  headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));
  headers.set("x-forwarded-host", request.nextUrl.host);
  headers.set("x-request-id", requestId);

  const forwardedIp = readForwardedIp(request);
  if (forwardedIp) {
    headers.set("x-forwarded-for", forwardedIp);
  }

  return headers;
}

function sanitizeResponseHeaders(headers: Headers): Headers {
  const nextHeaders = new Headers(headers);
  const hopByHopHeaders = [
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
  ];

  for (const header of hopByHopHeaders) {
    nextHeaders.delete(header);
  }

  const hiddenResponseHeaders = [
    "access-control-allow-origin",
    "access-control-allow-credentials",
    "access-control-allow-headers",
    "access-control-allow-methods",
    "access-control-expose-headers",
    "access-control-max-age",
    "server",
    "x-powered-by",
    "x-runtime",
  ];

  for (const header of hiddenResponseHeaders) {
    nextHeaders.delete(header);
  }

  nextHeaders.set("x-content-type-options", "nosniff");

  return nextHeaders;
}

function hasCookieAuth(request: NextRequest): boolean {
  return Boolean(request.headers.get("cookie"));
}

function isSameOriginRequest(request: NextRequest): boolean {
  const currentOrigin = request.nextUrl.origin;
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (origin) {
    try {
      if (new URL(origin).origin !== currentOrigin) return false;
    } catch {
      return false;
    }
  }

  if (referer) {
    try {
      if (new URL(referer).origin !== currentOrigin) return false;
    } catch {
      return false;
    }
  }

  return true;
}

function getRateLimitStore(): Map<string, RateLimitEntry> {
  globalThis.__k12CoreProxyRateLimitStore ||= new Map<string, RateLimitEntry>();
  return globalThis.__k12CoreProxyRateLimitStore;
}

function applyRateLimit(request: NextRequest, method: string): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  const isAuthRequest = isAuthPath(pathname) || pathname === "/api/v1/session";
  const isMutation = isMutationMethod(method);

  if (!isAuthRequest && !(isApiV1Path(pathname) && isMutation)) {
    return null;
  }

  const ip = readForwardedIp(request) || "unknown";
  const limitType = isAuthRequest ? "auth" : "mutation";
  const max = isAuthRequest ? AUTH_RATE_LIMIT : MUTATION_RATE_LIMIT;
  const now = Date.now();
  const key = `${limitType}:${ip}`;
  const store = getRateLimitStore();
  if (store.size > 5000) {
    for (const [storedKey, entry] of store.entries()) {
      if (entry.resetAt <= now) {
        store.delete(storedKey);
      }
    }
  }
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }

  if (current.count >= max) {
    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return NextResponse.json(
      { error: "Too many requests. Please retry shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
        },
      },
    );
  }

  current.count += 1;
  store.set(key, current);
  return null;
}

function validateMutationRequest(request: NextRequest, method: string): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  if (!isApiV1Path(pathname) || !isMutationMethod(method) || !hasCookieAuth(request)) {
    return null;
  }

  if (!request.headers.get("x-csrf-token")) {
    return NextResponse.json(
      { error: "Missing CSRF token for authenticated mutation request." },
      { status: 403 },
    );
  }

  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "Cross-origin mutation request blocked by proxy policy." },
      { status: 403 },
    );
  }

  return null;
}

export async function proxyToCore(request: NextRequest): Promise<Response> {
  const method = request.method.toUpperCase();
  const rateLimitedResponse = applyRateLimit(request, method);
  if (rateLimitedResponse) {
    return rateLimitedResponse;
  }

  const invalidMutationResponse = validateMutationRequest(request, method);
  if (invalidMutationResponse) {
    return invalidMutationResponse;
  }

  const coreOrigin = resolveCoreOrigin();
  if (!coreOrigin) {
    return NextResponse.json({ error: "CORE_URL is not configured" }, { status: 500 });
  }

  if (coreOrigin.hostname === request.nextUrl.hostname) {
    console.error("Refusing to proxy to self host", {
      requestHost: request.nextUrl.hostname,
      coreOrigin: coreOrigin.origin,
      pathname: request.nextUrl.pathname,
    });
    return NextResponse.json(
      { error: "Core proxy is misconfigured. CORE_URL must point to the core service host." },
      { status: 500 },
    );
  }

  const upstreamUrl = `${coreOrigin.origin}${request.nextUrl.pathname}${request.nextUrl.search}`;
  const hasBody = method !== "GET" && method !== "HEAD";
  const requestId = request.headers.get("x-request-id") || randomUUID();
  const declaredContentLength = Number.parseInt(request.headers.get("content-length") || "0", 10);

  if (
    hasBody &&
    Number.isFinite(declaredContentLength) &&
    declaredContentLength > MAX_PROXY_BODY_BYTES
  ) {
    return NextResponse.json({ error: "Request body exceeds proxy limit." }, { status: 413 });
  }

  const body = hasBody ? await request.arrayBuffer() : undefined;
  if (body && body.byteLength > MAX_PROXY_BODY_BYTES) {
    return NextResponse.json({ error: "Request body exceeds proxy limit." }, { status: 413 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method,
      headers: copyRequestHeaders(request, requestId),
      body,
      redirect: "manual",
      signal: controller.signal,
      cache: "no-store",
    });

    const responseHeaders = sanitizeResponseHeaders(new Headers(upstreamResponse.headers));
    const bodyAllowed =
      method !== "HEAD" && upstreamResponse.status !== 204 && upstreamResponse.status !== 304;
    const responseBody = bodyAllowed ? await upstreamResponse.arrayBuffer() : null;

    return new Response(responseBody, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Upstream service timed out" }, { status: 504 });
    }

    console.error(`Failed to proxy ${request.nextUrl.pathname}`, error);
    return NextResponse.json({ error: "Upstream service unavailable" }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
