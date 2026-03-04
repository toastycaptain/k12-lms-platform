import type { NextRequest } from "next/server";
import { middleware } from "@/middleware";

function buildRequest(
  path: string,
  sessionCookie?: string,
  sessionCookieName = "_k12_lms_session",
): NextRequest {
  const url = new URL(path, "https://k12.example.com");

  return {
    nextUrl: {
      hostname: url.hostname,
      pathname: url.pathname,
      search: url.search,
    },
    url: url.toString(),
    cookies: {
      get: (name: string) => {
        if (name === sessionCookieName && sessionCookie) {
          return { name, value: sessionCookie };
        }

        return undefined;
      },
    },
  } as unknown as NextRequest;
}

describe("middleware", () => {
  const env = process.env as Record<string, string | undefined>;
  const previousApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const previousAuthBypassMode = process.env.AUTH_BYPASS_MODE;
  const previousDisableWelcomeTour = process.env.DISABLE_WELCOME_TOUR;
  const previousAllowAuthBypassInProd = process.env.ALLOW_AUTH_BYPASS_IN_PRODUCTION;
  const previousNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    env.NEXT_PUBLIC_API_URL = previousApiUrl;
    env.AUTH_BYPASS_MODE = previousAuthBypassMode;
    env.DISABLE_WELCOME_TOUR = previousDisableWelcomeTour;
    env.ALLOW_AUTH_BYPASS_IN_PRODUCTION = previousAllowAuthBypassInProd;
    env.NODE_ENV = previousNodeEnv;
  });

  afterAll(() => {
    env.NEXT_PUBLIC_API_URL = previousApiUrl;
    env.AUTH_BYPASS_MODE = previousAuthBypassMode;
    env.DISABLE_WELCOME_TOUR = previousDisableWelcomeTour;
    env.ALLOW_AUTH_BYPASS_IN_PRODUCTION = previousAllowAuthBypassInProd;
    env.NODE_ENV = previousNodeEnv;
  });

  it("redirects unauthenticated dashboard requests to login with redirect param", () => {
    env.NEXT_PUBLIC_API_URL = "https://k12.example.com/api/v1";
    const response = middleware(buildRequest("/dashboard"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login?redirect=%2Fdashboard");
  });

  it("allows unauthenticated access to login route", () => {
    const response = middleware(buildRequest("/login"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("allows unauthenticated access to docs routes", () => {
    const response = middleware(buildRequest("/docs/api"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("allows unauthenticated access to auth routes", () => {
    const response = middleware(buildRequest("/auth/google_oauth2"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("allows authenticated requests through", () => {
    const response = middleware(buildRequest("/dashboard", "session-123"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("recognizes secure session cookie names used in production", () => {
    const secureCookieResponse = middleware(
      buildRequest("/dashboard", "session-123", "__Secure-k12_lms_session"),
    );
    const hostCookieResponse = middleware(
      buildRequest("/dashboard", "session-123", "__Host-k12_lms_session"),
    );

    expect(secureCookieResponse.headers.get("location")).toBeNull();
    expect(hostCookieResponse.headers.get("location")).toBeNull();
  });

  it("allows static asset requests", () => {
    const response = middleware(buildRequest("/_next/static/chunks/app.js"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("allows addon routes without session and sets iframe-friendly header", () => {
    const response = middleware(buildRequest("/addon/workspace"));
    const csp = response.headers.get("Content-Security-Policy") || "";

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("X-Frame-Options")).toBeNull();
    expect(csp).toContain("frame-ancestors");
    expect(csp).toContain("frame-src 'self' https://docs.google.com https://drive.google.com");
    expect(csp).toContain("script-src");
    expect(csp).toContain("https://apis.google.com");
  });

  it("applies security headers to protected responses", () => {
    const response = middleware(buildRequest("/teach/courses/1", "session-123"));
    const csp = response.headers.get("Content-Security-Policy") || "";

    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(response.headers.get("Cross-Origin-Opener-Policy")).toBe("same-origin");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("connect-src");
    expect(csp).toContain("https://www.googleapis.com");
    expect(response.headers.get("Permissions-Policy")).toBe(
      "camera=(), microphone=(), geolocation=()",
    );
  });

  it("does not include unsafe-eval in production csp", () => {
    env.NODE_ENV = "production";
    const response = middleware(buildRequest("/teach/courses/1", "session-123"));
    const csp = response.headers.get("Content-Security-Policy") || "";

    expect(csp).not.toContain("'unsafe-eval'");
  });

  it("applies coarse admin route protection", () => {
    env.NEXT_PUBLIC_API_URL = "https://k12.example.com/api/v1";
    const response = middleware(buildRequest("/admin/users"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login?redirect=%2Fadmin%2Fusers");
  });

  it("does not enforce web cookie redirects when API host is cross-origin", () => {
    env.NEXT_PUBLIC_API_URL = "https://k12-core.example.com/api/v1";

    const response = middleware(buildRequest("/dashboard"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("redirects root to dashboard when auth bypass mode is enabled", () => {
    env.AUTH_BYPASS_MODE = "true";

    const response = middleware(buildRequest("/"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/dashboard");
  });

  it("ignores auth bypass mode in production unless explicitly allowed", () => {
    env.NODE_ENV = "production";
    env.AUTH_BYPASS_MODE = "true";
    env.NEXT_PUBLIC_API_URL = "https://k12.example.com/api/v1";

    const response = middleware(buildRequest("/dashboard"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login?redirect=%2Fdashboard");
  });

  it("allows auth bypass mode in production when explicitly allowed", () => {
    env.NODE_ENV = "production";
    env.AUTH_BYPASS_MODE = "true";
    env.ALLOW_AUTH_BYPASS_IN_PRODUCTION = "true";
    env.NEXT_PUBLIC_API_URL = "https://k12.example.com/api/v1";

    const response = middleware(buildRequest("/dashboard"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects login to dashboard when auth bypass mode is enabled", () => {
    env.AUTH_BYPASS_MODE = "true";

    const response = middleware(buildRequest("/login"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/dashboard");
  });

  it("does not force unauthenticated users to login when auth bypass mode is enabled", () => {
    env.AUTH_BYPASS_MODE = "true";
    env.NEXT_PUBLIC_API_URL = "https://k12.example.com/api/v1";

    const response = middleware(buildRequest("/teach/courses"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("redirects setup route to dashboard when welcome tour is disabled", () => {
    env.DISABLE_WELCOME_TOUR = "true";

    const response = middleware(buildRequest("/setup"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/dashboard");
  });
});
