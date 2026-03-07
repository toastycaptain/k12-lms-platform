import { fireEvent, render, screen } from "@testing-library/react";
import { StudentExperience } from "@/features/ib/student/StudentExperience";

vi.mock("@/features/ib/data", () => ({
  useIbStudentPayload: () => ({
    data: {
      nextCheckpoints: [],
      reflectionsDue: [],
      validatedEvidence: [],
      projectMilestones: [],
      releasedReports: [
        {
          id: 50,
          title: "MYP snapshot",
          summary: "A released progress summary.",
          reportFamily: "myp_snapshot",
          programme: "MYP",
          href: "/ib/reports#report-50",
          releasedAt: "2026-03-04T12:00:00Z",
        },
      ],
      learningTimeline: [
        {
          id: "timeline-1",
          title: "Evidence uploaded",
          detail: "Add one reflection to explain the learning shift.",
          href: "/ib/student/home",
          kind: "evidence",
          programme: "MYP",
          status: "active",
        },
      ],
      goals: [
        {
          id: 1,
          title: "Strengthen reflection quality",
          description: "Connect evidence to growth more clearly.",
          status: "active",
          progressPercent: 60,
          targetDate: "2026-03-20",
        },
      ],
      nextActions: [
        {
          id: "action-1",
          title: "Respond to reflection prompt",
          detail: "Use the newest evidence to explain your next step.",
          href: "/ib/student/home",
          tone: "accent",
        },
      ],
      reflectionSystem: {
        prompts: [
          {
            key: "growth",
            title: "Growth reflection",
            prompt: "What changed in your thinking after feedback?",
          },
        ],
        history: [
          {
            id: 10,
            prompt: "What changed in your thinking after feedback?",
            status: "submitted",
            dueOn: "2026-03-10",
            responseExcerpt: "I revised the explanation after peer suggestions.",
            evidenceTitle: "Lab reflection",
          },
        ],
      },
      growthVisualization: {
        criteria: [{ label: "Criteria A", value: 3 }],
        atl: [{ label: "Research", value: 2 }],
        learnerProfile: [{ label: "Reflective", value: 4 }],
      },
      milestoneJourney: [
        {
          id: 12,
          title: "Community project checkpoint",
          programme: "MYP",
          status: "active",
          dueOn: "2026-03-18",
          nextAction: "Update the next milestone note.",
          href: "/ib/projects-core",
          checkpoints: [{ id: 1, title: "Proposal", status: "complete" }],
        },
      ],
      peerFeedback: {
        enabled: true,
        moderationRequired: true,
        guidelines: ["Be specific about the evidence you noticed."],
        recentFeedback: [
          { id: 20, title: "Peer response", detail: "Clearer reasoning would strengthen this." },
        ],
      },
      portfolio: {
        evidenceResults: [
          {
            id: 30,
            title: "Prototype evidence",
            detail: "Shows iteration after feedback.",
            href: "/learn/portfolio",
            programme: "MYP",
          },
        ],
        collections: [
          {
            id: 40,
            title: "Growth showcase",
            visibility: "private",
            itemCount: 3,
            sharedToken: null,
          },
        ],
      },
      quickActions: [
        {
          id: "quick-1",
          label: "Open portfolio",
          detail: "Collect evidence for the next narrative.",
          href: "/learn/portfolio",
        },
      ],
      notificationPreferences: {
        assignment_due_soon: { in_app: true, email: true, email_frequency: "weekly_digest" },
      },
      communicationPreferences: {
        locale: "en",
        digestCadence: "weekly_digest",
        quietHoursStart: "20:00",
        quietHoursEnd: "07:00",
        quietHoursTimezone: "UTC",
        deliveryRules: {},
      },
      deliveryReceipts: [
        {
          id: "IbReport:50",
          state: "read",
          deliverableType: "IbReport",
          deliverableId: 50,
          readAt: "2026-03-05T12:00:00Z",
          acknowledgedAt: null,
        },
      ],
      releaseGates: {
        accessible_mobile_actions: true,
        calm_notifications: true,
        timeline_ready: true,
      },
    },
    mutate: vi.fn(),
  }),
  useIbCommunicationPreference: () => ({
    data: {
      id: 1,
      audience: "student",
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

describe("StudentExperience", () => {
  it("renders the phase 7 student workflow surfaces", () => {
    render(<StudentExperience variant="dashboard" />);

    expect(screen.getByRole("heading", { name: "Student home" })).toBeInTheDocument();
    expect(screen.getByText("Unified learning timeline")).toBeInTheDocument();
    expect(screen.getByText("Portfolio search and collections")).toBeInTheDocument();
    expect(screen.getByText("Growth reflection")).toBeInTheDocument();
    expect(screen.getByText("Released reports")).toBeInTheDocument();
    expect(screen.getByText("Trust Policy Panel")).toBeInTheDocument();
    expect(screen.getByText("Communication preferences")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "evidence" }));

    expect(screen.getByText("Evidence uploaded")).toBeInTheDocument();
  });
});
