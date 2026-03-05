import { buildAuthUrlWithRedirect, sanitizeRedirectPath } from "@/lib/auth-redirect";

describe("sanitizeRedirectPath", () => {
  it("keeps safe in-app redirect paths", () => {
    expect(sanitizeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/teach/courses/1?tab=gradebook#scores")).toBe(
      "/teach/courses/1?tab=gradebook#scores",
    );
  });

  it("rejects open-redirect and malformed values", () => {
    expect(sanitizeRedirectPath("//evil.example")).toBeNull();
    expect(sanitizeRedirectPath("/\\evil")).toBeNull();
    expect(sanitizeRedirectPath("https://evil.example")).toBeNull();
    expect(sanitizeRedirectPath("/dashboard\u0000")).toBeNull();
  });
});

describe("buildAuthUrlWithRedirect", () => {
  it("appends redirect query for relative auth paths", () => {
    expect(buildAuthUrlWithRedirect("/auth/google_oauth2", "/dashboard")).toBe(
      "/auth/google_oauth2?redirect=%2Fdashboard",
    );
  });

  it("appends redirect query for absolute auth URLs", () => {
    expect(buildAuthUrlWithRedirect("https://example.com/auth/google_oauth2", "/dashboard")).toBe(
      "https://example.com/auth/google_oauth2?redirect=%2Fdashboard",
    );
  });
});
