import { fireEvent, render, screen } from "@testing-library/react";
import { TeacherActionConsole } from "@/features/ib/home/TeacherActionConsole";

vi.mock("@/features/ib/home/useIbHomePayload", () => ({
  useIbHomePayload: () => ({
    data: {
      programme: "PYP",
      schoolLabel: "Demo School",
      coordinatorMode: false,
      resumeItems: [
        {
          id: "resume-1",
          label: "Resume systems unit",
          detail: "Jump back into the active unit.",
          href: "/ib/pyp/units/unit-42",
          tone: "accent",
          programme: "PYP",
        },
      ],
      changeFeed: [
        {
          id: "change-1",
          label: "Specialist note added",
          detail: "A specialist contribution changed the weekly flow.",
          href: "/ib/specialist",
          tone: "success",
          programme: "PYP",
        },
      ],
      evidenceActions: [
        {
          id: "evidence-1",
          label: "Validate evidence",
          detail: "One evidence item needs a decision.",
          href: "/ib/evidence",
          tone: "warm",
          programme: "PYP",
        },
      ],
      publishingActions: [
        {
          id: "publishing-1",
          label: "Schedule digest",
          detail: "One family digest is ready to schedule.",
          href: "/ib/families/publishing",
          tone: "success",
          programme: "PYP",
        },
      ],
      coordinatorComments: [
        {
          id: "comment-1",
          label: "Coordinator comment",
          detail: "Tighten the rationale wording.",
          href: "/ib/review",
          tone: "warm",
          programme: "PYP",
        },
      ],
      projectsCoreFollowUp: [
        {
          id: "project-1",
          label: "Projects follow-up",
          detail: "Open the next project checkpoint.",
          href: "/ib/projects-core",
          tone: "accent",
          programme: "PYP",
        },
      ],
      quickActions: [
        {
          id: "quick-1",
          label: "Open current unit",
          detail: "One click back to active work.",
          href: "/ib/pyp/units/unit-42",
          tone: "accent",
          programme: "PYP",
        },
      ],
      coordinatorCards: [],
    },
  }),
}));

describe("TeacherActionConsole", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => new Response(null, { status: 204 })) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("renders action-oriented teacher cards and layout controls", () => {
    render(<TeacherActionConsole />);

    expect(screen.getByRole("heading", { name: "Teacher action console" })).toBeInTheDocument();
    expect(screen.getByText("Resume systems unit")).toBeInTheDocument();
    expect(screen.getByText("Validate evidence")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Expanded" }));

    expect(screen.getByText("Click-budget review")).toBeInTheDocument();
  });
});
