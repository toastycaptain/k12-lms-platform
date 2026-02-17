import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import UnitPlannerPage from "@/app/plan/units/[id]/page";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useParams: vi.fn(() => ({ id: "1" })),
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
}));

vi.mock("@/components/AppShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ProtectedRoute", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/AiAssistantPanel", () => ({
  default: ({
    onApply,
    onTaskTypeChange,
  }: {
    onApply?: (content: string, target?: string) => void;
    onTaskTypeChange?: (taskType: string) => void;
  }) => (
    <div>
      <p>AI Assistant</p>
      <button onClick={() => onTaskTypeChange?.("assessment")}>Set Assessment Task</button>
      <button onClick={() => onApply?.("AI generated essential question")}>Apply AI Draft</button>
    </div>
  ),
}));

describe("Plan Unit Editor Page", () => {
  const mockedApiFetch = vi.mocked(apiFetch);
  const mockedUseAuth = vi.mocked(useAuth);

  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: 1,
        email: "teacher@example.com",
        first_name: "Taylor",
        last_name: "Teacher",
        tenant_id: 1,
        roles: ["teacher"],
        google_connected: false,
        onboarding_complete: true,
        preferences: {},
      },
      loading: false,
      error: null,
      signOut: vi.fn(async () => {}),
      refresh: vi.fn(async () => {}),
    });

    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === "/api/v1/unit_plans/1") {
        return {
          id: 1,
          title: "Cells",
          status: "draft",
          course_id: 1,
          current_version_id: 10,
        } as never;
      }
      if (path === "/api/v1/unit_plans/1/versions") {
        return [
          {
            id: 10,
            version_number: 2,
            title: "Cells Unit",
            description: "Unit description",
            essential_questions: ["What is a cell?"],
            enduring_understandings: ["Cells are building blocks"],
            created_at: "2026-01-01",
          },
        ] as never;
      }
      if (path === "/api/v1/unit_plans/1/lesson_plans") {
        return [{ id: 101, title: "Lesson One", position: 1, status: "draft" }] as never;
      }
      if (path === "/api/v1/standard_frameworks") {
        return [{ id: 1, name: "NGSS" }] as never;
      }
      if (path === "/api/v1/standards") {
        return [{ id: 1, code: "STD-1", description: "Standard one" }] as never;
      }
      if (path === "/api/v1/unit_versions/10/standards") {
        return [{ id: 1, code: "STD-1", description: "Standard one" }] as never;
      }
      return [] as never;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders unit plan details", async () => {
    render(<UnitPlannerPage />);

    expect(await screen.findByDisplayValue("Cells Unit")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Unit description")).toBeInTheDocument();
  });

  it("renders associated standards", async () => {
    render(<UnitPlannerPage />);

    expect(await screen.findByText("STD-1")).toBeInTheDocument();
  });

  it("renders lesson plans list", async () => {
    render(<UnitPlannerPage />);

    expect(await screen.findByText("Lesson One")).toBeInTheDocument();
  });

  it("shows AI assistant panel", async () => {
    render(<UnitPlannerPage />);

    fireEvent.click(await screen.findByRole("button", { name: "AI Assistant" }));

    expect(screen.getByText("AI Assistant")).toBeInTheDocument();
  });

  it("applies AI output into the unit planning form", async () => {
    render(<UnitPlannerPage />);

    fireEvent.click(await screen.findByRole("button", { name: "AI Assistant" }));
    fireEvent.click(screen.getByRole("button", { name: "Set Assessment Task" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply AI Draft" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm Apply" }));

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith(
        "/api/v1/unit_plans/1/create_version",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });
  });

  it("handles loading state", () => {
    mockedApiFetch.mockImplementation(() => new Promise(() => {}) as Promise<never>);

    render(<UnitPlannerPage />);

    expect(screen.getAllByLabelText("Loading").length).toBeGreaterThan(0);
  });
});
