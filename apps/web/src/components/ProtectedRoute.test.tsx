import { render, screen, waitFor } from "@testing-library/react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/ProtectedRoute";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));

describe("ProtectedRoute", () => {
  const replaceMock = vi.fn();
  const mockedUseRouter = vi.mocked(useRouter);
  const mockedUsePathname = vi.mocked(usePathname);
  const mockedUseAuth = vi.mocked(useAuth);

  beforeEach(() => {
    mockedUseRouter.mockReturnValue({ replace: replaceMock } as never);
    mockedUsePathname.mockReturnValue("/dashboard");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading UI while auth state is resolving", () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: true,
      error: null,
      signOut: async () => {},
      refresh: async () => {},
    });

    render(
      <ProtectedRoute>
        <div>Private content</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated users to /login", async () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: null,
      signOut: async () => {},
      refresh: async () => {},
    });

    render(
      <ProtectedRoute>
        <div>Private content</div>
      </ProtectedRoute>,
    );

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("Private content")).not.toBeInTheDocument();
  });

  it("renders children for authenticated users", () => {
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
      signOut: async () => {},
      refresh: async () => {},
    });

    render(
      <ProtectedRoute>
        <div>Private content</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText("Private content")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("redirects authenticated users without required roles", async () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: 22,
        email: "student@example.com",
        first_name: "Sam",
        last_name: "Student",
        tenant_id: 3,
        roles: ["student"],
        google_connected: false,
        onboarding_complete: true,
        preferences: {},
      },
      loading: false,
      error: null,
      signOut: async () => {},
      refresh: async () => {},
    });

    render(
      <ProtectedRoute requiredRoles={["admin"]}>
        <div>Admin content</div>
      </ProtectedRoute>,
    );

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/unauthorized"));
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
  });
});
