import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { ToastProvider } from "@k12/ui";
import { IbAiAssistPanel } from "@/features/ib/ai/IbAiAssistPanel";
import { apiFetch, ApiError } from "@/lib/api";

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

describe("IbAiAssistPanel", () => {
  const mockedApiFetch = vi.mocked(apiFetch);

  function renderWithToast(ui: ReactNode) {
    return render(<ToastProvider>{ui}</ToastProvider>);
  }

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("runs a diff task, opens the review modal, and records applied review metadata", async () => {
    const onApply = vi.fn(async () => undefined);
    mockedApiFetch
      .mockResolvedValueOnce({
        id: 101,
        status: "completed",
        content: JSON.stringify({
          fields: [{ field: "summary", label: "Story summary", value: "Improved family summary" }],
        }),
        grounding_refs: [{ label: "Story summary", excerpt: "Current family summary" }],
        human_only_boundaries: ["publish", "approve"],
      } as never)
      .mockResolvedValueOnce({} as never);

    renderWithToast(
      <IbAiAssistPanel
        title="AI publishing assist"
        description="Reviewable story support"
        commonContext={{ workflow: "publishing" }}
        taskOptions={[
          {
            taskType: "ib_family_language",
            label: "Family language",
            description: "Rewrite the story in calmer language.",
            mode: "diff",
            targetFields: [
              { field: "summary", label: "Story summary", currentValue: "Current family summary" },
            ],
            applyTarget: { type: "IbLearningStory", id: 9 },
            context: {
              workflow: "publishing",
              grounding_refs: [{ label: "Story summary", excerpt: "Current family summary" }],
              target_fields: [{ field: "summary", label: "Story summary" }],
              current_values: { summary: "Current family summary" },
            },
            onApply,
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Generate assist" }));

    expect(await screen.findByText("Improved family summary")).toBeInTheDocument();
    expect(screen.getByText(/Human-only boundaries: publish, approve/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Review diffs" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply Selected Changes" }));

    await waitFor(() => {
      expect(onApply).toHaveBeenCalledWith({ summary: "Improved family summary" });
      expect(mockedApiFetch).toHaveBeenLastCalledWith(
        "/api/v1/ai_invocations/101",
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining('"status":"applied"'),
        }),
      );
    });
    expect(await screen.findByText("AI suggestions applied for review.")).toBeInTheDocument();
  });

  it("runs an analysis task and records teacher trust feedback", async () => {
    mockedApiFetch
      .mockResolvedValueOnce({
        id: 202,
        status: "completed",
        content:
          "## Grounded strengths\n- Evidence is aligned\n\n## Teacher follow-up\n- Confirm tone",
        grounding_refs: [{ label: "Report summary", excerpt: "Current report summary" }],
        human_only_boundaries: ["release"],
      } as never)
      .mockResolvedValueOnce({} as never);

    renderWithToast(
      <IbAiAssistPanel
        title="AI review assist"
        description="Reviewable report analysis"
        commonContext={{ workflow: "reporting" }}
        taskOptions={[
          {
            taskType: "ib_evidence_gap",
            label: "Evidence gap",
            description: "Find unsupported claims.",
            mode: "analysis",
            context: {
              workflow: "reporting",
              grounding_refs: [{ label: "Report summary", excerpt: "Current report summary" }],
            },
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Generate assist" }));

    expect(await screen.findByText(/Grounded strengths/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Helpful" }));

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenLastCalledWith(
        "/api/v1/ai_invocations/202",
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining('"status":"helpful"'),
        }),
      );
    });
    expect(await screen.findByText("AI feedback recorded.")).toBeInTheDocument();
  });

  it("surfaces API failures without crashing the review surface", async () => {
    mockedApiFetch.mockRejectedValueOnce(new ApiError(422, "Grounded source text is required"));

    renderWithToast(
      <IbAiAssistPanel
        title="AI inquiry assist"
        description="Reviewable document support"
        taskOptions={[
          {
            taskType: "ib_inquiry_language",
            label: "Inquiry language",
            description: "Strengthen inquiry wording.",
            mode: "diff",
            targetFields: [
              { field: "central_idea", label: "Central idea", currentValue: "Current idea" },
            ],
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Generate assist" }));

    expect(await screen.findByText("Grounded source text is required")).toBeInTheDocument();
  });
});
