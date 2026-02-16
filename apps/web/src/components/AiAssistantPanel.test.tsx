import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AiAssistantPanel from "@/components/AiAssistantPanel";
import { apiFetch, ApiError } from "@/lib/api";
import { apiFetchStream, isAbortError } from "@/lib/api-stream";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = "ApiError";
    }
  },
}));

vi.mock("@/lib/api-stream", () => ({
  apiFetchStream: vi.fn(),
  isAbortError: vi.fn(
    (error: unknown) => error instanceof DOMException && error.name === "AbortError",
  ),
}));

describe("AiAssistantPanel", () => {
  const mockedApiFetch = vi.mocked(apiFetch);
  const mockedApiFetchStream = vi.mocked(apiFetchStream);
  const mockedIsAbortError = vi.mocked(isAbortError);

  beforeEach(() => {
    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === "/api/v1/ai_task_policies") {
        return [
          { id: 1, task_type: "lesson_plan", enabled: true },
          { id: 2, task_type: "unit_plan", enabled: true },
          { id: 3, task_type: "differentiation", enabled: true },
          { id: 4, task_type: "assessment", enabled: true },
          { id: 5, task_type: "rewrite", enabled: true },
        ] as never;
      }

      if (path === "/api/v1/ai_invocations") {
        return {
          id: 101,
          content: "Fallback response",
          provider: "openai",
          model: "gpt-4o-mini",
          status: "completed",
        } as never;
      }

      return {} as never;
    });
    mockedApiFetchStream.mockResolvedValue();
    mockedIsAbortError.mockImplementation(
      (error: unknown) => error instanceof DOMException && error.name === "AbortError",
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders task type dropdown with all options", async () => {
    render(<AiAssistantPanel />);

    const select = await screen.findByRole("combobox");
    expect(screen.getByRole("option", { name: "lesson_plan" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "unit_plan" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "differentiation" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "assessment" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "rewrite" })).toBeInTheDocument();
    expect(select).toBeInTheDocument();
  });

  it("loads AI task policies on mount", async () => {
    render(<AiAssistantPanel />);

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith("/api/v1/ai_task_policies");
    });
  });

  it("disables task types that are disabled by policy", async () => {
    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === "/api/v1/ai_task_policies") {
        return [
          { id: 1, task_type: "lesson_plan", enabled: true },
          { id: 2, task_type: "unit_plan", enabled: false },
        ] as never;
      }
      return {} as never;
    });

    render(<AiAssistantPanel />);

    const option = await screen.findByRole("option", { name: "unit_plan (disabled)" });
    expect(option).toBeDisabled();
  });

  it("shows policy hint on 403 error", async () => {
    mockedApiFetch.mockRejectedValue(new ApiError(403, "forbidden"));

    render(<AiAssistantPanel />);

    expect(await screen.findByText(/Policy list is restricted for your role/i)).toBeInTheDocument();
  });

  it("generates via stream on Generate click", async () => {
    render(<AiAssistantPanel />);

    fireEvent.change(screen.getByPlaceholderText(/Describe what you'd like/i), {
      target: { value: "Generate a lesson" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    await waitFor(() => {
      expect(mockedApiFetchStream).toHaveBeenCalled();
    });
  });

  it("displays streamed tokens incrementally", async () => {
    mockedApiFetchStream.mockImplementation(async (_path, _body, onToken, onDone) => {
      onToken("Hello");
      onToken(" world");
      onDone?.("Hello world");
    });

    render(<AiAssistantPanel />);

    fireEvent.change(screen.getByPlaceholderText(/Describe what you'd like/i), {
      target: { value: "Generate" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    expect(await screen.findByText(/Hello world/)).toBeInTheDocument();
  });

  it("stop button aborts generation", async () => {
    let capturedSignal: AbortSignal | undefined;
    mockedApiFetchStream.mockImplementation(
      async (_path, _body, _onToken, _onDone, _onError, signal) => {
        capturedSignal = signal;
        await new Promise<void>((resolve) => {
          signal?.addEventListener("abort", () => resolve(), { once: true });
        });
        throw new DOMException("aborted", "AbortError");
      },
    );

    render(<AiAssistantPanel />);

    fireEvent.change(screen.getByPlaceholderText(/Describe what you'd like/i), {
      target: { value: "Generate" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    const stopButton = await screen.findByRole("button", { name: "Stop" });
    fireEvent.click(stopButton);

    await waitFor(() => {
      expect(capturedSignal?.aborted).toBe(true);
      expect(screen.getByText("Generation stopped.")).toBeInTheDocument();
    });
  });

  it("falls back to non-streaming API on stream failure", async () => {
    mockedApiFetchStream.mockRejectedValue(new Error("stream down"));

    render(<AiAssistantPanel />);

    fireEvent.change(screen.getByPlaceholderText(/Describe what you'd like/i), {
      target: { value: "Generate" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith(
        "/api/v1/ai_invocations",
        expect.objectContaining({ method: "POST" }),
      );
    });
    expect(await screen.findByText(/Fallback response/)).toBeInTheDocument();
  });

  it("disables Generate when prompt is empty", async () => {
    render(<AiAssistantPanel />);

    expect(screen.getByRole("button", { name: "Generate" })).toBeDisabled();
  });

  it("copy to clipboard button", async () => {
    mockedApiFetchStream.mockImplementation(async (_path, _body, _onToken, onDone) => {
      onDone?.("Copy me");
    });

    const writeText = vi.fn(async () => {});
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: { writeText },
    });

    render(<AiAssistantPanel />);

    fireEvent.change(screen.getByPlaceholderText(/Describe what you'd like/i), {
      target: { value: "Generate" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    const button = await screen.findByRole("button", { name: "Copy to Clipboard" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("Copy me");
    });
  });
});
