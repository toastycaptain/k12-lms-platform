import { fireEvent, render, screen } from "@testing-library/react";
import UnitsPage from "@/app/plan/units/page";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
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
}));

vi.mock("@/components/AppShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ProtectedRoute", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("Plan Units Page", () => {
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
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function mockUnits(units: Array<Record<string, unknown>>) {
    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === "/api/v1/unit_plans") return units as never;
      if (path === "/api/v1/courses") {
        return [{ id: 1, name: "Biology", code: "BIO-101" }] as never;
      }
      if (path.startsWith("/api/v1/unit_plans/") && path.endsWith("/versions")) {
        return [{ id: 1, version_number: 1 }] as never;
      }
      return [] as never;
    });
  }

  it("renders list of unit plans", async () => {
    mockUnits([
      {
        id: 1,
        title: "Cells",
        status: "draft",
        course_id: 1,
        current_version_id: 1,
        created_at: "2026-01-01",
      },
      {
        id: 2,
        title: "Genetics",
        status: "published",
        course_id: 1,
        current_version_id: 2,
        created_at: "2026-01-02",
      },
      {
        id: 3,
        title: "Ecology",
        status: "archived",
        course_id: 1,
        current_version_id: 3,
        created_at: "2026-01-03",
      },
    ]);

    render(<UnitsPage />);

    expect(await screen.findByText("Cells")).toBeInTheDocument();
    expect(screen.getByText("Genetics")).toBeInTheDocument();
    expect(screen.getByText("Ecology")).toBeInTheDocument();
  });

  it("renders empty state when no units", async () => {
    mockUnits([]);

    render(<UnitsPage />);

    expect(await screen.findByText(/No unit plans yet/i)).toBeInTheDocument();
  });

  it("search filters displayed units", async () => {
    mockUnits([
      {
        id: 1,
        title: "Cells",
        status: "draft",
        course_id: 1,
        current_version_id: 1,
        created_at: "2026-01-01",
      },
      {
        id: 2,
        title: "Genetics",
        status: "published",
        course_id: 1,
        current_version_id: 2,
        created_at: "2026-01-02",
      },
    ]);

    render(<UnitsPage />);

    expect(await screen.findByText("Cells")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Search by title..."), {
      target: { value: "gen" },
    });

    expect(screen.queryByText("Cells")).not.toBeInTheDocument();
    expect(screen.getByText("Genetics")).toBeInTheDocument();
  });

  it("shows create button linking to /plan/units/new", async () => {
    mockUnits([]);

    render(<UnitsPage />);

    const link = await screen.findByRole("link", { name: "New Unit Plan" });
    expect(link).toHaveAttribute("href", "/plan/units/new");
  });

  it("displays status badges for each unit", async () => {
    mockUnits([
      {
        id: 1,
        title: "Cells",
        status: "draft",
        course_id: 1,
        current_version_id: 1,
        created_at: "2026-01-01",
      },
      {
        id: 2,
        title: "Genetics",
        status: "published",
        course_id: 1,
        current_version_id: 2,
        created_at: "2026-01-02",
      },
    ]);

    render(<UnitsPage />);

    expect(await screen.findByText("draft")).toBeInTheDocument();
    expect(screen.getByText("published")).toBeInTheDocument();
  });
});
