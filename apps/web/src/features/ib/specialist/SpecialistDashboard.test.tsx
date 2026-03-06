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
    },
  }),
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
  });
});
