import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useParams } from "next/navigation";
import GradebookPage from "@/app/teach/courses/[courseId]/gradebook/page";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { createMockUser } from "@/test/utils";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => "/teach/courses/1/gradebook"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useParams: vi.fn(() => ({ courseId: "1" })),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
  buildApiUrl: vi.fn((path: string) => `http://localhost:3001${path}`),
  ApiError: class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

vi.mock("@/components/AppShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ProtectedRoute", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("Gradebook Page", () => {
  const mockedApiFetch = vi.mocked(apiFetch);
  const mockedUseAuth = vi.mocked(useAuth);
  const mockedUseParams = vi.mocked(useParams);

  const gradebookPayload = {
    students: [
      {
        id: 2,
        name: "Sam Student",
        email: "sam@example.com",
        grades: [
          {
            assignment_id: 11,
            assignment_title: "Unit Reflection",
            assignment_type: "written",
            submission_id: 901,
            grade: 92,
            points_possible: 100,
            percentage: 92,
            status: "graded",
            submitted: true,
            late: false,
            missing: false,
            due_at: "2026-02-01T00:00:00Z",
            submitted_at: "2026-02-01T00:00:00Z",
          },
          {
            assignment_id: 12,
            assignment_title: "Cell Quiz",
            assignment_type: "discussion",
            submission_id: null,
            grade: null,
            points_possible: 100,
            percentage: null,
            status: "missing",
            submitted: false,
            late: false,
            missing: true,
            due_at: "2026-02-01T00:00:00Z",
            submitted_at: null,
          },
        ],
        quiz_grades: [
          {
            quiz_id: 51,
            title: "Chapter Check",
            attempt_id: 401,
            score: 18,
            points_possible: 20,
            percentage: 90,
            status: "graded",
            submitted_at: "2026-02-01T00:00:00Z",
          },
        ],
        course_average: 92,
        missing_count: 1,
        late_count: 0,
        mastery: {
          threshold: 80,
          mastered_standards: 3,
          total_standards: 3,
          percentage: 100,
        },
      },
      {
        id: 3,
        name: "Pat Learner",
        email: "pat@example.com",
        grades: [
          {
            assignment_id: 11,
            assignment_title: "Unit Reflection",
            assignment_type: "written",
            submission_id: 902,
            grade: 72,
            points_possible: 100,
            percentage: 72,
            status: "graded",
            submitted: true,
            late: true,
            missing: false,
            due_at: "2026-02-01T00:00:00Z",
            submitted_at: "2026-02-02T00:00:00Z",
          },
          {
            assignment_id: 12,
            assignment_title: "Cell Quiz",
            assignment_type: "discussion",
            submission_id: 903,
            grade: 80,
            points_possible: 100,
            percentage: 80,
            status: "graded",
            submitted: true,
            late: false,
            missing: false,
            due_at: "2026-02-01T00:00:00Z",
            submitted_at: "2026-02-01T00:00:00Z",
          },
        ],
        quiz_grades: [
          {
            quiz_id: 51,
            title: "Chapter Check",
            attempt_id: 402,
            score: 14,
            points_possible: 20,
            percentage: 70,
            status: "graded",
            submitted_at: "2026-02-01T00:00:00Z",
          },
        ],
        course_average: 74.5,
        missing_count: 0,
        late_count: 1,
        mastery: null,
      },
    ],
    assignments: [
      {
        id: 11,
        title: "Unit Reflection",
        due_at: "2026-02-01T00:00:00Z",
        points_possible: 100,
        submission_count: 2,
        graded_count: 2,
        average: 82,
        median: 82,
      },
      {
        id: 12,
        title: "Cell Quiz",
        due_at: "2026-02-01T00:00:00Z",
        points_possible: 100,
        submission_count: 1,
        graded_count: 1,
        average: 80,
        median: 80,
      },
    ],
    quizzes: [{ id: 51, title: "Chapter Check", points_possible: 20 }],
    course_summary: {
      student_count: 2,
      assignment_count: 2,
      quiz_count: 1,
      overall_average: 83.2,
      grade_distribution: { A: 1, B: 0, C: 1, D: 0, F: 0 },
      assignment_completion_rate: 75,
      students_with_missing_work: 1,
      category_averages: {
        written: 82,
        discussion: 80,
        quiz: 80,
      },
    },
    mastery_threshold: 80,
  };

  beforeEach(() => {
    mockedUseParams.mockReturnValue({ courseId: "1" } as never);
    mockedUseAuth.mockReturnValue({
      user: createMockUser({ roles: ["teacher"] }),
      loading: false,
      error: null,
      signOut: vi.fn(async () => {}),
      refresh: vi.fn(async () => {}),
    });
    mockedApiFetch.mockResolvedValue(gradebookPayload as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders student grid data", async () => {
    render(<GradebookPage />);

    expect(await screen.findByText("Sam Student")).toBeInTheDocument();
    expect(screen.getByText("Pat Learner")).toBeInTheDocument();
    expect(screen.getAllByText("Unit Reflection").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cell Quiz").length).toBeGreaterThan(0);
  });

  it("sorts by course average", async () => {
    render(<GradebookPage />);

    await screen.findByText("Sam Student");

    fireEvent.change(screen.getByLabelText("Sort By"), {
      target: { value: "course_average" },
    });

    await waitFor(() => {
      const orderedRows = screen.getAllByTestId(/student-row-/);
      expect(orderedRows[0]).toHaveTextContent("Sam Student");
      expect(orderedRows[1]).toHaveTextContent("Pat Learner");
    });
  });

  it("filters to students with missing work", async () => {
    render(<GradebookPage />);

    await screen.findByText("Sam Student");

    fireEvent.click(screen.getByLabelText("Missing Work Only"));

    await waitFor(() => {
      const orderedRows = screen.getAllByTestId(/student-row-/);
      expect(orderedRows).toHaveLength(1);
      expect(orderedRows[0]).toHaveTextContent("Sam Student");
    });
  });

  it("exports CSV on click", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(<GradebookPage />);

    await screen.findByText("Sam Student");
    fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));

    expect(openSpy).toHaveBeenCalledWith(
      "http://localhost:3001/api/v1/courses/1/gradebook/export",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("shows status indicators and color classes", async () => {
    render(<GradebookPage />);

    const okCell = await screen.findByTitle("Unit Reflection | OK");
    const lateCell = screen.getByTitle("Unit Reflection | LATE");
    const missingCell = screen.getByTitle("Cell Quiz | MISS");

    expect(okCell).toHaveClass("bg-green-50");
    expect(lateCell).toHaveClass("bg-amber-50");
    expect(missingCell).toHaveClass("bg-slate-100");
  });
});
