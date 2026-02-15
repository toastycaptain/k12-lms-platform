import { apiFetch } from "@/lib/api";

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
});
