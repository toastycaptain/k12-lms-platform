# CODEX_NEXT_MIDDLEWARE_AUTH — Server-Side Route Protection via Next.js Middleware

**Priority:** P1
**Effort:** Small (3–4 hours)
**Spec Refs:** TECH-2.3 (Authentication), PRD-23 (Security)
**Depends on:** None

---

## Problem

The Next.js app has no `middleware.ts`. All route protection happens client-side via the `ProtectedRoute` component, which:

1. **Flashes unauthenticated content** — page renders briefly before redirect
2. **Relies on client-side checks only** — unauthenticated users can hit any page URL and see the layout before being redirected
3. **No server-side session validation** — middleware could verify session cookies at the edge before serving any HTML
4. **No CSRF token pre-fetch** — could optimize first-load performance by validating session server-side

---

## Tasks

### 1. Create Next.js Middleware

Create `apps/web/src/middleware.ts`:

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  "/login",
  "/auth/callback",
  "/unauthorized",
  "/not-authorized",
  "/lti/launch",
  "/lti/deep-link",
];

// Routes that use addon token auth (not session cookies)
const ADDON_ROUTES = ["/addon"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow addon routes (they use Bearer token auth)
  if (ADDON_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow static assets and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get("_k12_lms_session");
  if (!sessionCookie?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Session cookie exists — let the request through
  // (Full auth validation happens via ProtectedRoute + /api/v1/me)
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
```

### 2. Update Login Page

Update `apps/web/src/app/login/page.tsx`:
- Read `redirect` query parameter from URL
- After successful auth callback, redirect to the original URL instead of always going to `/dashboard`
- Preserve the redirect parameter through the OAuth flow

### 3. Add Role-Based Route Protection

Extend middleware for role-based route groups:

```typescript
// Admin routes require admin/curriculum_lead roles
const ADMIN_ROUTES = ["/admin"];

// In middleware, after session check:
// Note: Full role check still happens client-side via ProtectedRoute
// Middleware only does coarse-grained path protection
```

**Important:** Keep `ProtectedRoute` component for fine-grained role checks. Middleware handles the coarse "must be logged in" check at the edge. This is defense-in-depth, not replacement.

### 4. Add Security Headers

Add security headers in middleware response:

```typescript
const response = NextResponse.next();
response.headers.set("X-Frame-Options", "DENY");
response.headers.set("X-Content-Type-Options", "nosniff");
response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
response.headers.set(
  "Permissions-Policy",
  "camera=(), microphone=(), geolocation=()"
);
return response;
```

Exception: Addon routes need `X-Frame-Options: ALLOWALL` since they run inside Google Workspace iframes.

### 5. Add Tests

Create `apps/web/src/middleware.test.ts`:
- Unauthenticated request to `/dashboard` redirects to `/login?redirect=/dashboard`
- Unauthenticated request to `/login` passes through
- Authenticated request (with session cookie) passes through
- Static asset requests pass through
- Addon routes pass through without session check
- Security headers are set on responses

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/web/src/middleware.ts` | Next.js edge middleware |
| `apps/web/src/middleware.test.ts` | Middleware tests |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/web/src/app/login/page.tsx` | Support redirect query parameter |

---

## Definition of Done

- [ ] `middleware.ts` redirects unauthenticated users to `/login`
- [ ] Public routes (login, callback, LTI) bypass auth check
- [ ] Addon routes bypass session check (use Bearer token)
- [ ] Redirect parameter preserved through login flow
- [ ] Security headers set on all responses
- [ ] Addon routes allow iframe embedding
- [ ] All existing tests pass
- [ ] Middleware test file with 6+ test cases
- [ ] No TypeScript errors
