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
          translationState: "ready_for_review",
          availableLocales: ["en", "es"],
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
      visibilityPolicy: {
        storyStates: ["scheduled", "published"],
        evidenceVisibility: ["guardian_visible"],
        noiseBudget: { routine_digest_per_week: 2 },
        moderationPolicy: {},
      },
      currentUnitWindows: [
        {
          id: 6,
          title: "How the world works",
          href: "/ib/pyp/units/unit-42",
          summary: { how_to_help: "Ask what system changed this week." },
        },
      ],
      studentOptions: [{ id: 10, label: "Ava Peterson", relationship: "parent" }],
      interactions: {
        acknowledgements: [],
        responses: [],
      },
      digestStrategy: {
        cadenceOptions: ["weekly_digest", "fortnightly"],
        currentPreferences: {},
        urgentCount: 0,
        routineStoryCount: 1,
      },
      deliveryReceipts: [
        {
          id: "IbReport:8",
          state: "delivered",
          deliverableType: "IbReport",
          deliverableId: 8,
          readAt: null,
          acknowledgedAt: null,
        },
      ],
      releasedReports: [
        {
          id: 8,
          title: "PYP narrative report",
          summary: "A calm summary for families.",
          reportFamily: "pyp_narrative",
          programme: "PYP",
          href: "/ib/reports#report-8",
          releasedAt: "2026-03-03T12:00:00Z",
        },
      ],
      familyCharter: {
        principle: "Calm updates",
      },
      howToHelp: [
        {
          id: 7,
          title: "At-home prompt",
          prompt: "Ask what changed in today’s learning and why.",
        },
      ],
      preferences: {
        ib_story_published: { email_frequency: "weekly_digest" },
      },
      communicationPreferences: {
        locale: "en",
        digestCadence: "weekly_digest",
        quietHoursStart: "20:00",
        quietHoursEnd: "07:00",
        quietHoursTimezone: "UTC",
        deliveryRules: {},
      },
    },
    mutate: vi.fn(),
  }),
  useIbCommunicationPreference: () => ({
    data: {
      id: 1,
      audience: "guardian",
      locale: "en",
      digestCadence: "weekly_digest",
      quietHoursStart: "20:00",
      quietHoursEnd: "07:00",
      quietHoursTimezone: "UTC",
      deliveryRules: {},
      metadata: {},
      updatedAt: "2026-03-05T12:00:00Z",
    },
    mutate: vi.fn(),
  }),
  updateIbCommunicationPreference: vi.fn(async () => ({})),
  updateIbReport: vi.fn(async () => ({})),
}));

vi.mock("@/features/ib/phase9/Phase9Panels", () => ({
  TrustPolicyPanel: () => <div>Trust Policy Panel</div>,
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

    expect(screen.getAllByRole("heading", { name: "Family home" }).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Stories this week").length).toBeGreaterThan(0);
    expect(screen.getByText("Calendar digest")).toBeInTheDocument();
    expect(screen.getByText(/Only the dates families need for support/i)).toBeInTheDocument();
    expect(screen.getByText("Released reports")).toBeInTheDocument();
    expect(screen.getByText("Trust Policy Panel")).toBeInTheDocument();
    expect(screen.getByText("Communication preferences")).toBeInTheDocument();
  });
});
