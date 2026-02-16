import { render, screen } from "@testing-library/react";
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

  function setupApi(rows: Array<Record<string, unknown>>) {
    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === "/api/v1/courses/1/gradebook") {
        return rows as never;
      }
      if (path === "/api/v1/courses/1/assignments") {
        return [
          { id: 11, title: "Unit Reflection" },
          { id: 12, title: "Cell Quiz" },
        ] as never;
      }
      if (path === "/api/v1/users") {
        return [
          { id: 2, first_name: "Sam", last_name: "Student" },
          { id: 3, first_name: "Pat", last_name: "Learner" },
        ] as never;
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
    setupApi([
      { user_id: 2, assignment_id: 11, grade: "92", status: "graded" },
      { user_id: 3, assignment_id: 12, grade: null, status: "submitted" },
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders student grade rows", async () => {
    render(<GradebookPage />);

    expect(await screen.findByText("Sam Student")).toBeInTheDocument();
    expect(screen.getByText("Pat Learner")).toBeInTheDocument();
    expect(screen.getByText("92")).toBeInTheDocument();
  });

  it("renders assignment column values", async () => {
    render(<GradebookPage />);

    expect(await screen.findByText("Unit Reflection")).toBeInTheDocument();
    expect(screen.getByText("Cell Quiz")).toBeInTheDocument();
  });

  it("handles empty gradebook", async () => {
    setupApi([]);

    render(<GradebookPage />);

    expect(await screen.findByText("No gradebook records yet.")).toBeInTheDocument();
  });

  it("handles loading state", () => {
    mockedApiFetch.mockImplementation(() => new Promise(() => {}) as Promise<never>);

    render(<GradebookPage />);

    expect(screen.getByText("Loading gradebook...")).toBeInTheDocument();
  });
});
