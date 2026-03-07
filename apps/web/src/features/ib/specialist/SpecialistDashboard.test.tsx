import { fireEvent, render, screen, within } from "@testing-library/react";
import { SpecialistDashboard } from "@/features/ib/specialist/SpecialistDashboard";

vi.mock("@/features/ib/data", () => ({
  useIbSpecialistPayload: () => ({
    data: {
      ownedUnits: [
        {
          id: 1,
          title: "Grade 4 library inquiry support",
          detail: "Support the current inquiry block.",
          href: "/ib/pyp/units/unit-42",
          contributionMode: "comment",
        },
      ],
      contributedUnits: [],
      weekItems: [
        {
          id: 1,
          title: "Grade 4 library inquiry support",
          detail: "Support the current inquiry block.",
          dueOn: "2026-03-01",
          href: "/ib/pyp/units/unit-42",
        },
      ],
      requestedContributions: [
        {
          id: 2,
          title: "Grade 5 library inquiry support",
          detail: "Add one contribution note before the next block.",
          href: "/ib/pyp/units/unit-55",
          contributionMode: "comment",
          role: "specialist_contributor",
          status: "active",
          handoffState: "awaiting_response",
        },
      ],
      pendingResponses: [
        {
          id: 3,
          title: "Respond to Grade 6 support note",
          detail: "Teacher is waiting for a next-step suggestion.",
          dueOn: "2026-03-02",
          href: "/ib/pyp/units/unit-66",
          handoffState: "awaiting_response",
        },
      ],
      evidenceToSort: [
        {
          id: 4,
          title: "Library evidence item",
          detail: "Attach once across related units.",
          href: "/ib/evidence/items/4",
          status: "needs_validation",
        },
      ],
      overloadSignals: [],
      assignmentGaps: [],
      libraryItems: [],
    },
  }),
}));

vi.mock("@/features/ib/phase9/Phase9Panels", () => ({
  BenchmarkRefreshPanel: () => <div>Benchmark Refresh Panel</div>,
  MobileTrustPanel: () => <div>Mobile Trust Panel</div>,
}));

describe("SpecialistDashboard", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => new Response(null, { status: 204 })) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("opens the contribution drawer and supports multi-unit attach", () => {
    render(<SpecialistDashboard />);

    fireEvent.click(screen.getByRole("button", { name: /Grade 4 library inquiry support/i }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    fireEvent.click(within(dialog).getByLabelText("Grade 5 • Changing communities"));

    expect(within(dialog).getByText("2 units will receive this contribution.")).toBeInTheDocument();
    expect(screen.getByText("Benchmark Refresh Panel")).toBeInTheDocument();
    expect(screen.getByText("Mobile Trust Panel")).toBeInTheDocument();
  });
});
