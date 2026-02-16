import { render, screen } from "@testing-library/react";
import { useParams } from "next/navigation";
import LearnCoursePage from "@/app/learn/courses/[courseId]/page";
import { ToastProvider } from "@/components/Toast";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { buildCourse } from "@/test/factories";
import { createMockUser } from "@/test/utils";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => "/learn/courses/1"),
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

describe("Student Course View Page", () => {
  const mockedApiFetch = vi.mocked(apiFetch);
  const mockedUseAuth = vi.mocked(useAuth);
  const mockedUseParams = vi.mocked(useParams);

  function setupApi(modules: Array<Record<string, unknown>> = []) {
    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === "/api/v1/courses/1") {
        return buildCourse({ id: 1, name: "Biology 101", code: "BIO-101", sections: [] }) as never;
      }
      if (path === "/api/v1/users") {
        return [{ id: 9, first_name: "Taylor", last_name: "Teacher" }] as never;
      }
      if (path === "/api/v1/terms") {
        return [] as never;
      }
      if (path === "/api/v1/courses/1/assignments") {
        return [{ id: 11, title: "Lab 1", due_at: "2026-03-01T12:00:00Z" }] as never;
      }
      if (path === "/api/v1/courses/1/quizzes") {
        return [] as never;
      }
      if (path === "/api/v1/courses/1/discussions") {
        return [] as never;
      }
      if (path === "/api/v1/courses/1/course_modules") {
        return modules as never;
      }
      if (path === "/api/v1/modules/10/module_items") {
        return [
          {
            id: 101,
            title: "Lab 1",
            item_type: "assignment",
            itemable_type: "Assignment",
            itemable_id: 11,
            position: 1,
          },
        ] as never;
      }
      if (path === "/api/v1/course_modules/10/progress") {
        return {
          total_items: 1,
          current_user_completed_count: 0,
          current_user_completed_item_ids: [],
        } as never;
      }
      if (path === "/api/v1/assignments/11/submissions") {
        return [] as never;
      }
      return [] as never;
    });
  }

  beforeEach(() => {
    mockedUseParams.mockReturnValue({ courseId: "1" } as never);
    mockedUseAuth.mockReturnValue({
      user: createMockUser({ id: 2, roles: ["student"], first_name: "Sam", last_name: "Student" }),
      loading: false,
      error: null,
      signOut: vi.fn(async () => {}),
      refresh: vi.fn(async () => {}),
    });
    setupApi([
      {
        id: 10,
        title: "Module 1: Foundations",
        description: "Start here",
        status: "published",
        position: 1,
      },
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders course name for student", async () => {
    render(
      <ToastProvider>
        <LearnCoursePage />
      </ToastProvider>,
    );

    expect(await screen.findByRole("heading", { name: "Biology 101" })).toBeInTheDocument();
  });

  it("renders module list with progress", async () => {
    render(
      <ToastProvider>
        <LearnCoursePage />
      </ToastProvider>,
    );

    expect(await screen.findByText("Module 1: Foundations")).toBeInTheDocument();
    expect(screen.getByText("0/1 items complete")).toBeInTheDocument();
  });

  it("renders assignment items with due dates", async () => {
    render(
      <ToastProvider>
        <LearnCoursePage />
      </ToastProvider>,
    );

    expect(await screen.findByText("Lab 1")).toBeInTheDocument();
    expect(screen.getByText(/Due/)).toBeInTheDocument();
  });

  it("shows empty state when no modules", async () => {
    setupApi([]);

    render(
      <ToastProvider>
        <LearnCoursePage />
      </ToastProvider>,
    );

    expect(await screen.findByText("No published modules yet")).toBeInTheDocument();
  });
});
