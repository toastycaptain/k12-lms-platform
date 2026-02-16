import { apiFetchStream, isAbortError } from "@/lib/api-stream";

vi.mock("@/lib/api", () => ({
  buildApiUrl: vi.fn((path: string) => `http://localhost:3001${path}`),
  getCsrfToken: vi.fn(async () => "csrf-token"),
}));

function streamResponse(chunks: string[], status = 200): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    status,
    headers: { "Content-Type": "text/event-stream" },
  });
}

describe("apiFetchStream", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("calls onToken for each streamed token", async () => {
    fetchMock.mockResolvedValueOnce(
      streamResponse(['data: {"token":"hello"}\n', 'data: {"token":" world"}\n']),
    );

    const onToken = vi.fn();
    const onDone = vi.fn();

    await apiFetchStream("/api/v1/ai/stream", { prompt: "x" }, onToken, onDone);

    expect(onToken).toHaveBeenCalledTimes(2);
    expect(onToken).toHaveBeenCalledWith("hello");
    expect(onToken).toHaveBeenCalledWith(" world");
  });

  it("calls onDone when stream completes with done event", async () => {
    fetchMock.mockResolvedValueOnce(
      streamResponse(['data: {"done":true,"content":"full text"}\n']),
    );

    const onDone = vi.fn();

    await apiFetchStream("/api/v1/ai/stream", { prompt: "x" }, vi.fn(), onDone);

    expect(onDone).toHaveBeenCalledWith("full text");
  });

  it("calls onDone with accumulated text on reader completion", async () => {
    fetchMock.mockResolvedValueOnce(
      streamResponse(['data: {"token":"Part"}\n', 'data: {"token":" two"}\n']),
    );

    const onDone = vi.fn();

    await apiFetchStream("/api/v1/ai/stream", { prompt: "x" }, vi.fn(), onDone);

    expect(onDone).toHaveBeenCalledWith("Part two");
  });

  it("calls onError for stream error events", async () => {
    fetchMock.mockResolvedValueOnce(streamResponse(['data: {"error":"rate limit"}\n']));

    const onError = vi.fn();

    await expect(
      apiFetchStream("/api/v1/ai/stream", { prompt: "x" }, vi.fn(), vi.fn(), onError),
    ).rejects.toThrow("rate limit");
    expect(onError).toHaveBeenCalledWith("rate limit");
  });

  it("calls onError for HTTP error responses", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("server down", {
        status: 500,
        statusText: "Server Error",
      }),
    );

    const onError = vi.fn();

    await expect(
      apiFetchStream("/api/v1/ai/stream", { prompt: "x" }, vi.fn(), vi.fn(), onError),
    ).rejects.toThrow("server down");
    expect(onError).toHaveBeenCalledWith("server down");
  });

  it("handles abort signal", async () => {
    fetchMock.mockRejectedValueOnce(new DOMException("Aborted", "AbortError"));

    const controller = new AbortController();
    controller.abort();

    await expect(
      apiFetchStream(
        "/api/v1/ai/stream",
        { prompt: "x" },
        vi.fn(),
        vi.fn(),
        vi.fn(),
        controller.signal,
      ),
    ).rejects.toMatchObject({ name: "AbortError" });

    expect(isAbortError(new DOMException("Aborted", "AbortError"))).toBe(true);
  });

  it("ignores non-data SSE lines", async () => {
    fetchMock.mockResolvedValueOnce(
      streamResponse([": comment\n", "\n", 'data: {"token":"ok"}\n']),
    );

    const onToken = vi.fn();

    await apiFetchStream("/api/v1/ai/stream", { prompt: "x" }, onToken, vi.fn());

    expect(onToken).toHaveBeenCalledTimes(1);
    expect(onToken).toHaveBeenCalledWith("ok");
  });

  it("ignores [DONE] sentinel", async () => {
    fetchMock.mockResolvedValueOnce(
      streamResponse(["data: [DONE]\n", 'data: {"token":"after"}\n']),
    );

    const onToken = vi.fn();

    await apiFetchStream("/api/v1/ai/stream", { prompt: "x" }, onToken, vi.fn());

    expect(onToken).toHaveBeenCalledWith("after");
  });
});
