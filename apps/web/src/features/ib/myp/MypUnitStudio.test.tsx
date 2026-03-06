import { render, screen } from "@testing-library/react";
import { MypCoverageOverview } from "@/features/ib/myp/MypUnitStudio";

vi.mock("@/curriculum/documents/hooks", () => ({
  useCurriculumDocuments: () => ({
    data: [
      {
        id: 11,
        title: "Individuals and societies",
        document_type: "ib_myp_unit",
        status: "draft",
        current_version: {
          content: {
            key_concept: "Systems",
            global_context: "Globalization and sustainability",
            statement_of_inquiry: "Systems create interdependence.",
            inquiry_questions: ["How do systems connect communities?"],
            atl_focus: ["Research"],
            criteria_plan: [{ criterion: "A", task: "Concept map" }],
          },
        },
      },
    ],
  }),
  useCurriculumDocument: () => ({ data: null }),
  useCurriculumDocumentLinks: () => ({ data: [] }),
}));

vi.mock("@/features/ib/data", () => ({
  useIbDocumentComments: () => ({ data: [] }),
  useIbDocumentCollaborators: () => ({ data: [] }),
  useIbOperationalRecords: () => ({
    data: [
      {
        id: 21,
        recordFamily: "myp_project",
        title: "Community project",
        riskLevel: "risk",
        nextAction: "Meet the advisor",
        routeHint: "/ib/myp/projects/21",
      },
    ],
  }),
  createIbOperationalRecord: vi.fn(),
}));

vi.mock("@/curriculum/contexts/hooks", () => ({
  usePlanningContexts: () => ({ data: [] }),
}));

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

describe("MypCoverageOverview", () => {
  it("renders live MYP coverage and project risk rows", () => {
    render(<MypCoverageOverview />);

    expect(screen.getByRole("heading", { name: "MYP coverage" })).toBeInTheDocument();
    expect(screen.getByText("Individuals and societies")).toBeInTheDocument();
    expect(screen.getByText("Community project")).toBeInTheDocument();
    expect(screen.getByText("Meet the advisor")).toBeInTheDocument();
  });
});
