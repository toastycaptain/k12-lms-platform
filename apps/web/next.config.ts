import path from "node:path";
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createBundleAnalyzer from "@next/bundle-analyzer";

function resolveHost(value?: string): string | null {
  if (!value) return null;
  if (!value.includes("://")) return value;

  try {
    return new URL(value).hostname || null;
  } catch {
    return null;
  }
}

function resolveOrigin(value?: string): string | null {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      return new URL(value).origin;
    } catch {
      return null;
    }
  }

  if (/^[a-z0-9.-]+$/i.test(value)) {
    return `https://${value}`;
  }

  return null;
}

const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const imageHosts = [
  "lh3.googleusercontent.com",
  "drive.google.com",
  resolveHost(process.env.S3_BUCKET_HOST),
].filter((host): host is string => Boolean(host));

const coreOrigin =
  resolveOrigin(process.env.CORE_URL) ||
  resolveOrigin(process.env.RAILWAY_SERVICE_K12_CORE_URL) ||
  (process.env.NEXT_PUBLIC_API_URL?.startsWith("http")
    ? resolveOrigin(process.env.NEXT_PUBLIC_API_URL)
    : null);

const nextConfig: NextConfig = {
  assetPrefix: process.env.CDN_URL || "",
  images: {
    remotePatterns: imageHosts.map((host) => ({ protocol: "https", hostname: host })),
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  compress: true,
  poweredByHeader: false,
  headers: async () => [
    {
      source: "/_next/static/:path*",
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    },
    {
      source: "/icons/:path*",
      headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
    },
  ],
  rewrites: async () => {
    if (!coreOrigin) return [];

    return [
      {
        source: "/api/v1/:path*",
        destination: `${coreOrigin}/api/v1/:path*`,
      },
      {
        source: "/auth/:path*",
        destination: `${coreOrigin}/auth/:path*`,
      },
    ];
  },
  transpilePackages: ["@k12/ui"],
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    };
    return config;
  },
};

const instrumentedConfig = withBundleAnalyzer(nextConfig);

export default withSentryConfig(instrumentedConfig, {
  silent: true,
});
