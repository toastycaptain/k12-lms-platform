import type { NextRequest } from "next/server";
import { proxyToCore } from "@/lib/core-proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function handle(request: NextRequest): Promise<Response> {
  return proxyToCore(request);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
export const HEAD = handle;
