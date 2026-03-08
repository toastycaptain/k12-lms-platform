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
  useIbReflectionRequests: () => ({
    data: [
      {
        id: 41,
        evidenceItemId: 1,
        studentId: 22,
        status: "requested",
        prompt: "Explain the next step in your own words.",
        metadata: {},
      },
    ],
    mutate: mutateMock,
  }),
  useIbLearningStories: () => ({
    data: [
      {
        id: "story-7",
        title: "Systems family story",
        programme: "PYP",
        audience: "Families",
        teacher: "Ms Rivera",
        cadence: "Weekly Digest",
        state: "draft",
        summary: "Draft family story",
        supportPrompt: "Ask a follow-up question.",
        href: "/ib/families/stories/story-7",
      },
    ],
  }),
}));

vi.mock("@/features/ib/offline/useIbMutationQueue", () => ({
  useIbMutationQueue: () => ({
    queuedCount: 1,
    draftCount: 1,
    conflictCount: 0,
    conflicts: [],
    clearConflict: vi.fn(),
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

  it("opens the mobile capture sheet from the action dock", () => {
    render(<EvidenceInbox />);

    fireEvent.click(screen.getByRole("button", { name: /Capture evidence/i }));

    expect(screen.getByRole("heading", { name: "Mobile evidence capture" })).toBeInTheDocument();
  });
});
