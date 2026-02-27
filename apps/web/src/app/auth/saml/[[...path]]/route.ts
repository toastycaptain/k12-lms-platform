import type { NextRequest } from "next/server";
import { proxyToCore } from "@/lib/core-proxy";

export const dynamic = "force-dynamic";

function handle(request: NextRequest): Promise<Response> {
  return proxyToCore(request);
}

export const GET = handle;
export const POST = handle;
