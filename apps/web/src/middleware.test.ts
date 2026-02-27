import type { NextRequest } from "next/server";
import { middleware } from "@/middleware";

function buildRequest(path: string, sessionCookie?: string): NextRequest {
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
        if (name === "_k12_lms_session" && sessionCookie) {
          return { name, value: sessionCookie };
        }

        return undefined;
      },
    },
  } as unknown as NextRequest;
}

describe("middleware", () => {
  const previousApiUrl = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = previousApiUrl;
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_API_URL = previousApiUrl;
  });

  it("redirects unauthenticated dashboard requests to login with redirect param", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://k12.example.com/api/v1";
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

  it("allows static asset requests", () => {
    const response = middleware(buildRequest("/_next/static/chunks/app.js"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("allows addon routes without session and sets iframe-friendly header", () => {
    const response = middleware(buildRequest("/addon/workspace"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("X-Frame-Options")).toBe("ALLOWALL");
  });

  it("applies security headers to protected responses", () => {
    const response = middleware(buildRequest("/teach/courses/1", "session-123"));

    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(response.headers.get("Permissions-Policy")).toBe(
      "camera=(), microphone=(), geolocation=()",
    );
  });

  it("applies coarse admin route protection", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://k12.example.com/api/v1";
    const response = middleware(buildRequest("/admin/users"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login?redirect=%2Fadmin%2Fusers");
  });

  it("does not enforce web cookie redirects when API host is cross-origin", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://k12-core.example.com/api/v1";

    const response = middleware(buildRequest("/dashboard"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
  });
});
