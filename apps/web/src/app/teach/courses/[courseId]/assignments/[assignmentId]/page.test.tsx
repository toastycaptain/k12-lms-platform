import { render, screen, waitFor } from "@testing-library/react";
import { useParams } from "next/navigation";
import AssignmentEditorPage from "@/app/teach/courses/[courseId]/assignments/[assignmentId]/page";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { buildStandard } from "@/test/factories";
import { createMockUser } from "@/test/utils";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => "/teach/courses/1/assignments/1"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useParams: vi.fn(() => ({ courseId: "1", assignmentId: "1" })),
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

vi.mock("@/components/GoogleDrivePicker", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
}));

describe("Assignment Management Page", () => {
  const mockedApiFetch = vi.mocked(apiFetch);
  const mockedUseAuth = vi.mocked(useAuth);
  const mockedUseParams = vi.mocked(useParams);

  function setupAssignment(status = "draft") {
    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === "/api/v1/assignments/1") {
        return {
          id: 1,
          title: "Cell Diagram",
          description: "Draw and label a cell",
          instructions: "Use your notes",
          assignment_type: "written",
          points_possible: "100",
          due_at: "2026-03-01T23:59:00Z",
          unlock_at: null,
          lock_at: null,
          submission_types: ["online_text"],
          status,
          rubric_id: null,
          standard_ids: [1],
        } as never;
      }
      if (path === "/api/v1/rubrics") {
        return [] as never;
      }
      if (path === "/api/v1/standards") {
        return [buildStandard({ id: 1, code: "STD-1", description: "Standard one" })] as never;
      }
      if (path === "/api/v1/assignments/1/resource_links") {
        return [] as never;
      }
      if (path === "/api/v1/integration_configs") {
        return [] as never;
      }
      return [] as never;
    });
  }

  beforeEach(() => {
    mockedUseParams.mockReturnValue({ courseId: "1", assignmentId: "1" } as never);
    mockedUseAuth.mockReturnValue({
      user: createMockUser({ roles: ["teacher"] }),
      loading: false,
      error: null,
      signOut: vi.fn(async () => {}),
      refresh: vi.fn(async () => {}),
    });
    setupAssignment();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders assignment details", async () => {
    render(<AssignmentEditorPage />);

    expect(await screen.findByRole("heading", { name: "Assignment Editor" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Cell Diagram")).toBeInTheDocument();
    expect(screen.getByDisplayValue("100")).toBeInTheDocument();
  });

  it("renders standards alignment list", async () => {
    render(<AssignmentEditorPage />);

    expect(await screen.findByRole("heading", { name: "Standards Alignment" })).toBeInTheDocument();
    expect(screen.getByText(/STD-1/)).toBeInTheDocument();
  });

  it("shows submission status badge", async () => {
    setupAssignment("published");

    render(<AssignmentEditorPage />);

    expect(await screen.findByText("published")).toBeInTheDocument();
  });

  it("handles missing assignment (404)", async () => {
    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === "/api/v1/assignments/1") {
        throw new Error("Not found");
      }
      return [] as never;
    });

    render(<AssignmentEditorPage />);

    await waitFor(() => {
      expect(screen.getByText("Assignment not found.")).toBeInTheDocument();
    });
  });
});
