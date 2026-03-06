import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { EvidenceInbox } from "@/features/ib/evidence/EvidenceInbox";

const { batchApplyEvidenceActionMock, mutateMock } = vi.hoisted(() => ({
  batchApplyEvidenceActionMock: vi.fn(async () => undefined),
  mutateMock: vi.fn(async () => undefined),
}));

vi.mock("@/features/ib/data", () => ({
  batchApplyEvidenceAction: batchApplyEvidenceActionMock,
  useIbEvidenceItems: () => ({
    data: [
      {
        id: "evidence-1",
        title: "River systems prototype reflection",
        programme: "PYP",
        context: "PYP • Context 4 • Unit 8",
        contributor: "Teacher",
        status: "needs_validation",
        visibility: "undecided",
        nextAction: "Validate context and learner voice.",
        storyDraft: "Draft a family-ready story.",
        warnings: ["Missing student voice"],
      },
    ],
    mutate: mutateMock,
  }),
}));

describe("EvidenceInbox", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => new Response(null, { status: 204 })) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("supports selecting evidence and applying a batch validation action", async () => {
    render(<EvidenceInbox />);

    fireEvent.click(screen.getByLabelText("Select River systems prototype reflection"));
    fireEvent.click(screen.getByRole("button", { name: "Validate" }));

    expect(screen.getByText("Last action preview:")).toBeInTheDocument();
    await waitFor(() => {
      expect(batchApplyEvidenceActionMock).toHaveBeenCalledWith(["evidence-1"], "validate");
      expect(mutateMock).toHaveBeenCalled();
    });
  });
});
