import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function resolveCoreOrigin(): string | null {
  const candidates = [
    process.env.CORE_URL,
    process.env.RAILWAY_SERVICE_K12_CORE_URL,
    process.env.RAILWAY_PRIVATE_DOMAIN,
  ].filter((value): value is string => Boolean(value && value.trim()));

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
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");
  return headers;
}

export async function proxyToCore(request: NextRequest): Promise<Response> {
  const coreOrigin = resolveCoreOrigin();
  if (!coreOrigin) {
    return NextResponse.json({ error: "CORE_URL is not configured" }, { status: 500 });
  }

  const upstreamUrl = `${coreOrigin}${request.nextUrl.pathname}${request.nextUrl.search}`;
  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : undefined;

  const upstreamResponse = await fetch(upstreamUrl, {
    method,
    headers: copyRequestHeaders(request),
    body,
    redirect: "manual",
  });

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: upstreamResponse.headers,
  });
}
