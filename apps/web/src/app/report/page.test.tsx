import { render, screen } from "@testing-library/react";
import ReportPage from "@/app/report/page";
import { ToastProvider } from "@k12/ui";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { buildCourse } from "@/test/factories";
import { createMockUser } from "@/test/utils";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => "/report"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
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

describe("Report Page", () => {
  const mockedApiFetch = vi.mocked(apiFetch);
  const mockedUseAuth = vi.mocked(useAuth);

  function setupApi() {
    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === "/api/v1/courses") {
        return [buildCourse({ id: 1, name: "Biology 101" })] as never;
      }
      if (path === "/api/v1/assignments") {
        return [{ id: 10, title: "Lab", course_id: 1, due_at: "2026-03-01T00:00:00Z" }] as never;
      }
      if (path === "/api/v1/quizzes") {
        return [{ id: 20, title: "Quiz", course_id: 1, status: "published" }] as never;
      }
      if (path === "/api/v1/courses/1/quiz_performance") {
        return {
          course_id: 1,
          total_quizzes: 1,
          total_graded_attempts: 1,
          class_average: 82,
          quiz_comparison: [
            {
              quiz_id: 20,
              title: "Quiz",
              status: "published",
              due_at: "2026-03-01T00:00:00Z",
              updated_at: "2026-03-01T00:00:00Z",
              attempt_count: 1,
              class_average: 82,
            },
          ],
        } as never;
      }
      if (path === "/api/v1/users?role=student") {
        return [
          { id: 2, first_name: "Sam", last_name: "Student", email: "sam@example.com" },
        ] as never;
      }
      if (path === "/api/v1/submissions") {
        return [
          {
            id: 30,
            assignment_id: 10,
            user_id: 2,
            status: "submitted",
            submitted_at: "2026-03-01T01:00:00Z",
            created_at: "2026-03-01T01:00:00Z",
          },
        ] as never;
      }
      return [] as never;
    });
  }

  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user: createMockUser({ roles: ["teacher"] }),
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

  it("renders report dashboard heading", async () => {
    render(
      <ToastProvider>
        <ReportPage />
      </ToastProvider>,
    );

    expect(await screen.findByRole("heading", { name: "Report" })).toBeInTheDocument();
  });

  it("renders data summary cards", async () => {
    render(
      <ToastProvider>
        <ReportPage />
      </ToastProvider>,
    );

    expect(await screen.findByText("Total Courses")).toBeInTheDocument();
    expect(screen.getByText("Total Students")).toBeInTheDocument();
    expect(screen.getByText("Total Assignments")).toBeInTheDocument();
    expect(screen.getByText("Total Quizzes")).toBeInTheDocument();
  });

  it("handles loading state", () => {
    mockedApiFetch.mockImplementation(() => new Promise(() => {}) as Promise<never>);

    const { container } = render(
      <ToastProvider>
        <ReportPage />
      </ToastProvider>,
    );

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("handles API error", async () => {
    mockedApiFetch.mockRejectedValue(new Error("boom"));

    render(
      <ToastProvider>
        <ReportPage />
      </ToastProvider>,
    );

    expect(await screen.findByText("Failed to load reporting data.")).toBeInTheDocument();
  });
});
