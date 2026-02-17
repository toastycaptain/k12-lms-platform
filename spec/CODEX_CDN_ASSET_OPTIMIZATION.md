# CODEX_CDN_ASSET_OPTIMIZATION — CDN Configuration, Image Optimization, and Bundle Analysis

**Priority:** P1
**Effort:** Medium (6–8 hours)
**Spec Refs:** PRD-23 (Performance), PRD-8 (Drive attach < 30s), TECH-2.1 (System Architecture)
**Depends on:** None

---

## Problem

K-12 schools often have constrained bandwidth (shared across hundreds of devices). Currently:

1. **No CDN** — all static assets served directly from the Next.js server; no edge caching
2. **No bundle analysis** — unknown total JS bundle size; no code splitting audit
3. **No image optimization** — uploaded images served at original resolution; no Next.js Image optimization
4. **No font loading strategy** — Google Fonts loaded synchronously blocking first paint
5. **No lazy loading** — all page components load eagerly; heavy pages (gradebook, analytics) load full JS
6. **No compression verification** — gzip/brotli may not be configured on all responses
7. **Service worker caches indiscriminately** — Batch 6 added a basic service worker but no cache versioning or selective caching strategy

---

## Tasks

### 1. Configure CDN for Static Assets

Update `apps/web/next.config.ts`:

```typescript
const nextConfig = {
  assetPrefix: process.env.CDN_URL || "",
  images: {
    domains: [
      "lh3.googleusercontent.com",    // Google profile photos
      "drive.google.com",              // Drive file thumbnails
      process.env.S3_BUCKET_HOST,      // Active Storage
    ].filter(Boolean),
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  compress: true,
  poweredByHeader: false,
  headers: async () => [
    {
      source: "/_next/static/:path*",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
    {
      source: "/icons/:path*",
      headers: [
        { key: "Cache-Control", value: "public, max-age=86400" },
      ],
    },
  ],
};
```

Create `infrastructure/cdn/cloudfront.md` — Document CDN setup:
- CloudFront distribution pointing to Next.js origin
- Cache behaviors: `/_next/static/*` → 1 year, `/_next/image/*` → 1 day, `/*` → no cache
- Origin headers: forward cookies only for non-static paths
- Custom error pages: 404, 503

### 2. Analyze and Reduce Bundle Size

Add bundle analyzer:

```bash
cd apps/web && npm install --save-dev @next/bundle-analyzer
```

Update `apps/web/next.config.ts`:
```typescript
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

module.exports = withBundleAnalyzer(nextConfig);
```

Run analysis: `ANALYZE=true npm run build`

Common optimizations to apply:
- **Dynamic imports** for heavy page sections:
  ```typescript
  const GradebookGrid = dynamic(() => import("@/components/GradebookGrid"), {
    loading: () => <GradebookSkeleton />,
  });
  ```
- **Tree-shake unused exports** — verify @k12/ui components are individually importable
- **Replace heavy dependencies** — if any large libraries found (moment.js → date-fns, lodash → individual imports)
- **Route-based code splitting** — verify Next.js App Router is correctly splitting per page

Document bundle size baseline:
```markdown
| Route | JS Size (gzip) | Target |
|-------|----------------|--------|
| /login | < 50KB | 50KB |
| /dashboard | < 100KB | 100KB |
| /plan/units | < 80KB | 100KB |
| /teach/courses/[id]/gradebook | < 120KB | 150KB |
| /admin/analytics | < 100KB | 150KB |
```

### 3. Optimize Image Loading

Update all `<img>` tags across the app to use Next.js `<Image>`:

```typescript
import Image from "next/image";

// Before: <img src={user.avatar} />
// After:
<Image
  src={user.avatar}
  width={40}
  height={40}
  alt={user.name}
  loading="lazy"
/>
```

Key pages to audit:
- Student/teacher profile avatars
- Resource library thumbnails
- Portfolio entry previews
- Dashboard cards

### 4. Optimize Font Loading

Update `apps/web/src/app/layout.tsx`:

```typescript
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-inter",
});
```

Remove any `<link>` tags loading Google Fonts from CDN — use Next.js font optimization instead.

### 5. Add Lazy Loading for Heavy Components

Identify and lazy-load heavy components:

```typescript
// Gradebook page
const GradebookGrid = dynamic(() => import("./GradebookGrid"), {
  loading: () => <GradebookSkeleton />,
  ssr: false,
});

// Analytics charts
const TrendChart = dynamic(() => import("@/components/TrendChart"), {
  loading: () => <div className="h-64 animate-pulse bg-gray-100 rounded" />,
  ssr: false,
});

// AI Assistant Panel
const AiAssistantPanel = dynamic(() => import("@/components/AiAssistantPanel"), {
  ssr: false,
});

// Version Diff viewer
const VersionDiff = dynamic(() => import("@/components/VersionDiff"), {
  loading: () => <DiffSkeleton />,
  ssr: false,
});
```

### 6. Update Service Worker Caching Strategy

Update `apps/web/public/sw.js` with versioned cache and selective strategy:

```javascript
const CACHE_VERSION = "k12-v2";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Precache critical routes
const PRECACHE = ["/login", "/offline", "/dashboard"];

// Cache-first for static assets with versioned cache
// Network-first for API calls with 5s timeout fallback to cache
// Stale-while-revalidate for page navigations

self.addEventListener("activate", (event) => {
  // Clean old cache versions
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k)))
    )
  );
});
```

### 7. Enable Compression Verification

Create a test to verify responses are compressed:

```typescript
// apps/web/e2e/performance/compression.spec.ts
test("Static assets are gzip/brotli compressed", async ({ request }) => {
  const res = await request.get("/_next/static/chunks/main.js", {
    headers: { "Accept-Encoding": "gzip, br" },
  });
  const encoding = res.headers()["content-encoding"];
  expect(["gzip", "br"]).toContain(encoding);
});
```

### 8. Add Performance Monitoring

Create `apps/web/src/lib/performance.ts`:

```typescript
export function reportWebVitals() {
  if (typeof window === "undefined") return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      // Report to analytics endpoint
      fetch("/api/v1/analytics/web_vitals", {
        method: "POST",
        body: JSON.stringify({
          name: entry.name,
          value: entry.startTime,
          path: window.location.pathname,
        }),
        keepalive: true,
      }).catch(() => {}); // Fire and forget
    }
  });

  observer.observe({ type: "largest-contentful-paint", buffered: true });
  observer.observe({ type: "first-input", buffered: true });
  observer.observe({ type: "layout-shift", buffered: true });
}
```

### 9. Add Tests

- `apps/web/e2e/performance/compression.spec.ts` — Verify gzip/brotli
- `apps/web/e2e/performance/cache-headers.spec.ts` — Verify static asset cache headers
- `apps/web/src/lib/__tests__/performance.test.ts` — Web vitals reporting
- Bundle size check in CI: fail if any route exceeds threshold

---

## Files to Create

| File | Purpose |
|------|---------|
| `infrastructure/cdn/cloudfront.md` | CDN configuration documentation |
| `apps/web/src/lib/performance.ts` | Web Vitals reporting |
| `apps/web/e2e/performance/compression.spec.ts` | Compression verification |
| `apps/web/e2e/performance/cache-headers.spec.ts` | Cache header verification |
| `docs/BUNDLE_SIZE_BASELINES.md` | Bundle size targets per route |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/web/next.config.ts` | CDN prefix, image config, compression, headers |
| `apps/web/package.json` | Add @next/bundle-analyzer |
| `apps/web/src/app/layout.tsx` | Next.js font optimization |
| `apps/web/public/sw.js` | Versioned cache, selective strategy |
| Various pages | Dynamic imports for heavy components |
| Various components | Replace `<img>` with Next.js `<Image>` |

---

## Definition of Done

- [ ] CDN configuration documented and asset prefix configurable via env
- [ ] Static assets cached for 1 year with immutable header
- [ ] Bundle analysis completed with per-route size baselines documented
- [ ] Heavy components (gradebook, charts, AI panel, diff viewer) lazy-loaded
- [ ] Next.js Image component used for all images with avif/webp formats
- [ ] Font loading uses next/font with display swap
- [ ] Service worker uses versioned caches with proper cleanup
- [ ] Compression verified on static assets
- [ ] Web Vitals reported to analytics
- [ ] No route exceeds 150KB gzipped JS
- [ ] All performance tests pass
