import type { NextRequest } from "next/server";
import { proxyToCore } from "@/lib/core-proxy";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  return proxyToCore(request);
}
