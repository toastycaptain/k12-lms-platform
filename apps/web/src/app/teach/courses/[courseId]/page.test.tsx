import { render, screen } from "@testing-library/react";
import { useParams } from "next/navigation";
import CourseHomePage from "@/app/teach/courses/[courseId]/page";
import { ToastProvider } from "@/components/Toast";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { buildAssignment, buildCourse, buildModule } from "@/test/factories";
import { createMockUser } from "@/test/utils";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => "/teach/courses/1"),
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

describe("Teach Course Home Page", () => {
  const mockedApiFetch = vi.mocked(apiFetch);
  const mockedUseAuth = vi.mocked(useAuth);
  const mockedUseParams = vi.mocked(useParams);

  function setupApi({
    modules = [buildModule({ id: 11, title: "Module 1", course_id: 1, position: 1 })],
    assignments = [
      buildAssignment({
        id: 21,
        title: "Lab Report",
        course_id: 1,
        due_at: "2026-03-20T12:00:00Z",
      }),
    ],
  }: {
    modules?: Array<Record<string, unknown>>;
    assignments?: Array<Record<string, unknown>>;
  } = {}) {
    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === "/api/v1/courses/1") {
        return buildCourse({
          id: 1,
          name: "Biology 101",
          code: "BIO-101",
          description: "Intro biology",
          sections: [],
        }) as never;
      }
      if (path === "/api/v1/courses/1/modules") {
        return modules as never;
      }
      if (path === "/api/v1/courses/1/assignments") {
        return assignments as never;
      }
      if (path === "/api/v1/courses/1/discussions") {
        return [] as never;
      }
      if (path === "/api/v1/terms") {
        return [] as never;
      }
      if (path === "/api/v1/users") {
        return [] as never;
      }
      if (path === "/api/v1/integration_configs") {
        return [] as never;
      }
      if (path.startsWith("/api/v1/modules/") && path.endsWith("/module_items")) {
        return [] as never;
      }
      if (path.startsWith("/api/v1/assignments/") && path.endsWith("/submissions")) {
        return [] as never;
      }
      if (path.startsWith("/api/v1/discussions/") && path.endsWith("/posts")) {
        return [] as never;
      }

      return [] as never;
    });
  }

  beforeEach(() => {
    mockedUseParams.mockReturnValue({ courseId: "1" } as never);
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

  it("renders course name and code", async () => {
    render(
      <ToastProvider>
        <CourseHomePage />
      </ToastProvider>,
    );

    expect(await screen.findByRole("heading", { name: "Biology 101" })).toBeInTheDocument();
    expect(screen.getByText("BIO-101")).toBeInTheDocument();
  });

  it("renders module list", async () => {
    setupApi({
      modules: [
        buildModule({ id: 11, title: "Foundations", position: 1 }),
        buildModule({ id: 12, title: "Cell Structure", position: 2 }),
      ],
    });

    render(
      <ToastProvider>
        <CourseHomePage />
      </ToastProvider>,
    );

    expect(await screen.findByText("Foundations")).toBeInTheDocument();
    expect(screen.getByText("Cell Structure")).toBeInTheDocument();
  });

  it("renders upcoming assignments section", async () => {
    setupApi({
      assignments: [
        buildAssignment({ id: 30, title: "Cell Poster", due_at: "2026-04-03T08:00:00Z" }),
      ],
    });

    render(
      <ToastProvider>
        <CourseHomePage />
      </ToastProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: "Upcoming Assignments" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Cell Poster")).toBeInTheDocument();
  });

  it("shows empty state when no modules", async () => {
    setupApi({ modules: [] });

    render(
      <ToastProvider>
        <CourseHomePage />
      </ToastProvider>,
    );

    expect(await screen.findByText("No modules yet")).toBeInTheDocument();
  });
});
