import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LearnProgressPage from "@/app/learn/progress/page";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => "/learn/progress"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

vi.mock("@/components/AppShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ProtectedRoute", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("Learn Progress Page", () => {
  const mockedApiFetch = vi.mocked(apiFetch);
  const mockedUseAuth = vi.mocked(useAuth);

  function setupApi() {
    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === "/api/v1/students/7/progress") {
        return {
          student: {
            id: 7,
            first_name: "Sam",
            last_name: "Student",
            name: "Sam Student",
          },
          courses: [
            {
              id: 101,
              name: "Biology",
              code: "BIO-101",
              average: 92,
              completed_assignments: 2,
              total_assignments: 2,
              completion_rate: 100,
            },
            {
              id: 202,
              name: "Algebra",
              code: "ALG-202",
              average: 74,
              completed_assignments: 1,
              total_assignments: 2,
              completion_rate: 50,
            },
          ],
          standards_mastery: [
            {
              id: 1,
              code: "SCI-1",
              description: "Cell structure",
              framework: "NGSS",
              average_score: 92,
              mastered: true,
              attempt_count: 1,
            },
          ],
          overall: {
            courses_count: 2,
            overall_average: 83,
            total_assignments: 4,
            completed_assignments: 3,
            completion_rate: 75,
            mastered_standards: 1,
            total_standards: 1,
            mastery_rate: 100,
            at_risk_courses: 0,
          },
        } as never;
      }

      if (path === "/api/v1/students/7/progress/course/101") {
        return {
          course: { id: 101, name: "Biology", code: "BIO-101" },
          assignments: [
            {
              id: 1,
              title: "Lab Writeup",
              due_at: "2026-03-01T00:00:00Z",
              status: "graded",
              grade: 92,
              points_possible: 100,
              percentage: 92,
            },
          ],
          quizzes: [],
          module_completion: {
            total_modules: 1,
            total_items: 2,
            completed_items: 2,
            completion_rate: 100,
            modules: [
              {
                id: 9,
                title: "Intro Module",
                total_items: 2,
                completed_items: 2,
                completion_rate: 100,
              },
            ],
          },
          standards: [],
          grade_trend: [
            {
              date: "2026-02-10T12:00:00Z",
              source_type: "assignment",
              source_id: 1,
              source_title: "Lab Writeup",
              score: 92,
              points_possible: 100,
              percentage: 92,
            },
          ],
        } as never;
      }

      if (path === "/api/v1/students/7/progress/course/202") {
        return {
          course: { id: 202, name: "Algebra", code: "ALG-202" },
          assignments: [
            {
              id: 2,
              title: "Equation Set",
              due_at: "2026-03-04T00:00:00Z",
              status: "graded",
              grade: 37,
              points_possible: 50,
              percentage: 74,
            },
          ],
          quizzes: [],
          module_completion: {
            total_modules: 1,
            total_items: 1,
            completed_items: 0,
            completion_rate: 0,
            modules: [],
          },
          standards: [],
          grade_trend: [
            {
              date: "2026-02-11T12:00:00Z",
              source_type: "assignment",
              source_id: 2,
              source_title: "Equation Set",
              score: 37,
              points_possible: 50,
              percentage: 74,
            },
          ],
        } as never;
      }

      throw new Error(`Unexpected apiFetch call: ${path}`);
    });
  }

  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: 7,
        email: "student@example.com",
        first_name: "Sam",
        last_name: "Student",
        tenant_id: 1,
        roles: ["student"],
        google_connected: false,
        onboarding_complete: true,
        preferences: {},
      },
      loading: false,
      error: null,
      signOut: vi.fn(async () => {}),
      refresh: vi.fn(async () => {}),
    });

    setupApi();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders summary and course detail sections", async () => {
    render(<LearnProgressPage />);

    expect(await screen.findByRole("heading", { name: "Progress" })).toBeInTheDocument();
    expect(screen.getByText("Student: Sam Student")).toBeInTheDocument();
    expect(screen.getByText("Course Summary")).toBeInTheDocument();
    expect(screen.getByText("Standards Mastery")).toBeInTheDocument();
    expect(await screen.findByText("Lab Writeup")).toBeInTheDocument();
  });

  it("loads a different course detail when the selected course changes", async () => {
    render(<LearnProgressPage />);

    expect(await screen.findByText("Lab Writeup")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Course"), { target: { value: "202" } });

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith("/api/v1/students/7/progress/course/202");
    });

    expect(await screen.findByText("Equation Set")).toBeInTheDocument();
  });

  it("shows an error state when summary loading fails", async () => {
    mockedApiFetch.mockRejectedValueOnce(new Error("boom"));

    render(<LearnProgressPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load progress data.");
  });
});
