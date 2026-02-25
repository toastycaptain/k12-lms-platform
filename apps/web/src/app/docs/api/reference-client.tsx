"use client";

import dynamic from "next/dynamic";

type SwaggerComponentProps = {
  url: string;
  docExpansion?: "list" | "full" | "none";
};

const SwaggerUI = dynamic<SwaggerComponentProps>(() => import("swagger-ui-react"), {
  ssr: false,
  loading: () => (
    <div className="rounded border border-slate-200 bg-white p-4">Loading API reference...</div>
  ),
});

function openApiUrl(): string {
  const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/+$/, "");
  const origin = base.endsWith("/api/v1") ? base.slice(0, -"/api/v1".length) : base;
  return `${origin}/api/v1/openapi.json`;
}

export default function ApiReferenceClient() {
  return <SwaggerUI url={openApiUrl()} docExpansion="list" />;
}
