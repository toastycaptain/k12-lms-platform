import { render, screen } from "@testing-library/react";
import { GuardianExperience } from "@/features/ib/guardian/GuardianExperience";

vi.mock("@/features/ib/data", () => ({
  useIbGuardianPayload: () => ({
    data: {
      stories: [
        {
          id: 1,
          title: "Stories this week",
          programme: "PYP",
          summary: "Students shared how systems shape communities.",
          supportPrompt: "Ask about one system they improved.",
          cadence: "weekly_digest",
          state: "published",
        },
      ],
      currentUnits: [
        {
          id: 2,
          title: "How the world works",
          href: "/ib/pyp/units/unit-42",
          summary: { centralIdea: "Systems shape daily life." },
        },
      ],
      portfolioHighlights: [
        {
          id: 3,
          title: "Prototype reflection",
          programme: "PYP",
          summary: "A selected portfolio moment.",
          visibility: "guardian_visible",
        },
      ],
      calendarDigest: [
        {
          id: 4,
          title: "Celebration of learning",
          cadence: "Weekly digest",
          publishedAt: "2026-03-01T12:00:00Z",
        },
      ],
      milestoneDigest: [
        {
          id: 5,
          title: "CAS reflection checkpoint",
          programme: "DP",
          cadence: "Ask about the next reflection draft.",
          publishedAt: "2026-03-02T12:00:00Z",
          href: "/ib/dp/cas/records/5",
        },
      ],
      progressSummary: {
        storyCount: 1,
        highlightCount: 1,
        supportPrompts: 1,
      },
    },
  }),
}));

describe("GuardianExperience", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => new Response(null, { status: 204 })) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("renders calm family-facing cards and digest content", () => {
    render(<GuardianExperience />);

    expect(screen.getByRole("heading", { name: "Family home" })).toBeInTheDocument();
    expect(screen.getAllByText("Stories this week").length).toBeGreaterThan(0);
    expect(screen.getByText("Calendar digest")).toBeInTheDocument();
    expect(screen.getByText(/Only the dates families need for support/i)).toBeInTheDocument();
  });
});
