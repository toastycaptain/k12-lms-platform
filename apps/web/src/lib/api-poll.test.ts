import { pollInvocation } from "@/lib/api-poll";
import { apiFetch } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

describe("pollInvocation", () => {
  const mockedApiFetch = vi.mocked(apiFetch);

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("calls onComplete when status is completed", async () => {
    mockedApiFetch.mockResolvedValueOnce({ status: "completed", content: "Done" } as never);

    const onComplete = vi.fn();
    const onError = vi.fn();

    await pollInvocation(1, onComplete, onError, 200, 3);

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ status: "completed" }));
    expect(onError).not.toHaveBeenCalled();
  });

  it("polls until completion", async () => {
    mockedApiFetch
      .mockResolvedValueOnce({ status: "processing" } as never)
      .mockResolvedValueOnce({ status: "completed", content: "Done" } as never);

    const onComplete = vi.fn();

    const promise = pollInvocation(1, onComplete, vi.fn(), 200, 3);
    await vi.advanceTimersByTimeAsync(200);
    await promise;

    expect(mockedApiFetch).toHaveBeenCalledTimes(2);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("calls onError when status is failed", async () => {
    mockedApiFetch.mockResolvedValueOnce({
      status: "failed",
      error_message: "policy denied",
    } as never);

    const onError = vi.fn();

    await pollInvocation(1, vi.fn(), onError, 200, 3);

    expect(onError).toHaveBeenCalledWith("policy denied");
  });

  it("calls onError on timeout", async () => {
    mockedApiFetch
      .mockResolvedValueOnce({ status: "processing" } as never)
      .mockResolvedValueOnce({ status: "processing" } as never);

    const onError = vi.fn();

    const promise = pollInvocation(1, vi.fn(), onError, 100, 2);
    await vi.advanceTimersByTimeAsync(200);
    await promise;

    expect(onError).toHaveBeenCalledWith("Generation timed out");
  });

  it("respects custom interval", async () => {
    mockedApiFetch
      .mockResolvedValueOnce({ status: "processing" } as never)
      .mockResolvedValueOnce({ status: "completed" } as never);

    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

    const promise = pollInvocation(1, vi.fn(), vi.fn(), 500, 3);
    await vi.advanceTimersByTimeAsync(500);
    await promise;

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 500);
  });

  it("uses dynamic import for apiFetch", async () => {
    mockedApiFetch.mockResolvedValueOnce({ status: "completed", id: 1 } as never);

    await pollInvocation(1, vi.fn(), vi.fn(), 100, 1);

    expect(mockedApiFetch).toHaveBeenCalledWith("/api/v1/ai_invocations/1");
  });
});
