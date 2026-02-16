import { render, screen } from "@testing-library/react";
import UsersAndRolesPage from "@/app/admin/users/page";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { createMockUser } from "@/test/utils";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => "/admin/users"),
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

describe("Admin Users Page", () => {
  const mockedApiFetch = vi.mocked(apiFetch);
  const mockedUseAuth = vi.mocked(useAuth);

  function setupApi(users: Array<Record<string, unknown>>) {
    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === "/api/v1/users" || path.startsWith("/api/v1/users?role=")) {
        return users as never;
      }
      if (path === "/api/v1/integration_configs") {
        return [{ id: 1, provider: "oneroster", status: "active" }] as never;
      }
      return [] as never;
    });
  }

  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user: createMockUser({ roles: ["admin"] }),
      loading: false,
      error: null,
      signOut: vi.fn(async () => {}),
      refresh: vi.fn(async () => {}),
    });

    setupApi([
      {
        id: 1,
        email: "teacher@example.com",
        first_name: "Taylor",
        last_name: "Teacher",
        roles: ["teacher"],
      },
      {
        id: 2,
        email: "student@example.com",
        first_name: "Sam",
        last_name: "Student",
        roles: ["student"],
      },
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders user table", async () => {
    render(<UsersAndRolesPage />);

    expect(await screen.findByText("teacher@example.com")).toBeInTheDocument();
    expect(screen.getByText("student@example.com")).toBeInTheDocument();
  });

  it("shows create user button", async () => {
    render(<UsersAndRolesPage />);

    expect(await screen.findByRole("button", { name: "Create User" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New User" })).toBeInTheDocument();
  });

  it("renders role badges", async () => {
    render(<UsersAndRolesPage />);

    expect(await screen.findByText("Taylor Teacher")).toBeInTheDocument();
    expect(screen.getByText("teacher", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("student", { selector: "span" })).toBeInTheDocument();
  });

  it("handles empty user list", async () => {
    setupApi([]);

    render(<UsersAndRolesPage />);

    expect(await screen.findByText("No users found.")).toBeInTheDocument();
  });

  it("handles API error", async () => {
    mockedApiFetch.mockRejectedValue(new Error("boom"));

    render(<UsersAndRolesPage />);

    expect(await screen.findByText("Failed to load users.")).toBeInTheDocument();
  });
});
