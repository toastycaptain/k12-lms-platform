# CODEX_MOBILE_TABLET_PWA — Progressive Web App for Tablet and Mobile Users

**Priority:** P1
**Effort:** Medium (6–8 hours)
**Spec Refs:** PRD-23 (Accessibility, Performance), PRD-8 (Drive attach < 30s — mobile context), UX-3.1 (Clear CTAs)
**Depends on:** None

---

## Problem

K-12 schools heavily use iPads and Chromebooks. Teachers move between classrooms with tablets, and students frequently use shared devices. The platform currently:

1. **No PWA manifest** — cannot be "installed" on home screens; no app-like experience on tablets
2. **No service worker** — no offline caching of static assets; every page load requires full network fetch
3. **Touch targets too small** — many buttons and interactive elements are sized for mouse pointers (< 44x44px)
4. **No responsive breakpoints** — pages render at desktop width on tablets; horizontal scrolling required
5. **Side navigation doesn't collapse** — AppShell left nav takes permanent space on narrow screens
6. **Tables don't adapt** — gradebook, student lists, and admin tables overflow on tablet widths
7. **Forms difficult on mobile** — no input type optimization (e.g., `type="email"` for email fields, `inputMode="numeric"` for grade entry)
8. **No viewport meta tag optimization** — may have default but no testing of zoom behavior
9. **No touch gestures** — swipe to navigate, pull-to-refresh not implemented

---

## Tasks

### 1. Create PWA Manifest

Create `apps/web/public/manifest.json`:

```json
{
  "name": "K-12 Planning + LMS",
  "short_name": "K12 LMS",
  "description": "Curriculum planning, course delivery, and assessment platform",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1e40af",
  "orientation": "any",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

Update `apps/web/src/app/layout.tsx`:
- Add `<link rel="manifest" href="/manifest.json">`
- Add `<meta name="theme-color" content="#1e40af">`
- Add `<meta name="apple-mobile-web-app-capable" content="yes">`
- Add `<meta name="apple-mobile-web-app-status-bar-style" content="default">`
- Add `<link rel="apple-touch-icon" href="/icons/icon-192.png">`

### 2. Create Service Worker for Asset Caching

Create `apps/web/public/sw.js`:

```javascript
const CACHE_NAME = "k12-lms-v1";
const PRECACHE_URLS = ["/login", "/dashboard", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener("fetch", (event) => {
  // Network-first for API calls
  if (event.request.url.includes("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for static assets
  if (
    event.request.url.includes("/_next/static/") ||
    event.request.url.includes("/icons/")
  ) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) => cached || fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
      )
    );
    return;
  }

  // Network-first for pages, with offline fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match("/offline"))
  );
});
```

Register in layout:
```typescript
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js");
}
```

### 3. Create Offline Fallback Page

Create `apps/web/src/app/offline/page.tsx`:
- Simple page with "You are offline" message
- "Try again" button that attempts navigation
- Cached so it's always available

### 4. Make AppShell Responsive

Update `apps/web/src/components/AppShell.tsx`:

**Mobile breakpoint (< 768px):**
- Left nav collapses into a hamburger menu
- Menu opens as a full-screen overlay with larger touch targets
- Close on navigation or outside click
- Bottom tab bar for primary nav items (Plan, Teach, Learn, Admin)

**Tablet breakpoint (768px–1024px):**
- Left nav collapses to icon-only mode (40px wide)
- Hover or click expands to show labels
- Full width for main content

**Desktop (> 1024px):**
- Current layout (expanded left nav)

```typescript
// New hook
export function useBreakpoint() {
  const [bp, setBp] = useState<"mobile" | "tablet" | "desktop">("desktop");

  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 768) setBp("mobile");
      else if (window.innerWidth < 1024) setBp("tablet");
      else setBp("desktop");
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return bp;
}
```

### 5. Add Touch-Friendly Sizing

Update `apps/web/tailwind.config.ts` or create utility classes:

```css
/* Minimum touch target sizes per WCAG 2.5.5 */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}
```

Apply to all interactive elements across the app:
- Buttons: ensure min 44x44px (most `@k12/ui` Button already handles this; verify)
- Table row actions: increase padding on mobile
- Navigation links: increase hit area
- Form inputs: increase height to 44px on mobile
- Checkbox/radio: increase click area

### 6. Make Tables Responsive

Update `apps/web/src/components/ResponsiveTable.tsx` (from `@k12/ui`):

**Mobile (< 768px):**
- Switch from table layout to card layout
- Each row becomes a card with key-value pairs stacked vertically
- Primary column (e.g., student name) becomes card header
- Secondary columns become labeled rows within the card

**Tablet (768px–1024px):**
- Hide non-essential columns (configurable via `hiddenOnTablet` prop)
- Show horizontal scroll indicator for wide tables

### 7. Optimize Forms for Mobile

Audit and update form inputs across the platform:
- Email fields: `type="email"`, `inputMode="email"`, `autoCapitalize="off"`
- Grade entry: `inputMode="decimal"`
- Phone numbers: `type="tel"`
- Search: `type="search"` (shows search keyboard on iOS)
- Date pickers: use native `type="date"` on mobile, custom picker on desktop
- File upload: ensure camera/files sheet appears on mobile

### 8. Add Pull-to-Refresh

Create `apps/web/src/hooks/usePullToRefresh.ts`:

```typescript
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  // Touch event handlers for pull-down gesture
  // Show a refresh indicator when pulled past threshold
  // Call onRefresh and dismiss indicator when complete
  // Only active on mobile/tablet breakpoints
}
```

Integrate on key pages: dashboards, course home, gradebook, student dashboard.

### 9. Create PWA Icon Assets

Create placeholder icons in `apps/web/public/icons/`:
- `icon-192.png` — 192x192 app icon
- `icon-512.png` — 512x512 app icon
- `icon-maskable-512.png` — 512x512 maskable (safe zone) icon
- Use the K-12 LMS brand color (#1e40af) with a book/plan icon

### 10. Add Tests

**Frontend:**
- `apps/web/src/hooks/__tests__/useBreakpoint.test.ts`
  - Returns "desktop" at 1280px
  - Returns "tablet" at 900px
  - Returns "mobile" at 500px
  - Updates on resize

- `apps/web/src/components/__tests__/AppShell.responsive.test.tsx`
  - Renders hamburger menu on mobile
  - Renders icon-only nav on tablet
  - Renders full nav on desktop
  - Bottom tab bar visible on mobile

- `apps/web/src/app/offline/page.test.tsx`
  - Renders offline message
  - Try again button navigates

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/web/public/manifest.json` | PWA manifest |
| `apps/web/public/sw.js` | Service worker for caching |
| `apps/web/public/icons/icon-192.png` | PWA icon (192px) |
| `apps/web/public/icons/icon-512.png` | PWA icon (512px) |
| `apps/web/public/icons/icon-maskable-512.png` | Maskable PWA icon |
| `apps/web/src/app/offline/page.tsx` | Offline fallback page |
| `apps/web/src/hooks/useBreakpoint.ts` | Responsive breakpoint hook |
| `apps/web/src/hooks/usePullToRefresh.ts` | Pull-to-refresh gesture |
| `apps/web/src/hooks/__tests__/useBreakpoint.test.ts` | Breakpoint tests |
| `apps/web/src/components/__tests__/AppShell.responsive.test.tsx` | Responsive layout tests |
| `apps/web/src/app/offline/page.test.tsx` | Offline page tests |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/web/src/app/layout.tsx` | Add PWA meta tags, service worker registration |
| `apps/web/src/components/AppShell.tsx` | Responsive nav (hamburger, icon-only, bottom tabs) |
| `packages/ui/src/ResponsiveTable.tsx` | Card layout on mobile |
| `apps/web/tailwind.config.ts` | Touch target utility classes |

---

## Definition of Done

- [ ] PWA manifest allows "Add to Home Screen" on iOS and Android
- [ ] Service worker caches static assets and provides offline fallback
- [ ] Offline page renders when network unavailable
- [ ] AppShell collapses to hamburger on mobile, icon-only on tablet
- [ ] Bottom tab bar visible on mobile for primary navigation
- [ ] All interactive elements meet 44x44px minimum touch target
- [ ] Tables switch to card layout on mobile
- [ ] Form inputs use appropriate input types for mobile keyboards
- [ ] Pull-to-refresh functional on dashboard pages
- [ ] All responsive tests pass
- [ ] No TypeScript errors
