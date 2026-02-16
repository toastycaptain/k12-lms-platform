import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AiAssistantPanel from "@/components/AiAssistantPanel";
import { apiFetch, ApiError } from "@/lib/api";
import { apiFetchStream, isAbortError } from "@/lib/api-stream";

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: {
      roles: ["teacher"],
    },
  }),
}));

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

  async function waitForPanelReady() {
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "lesson_plan" })).toBeEnabled();
    });
  }

  beforeEach(() => {
    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === "/api/v1/ai_provider_configs") {
        return [{ id: 1, status: "active" }] as never;
      }

      if (path === "/api/v1/ai_task_policies") {
        return [
          { id: 1, task_type: "lesson_plan", enabled: true, allowed_roles: ["teacher"] },
          { id: 2, task_type: "unit_plan", enabled: true, allowed_roles: ["teacher"] },
          { id: 3, task_type: "differentiation", enabled: true, allowed_roles: ["teacher"] },
          { id: 4, task_type: "assessment", enabled: true, allowed_roles: ["teacher"] },
          { id: 5, task_type: "rewrite", enabled: true, allowed_roles: ["teacher"] },
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

  it("renders task type buttons", async () => {
    render(<AiAssistantPanel />);

    expect(await screen.findByRole("button", { name: "lesson_plan" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "unit_plan" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "differentiation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "assessment" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "rewrite" })).toBeInTheDocument();
  });

  it("loads provider configs and task policies on mount", async () => {
    render(<AiAssistantPanel />);

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith("/api/v1/ai_provider_configs");
      expect(mockedApiFetch).toHaveBeenCalledWith("/api/v1/ai_task_policies");
    });
  });

  it("shows policy banner when policies are loaded", async () => {
    render(<AiAssistantPanel />);

    expect(
      await screen.findByText(/AI actions are governed by your school's policy/i),
    ).toBeInTheDocument();
  });

  it("grays out unavailable task types", async () => {
    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === "/api/v1/ai_provider_configs") {
        return [{ id: 1, status: "active" }] as never;
      }

      if (path === "/api/v1/ai_task_policies") {
        return [
          { id: 1, task_type: "lesson_plan", enabled: true, allowed_roles: ["teacher"] },
          { id: 2, task_type: "unit_plan", enabled: false, allowed_roles: ["teacher"] },
        ] as never;
      }

      return {} as never;
    });

    render(<AiAssistantPanel />);

    const unavailableTaskButton = await screen.findByRole("button", { name: "unit_plan" });
    expect(unavailableTaskButton).toBeDisabled();
  });

  it("shows disabled state when no active provider exists", async () => {
    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === "/api/v1/ai_provider_configs") {
        return [{ id: 1, status: "inactive" }] as never;
      }

      if (path === "/api/v1/ai_task_policies") {
        return [
          { id: 1, task_type: "lesson_plan", enabled: true, allowed_roles: ["teacher"] },
        ] as never;
      }

      return {} as never;
    });

    render(<AiAssistantPanel />);

    expect(
      await screen.findByText("AI is not configured. Contact your administrator."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generate" })).toBeDisabled();
  });

  it("generates via stream on Generate click", async () => {
    render(<AiAssistantPanel />);
    await waitForPanelReady();

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
    await waitForPanelReady();

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
    await waitForPanelReady();

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
    await waitForPanelReady();

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
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Generate" })).toBeDisabled();
    });

    expect(screen.getByRole("button", { name: "Generate" })).toBeDisabled();
  });

  it("copies response to clipboard", async () => {
    mockedApiFetchStream.mockImplementation(async (_path, _body, _onToken, onDone) => {
      onDone?.("Copy me");
    });

    const writeText = vi.fn(async () => {});
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: { writeText },
    });

    render(<AiAssistantPanel />);
    await waitForPanelReady();

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

  it("applies generated response with callback", async () => {
    mockedApiFetchStream.mockImplementation(async (_path, _body, _onToken, onDone) => {
      onDone?.("Apply me");
    });

    const onApply = vi.fn();
    render(<AiAssistantPanel onApply={onApply} />);
    await waitForPanelReady();

    fireEvent.change(screen.getByPlaceholderText(/Describe what you'd like/i), {
      target: { value: "Generate" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    const button = await screen.findByRole("button", { name: "Apply" });
    fireEvent.click(button);

    expect(onApply).toHaveBeenCalledWith("Apply me");
    expect(screen.getByText("Applied to editor.")).toBeInTheDocument();
  });
});
