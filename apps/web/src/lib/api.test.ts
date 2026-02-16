import { apiFetch, fetchCurrentUser, getAuthUrl, getSamlAuthUrl, getSignOutUrl } from "@/lib/api";

describe("apiFetch", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("returns parsed JSON on success and sends default headers", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await apiFetch<{ ok: boolean }>("/api/v1/courses", {
      method: "POST",
      body: JSON.stringify({ title: "Math" }),
    });

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/api/v1/courses",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        cache: "no-store",
      }),
    );

    const options = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = options.headers as Headers;
    expect(headers.get("Accept")).toBe("application/json");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("raises ApiError for 401 responses and preserves status/message", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        statusText: "Unauthorized",
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(apiFetch("/api/v1/me")).rejects.toEqual(
      expect.objectContaining({
        status: 401,
        message: "Unauthorized",
      }),
    );
  });

  it("falls back to status text when error body is not JSON", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("upstream failure", {
        status: 500,
        statusText: "Internal Server Error",
        headers: { "Content-Type": "text/plain" },
      }),
    );

    await expect(apiFetch("/api/v1/courses")).rejects.toEqual(
      expect.objectContaining({
        status: 500,
        message: "API error: Internal Server Error",
      }),
    );
  });

  it("returns undefined for 204 No Content responses", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    const result = await apiFetch("/api/v1/session", { method: "DELETE" });

    expect(result).toBeUndefined();
  });

  it("sets X-School-Id header from localStorage", async () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: vi.fn((key: string) => (key === "k12.selectedSchoolId" ? "42" : null)),
      },
    });
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await apiFetch("/api/v1/courses");

    const options = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = options.headers as Headers;
    expect(headers.get("X-School-Id")).toBe("42");
  });

  it("does not set Content-Type for FormData bodies", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const form = new FormData();
    form.append("file", "x");
    await apiFetch("/api/v1/uploads", {
      method: "POST",
      body: form,
    });

    const options = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = options.headers as Headers;
    expect(headers.get("Content-Type")).toBeNull();
  });

  it('includes credentials: "include" on every request', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await apiFetch("/api/v1/me");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/api/v1/me",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("buildUrl handles double /api/v1 prefix", async () => {
    const previousUrl = process.env.NEXT_PUBLIC_API_URL;
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:3001/api/v1";
    vi.resetModules();

    const scopedFetchMock = vi.fn();
    vi.stubGlobal("fetch", scopedFetchMock);
    const { apiFetch: scopedApiFetch } = await import("@/lib/api");

    scopedFetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await scopedApiFetch("/api/v1/courses");

    expect(scopedFetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/api/v1/courses",
      expect.anything(),
    );

    process.env.NEXT_PUBLIC_API_URL = previousUrl;
    vi.resetModules();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("getAuthUrl returns correct URL", () => {
    expect(getAuthUrl()).toBe("http://localhost:3001/auth/google_oauth2");
  });

  it("getSamlAuthUrl includes tenant parameter", () => {
    expect(getSamlAuthUrl("lincoln-high")).toBe(
      "http://localhost:3001/auth/saml?tenant=lincoln-high",
    );
  });

  it("getSignOutUrl returns session URL", () => {
    expect(getSignOutUrl()).toBe("http://localhost:3001/api/v1/session");
  });

  it("fetchCurrentUser maps API response to CurrentUser shape", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          user: {
            id: 9,
            email: "teacher@example.com",
            first_name: "Taylor",
            last_name: "Teacher",
            roles: ["teacher"],
            google_connected: true,
            onboarding_complete: true,
            preferences: { theme: "light" },
          },
          tenant: {
            id: 3,
            name: "Lincoln High",
            slug: "lincoln-high",
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    const user = await fetchCurrentUser();

    expect(user).toEqual({
      id: 9,
      email: "teacher@example.com",
      first_name: "Taylor",
      last_name: "Teacher",
      tenant_id: 3,
      roles: ["teacher"],
      google_connected: true,
      onboarding_complete: true,
      preferences: { theme: "light" },
    });
  });
});
