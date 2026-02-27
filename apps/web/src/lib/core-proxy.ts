import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PROXY_TIMEOUT_MS = 15000;
const ALLOWED_REQUEST_HEADERS = [
  "accept",
  "accept-language",
  "authorization",
  "content-type",
  "cookie",
  "user-agent",
  "x-request-id",
] as const;

function resolveCoreOrigin(): string | null {
  const candidates = [process.env.CORE_URL, process.env.RAILWAY_SERVICE_K12_CORE_URL].filter(
    (value): value is string => Boolean(value && value.trim()),
  );

  for (const candidate of candidates) {
    const trimmed = candidate.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed.replace(/\/+$/, "");
    }

    if (/^[a-z0-9.-]+$/i.test(trimmed)) {
      return `https://${trimmed}`;
    }
  }

  return null;
}

function copyRequestHeaders(request: NextRequest): Headers {
  const headers = new Headers();

  for (const key of ALLOWED_REQUEST_HEADERS) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }

  const forwardProto =
    request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  const forwardHost = request.headers.get("x-forwarded-host") ?? request.nextUrl.host;
  const forwardFor = request.headers.get("x-forwarded-for");

  headers.set("x-forwarded-proto", forwardProto);
  headers.set("x-forwarded-host", forwardHost);
  if (forwardFor) headers.set("x-forwarded-for", forwardFor);

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

  return nextHeaders;
}

export async function proxyToCore(request: NextRequest): Promise<Response> {
  const coreOrigin = resolveCoreOrigin();
  if (!coreOrigin) {
    return NextResponse.json({ error: "CORE_URL is not configured" }, { status: 500 });
  }

  const upstreamBase = new URL(coreOrigin);
  if (upstreamBase.hostname === request.nextUrl.hostname) {
    console.error("Refusing to proxy to self host", {
      requestHost: request.nextUrl.hostname,
      coreOrigin,
      pathname: request.nextUrl.pathname,
    });
    return NextResponse.json(
      { error: "Core proxy is misconfigured. CORE_URL must point to the core service host." },
      { status: 500 },
    );
  }

  const upstreamUrl = `${upstreamBase.origin}${request.nextUrl.pathname}${request.nextUrl.search}`;
  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : undefined;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method,
      headers: copyRequestHeaders(request),
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
    console.error(`Failed to proxy ${upstreamUrl}`, error);
    return NextResponse.json({ error: "Upstream service unavailable" }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
