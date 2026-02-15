import { render, screen, waitFor } from "@testing-library/react";
import DashboardPage from "@/app/dashboard/page";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/components/AppShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ProtectedRoute", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

describe("DashboardPage", () => {
  const mockedApiFetch = vi.mocked(apiFetch);
  const mockedUseAuth = vi.mocked(useAuth);

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders dashboard data using API responses", async () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: 10,
        email: "teacher@example.com",
        first_name: "Taylor",
        last_name: "Teacher",
        tenant_id: 2,
        roles: ["teacher"],
        google_connected: true,
        onboarding_complete: true,
        preferences: {},
      },
      loading: false,
      error: null,
      signOut: async () => {},
      refresh: async () => {},
    });

    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === "/api/v1/unit_plans") {
        return [
          {
            id: 1,
            title: "Unit 1",
            status: "draft",
            course_id: 3,
            created_at: "2026-02-15T12:00:00Z",
          },
        ] as never;
      }
      if (path === "/api/v1/courses") {
        return [
          {
            id: 3,
            name: "Biology",
            code: "BIO-101",
          },
        ] as never;
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    render(<DashboardPage />);

    expect(screen.getByText("Welcome, Taylor Teacher")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Unit 1")).toBeInTheDocument());
    expect(screen.getByText("Biology")).toBeInTheDocument();
    expect(screen.getByText("BIO-101")).toBeInTheDocument();
  });
});
