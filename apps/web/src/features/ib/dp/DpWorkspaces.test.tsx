import { render, screen } from "@testing-library/react";
import {
  DpAssessmentDashboard,
  DpCoordinatorWorkspace,
  InternalAssessmentTracker,
} from "@/features/ib/dp/DpWorkspaces";

vi.mock("@/features/ib/data", () => ({
  useIbOperationalRecords: () => ({
    data: [
      {
        id: 1,
        programme: "DP",
        recordFamily: "dp_ia",
        subtype: "course",
        status: "open",
        priority: "high",
        riskLevel: "risk",
        title: "Economics HL",
        summary: "Meeting log needs final confirmation.",
        nextAction: "Confirm IA feedback cycle by Friday",
        routeHint: "/ib/dp/assessment/ia-risk",
        checkpoints: [],
      },
      {
        id: 2,
        programme: "DP",
        recordFamily: "dp_ia",
        subtype: "student",
        status: "watch",
        priority: "high",
        riskLevel: "watch",
        title: "Maya Chen",
        summary: "Meeting log needs final confirmation.",
        nextAction: "Confirm supervision notes",
        routeHint: "/ib/dp/assessment/ia-risk",
        studentId: 42,
        checkpoints: [{ id: 21, title: "Authenticity review", status: "pending" }],
        metadata: {},
      },
      {
        id: 3,
        programme: "DP",
        recordFamily: "dp_ee",
        subtype: "extended_essay",
        status: "in_progress",
        priority: "high",
        riskLevel: "watch",
        title: "Extended Essay - Maya Chen",
        summary: "Supervisor meeting notes are missing.",
        nextAction: "Log the supervision meeting",
        routeHint: "/ib/dp/ee/3",
        studentId: 42,
        checkpoints: [{ id: 31, title: "Supervisor meeting", status: "in_progress" }],
        metadata: {},
      },
    ],
  }),
}));

describe("DP workspaces", () => {
  it("renders subject readiness rows in the assessment dashboard", () => {
    render(<DpAssessmentDashboard />);

    expect(screen.getByText("Economics HL")).toBeInTheDocument();
    expect(screen.getByText("Needs follow-up")).toBeInTheDocument();
    expect(screen.getByText("Confirm IA feedback cycle by Friday")).toBeInTheDocument();
  });

  it("renders internal assessment milestone signals", () => {
    render(<InternalAssessmentTracker />);

    expect(screen.getByText("Maya Chen")).toBeInTheDocument();
    expect(screen.getByText("Authenticity review")).toBeInTheDocument();
    expect(screen.getByText("Confirm supervision notes")).toBeInTheDocument();
  });

  it("renders coordinator drilldowns to the student-centric DP overview", () => {
    render(<DpCoordinatorWorkspace />);

    expect(screen.getByText("Extended Essay - Maya Chen")).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", { name: "Open student" })
        .every((link) => link.getAttribute("href") === "/ib/dp/students/42/overview"),
    ).toBe(true);
  });
});
