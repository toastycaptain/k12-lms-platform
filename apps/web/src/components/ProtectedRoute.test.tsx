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
  const previousDisableWelcomeTour = process.env.NEXT_PUBLIC_DISABLE_WELCOME_TOUR;

  beforeEach(() => {
    mockedUseRouter.mockReturnValue({ replace: replaceMock } as never);
    mockedUsePathname.mockReturnValue("/dashboard");
    process.env.NEXT_PUBLIC_DISABLE_WELCOME_TOUR = previousDisableWelcomeTour;
    document.documentElement.dataset.disableWelcomeTour = "0";
    document.documentElement.dataset.authBypass = "0";
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_DISABLE_WELCOME_TOUR = previousDisableWelcomeTour;
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

  it("redirects to /setup when onboarding is incomplete", async () => {
    mockedUsePathname.mockReturnValue("/dashboard");
    mockedUseAuth.mockReturnValue({
      user: {
        id: 33,
        email: "teacher@example.com",
        first_name: "Taylor",
        last_name: "Teacher",
        tenant_id: 4,
        roles: ["teacher"],
        google_connected: false,
        onboarding_complete: false,
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

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/setup"));
  });

  it("does not redirect to /setup for exempt paths", async () => {
    mockedUsePathname.mockReturnValue("/setup");
    mockedUseAuth.mockReturnValue({
      user: {
        id: 33,
        email: "teacher@example.com",
        first_name: "Taylor",
        last_name: "Teacher",
        tenant_id: 4,
        roles: ["teacher"],
        google_connected: false,
        onboarding_complete: false,
        preferences: {},
      },
      loading: false,
      error: null,
      signOut: async () => {},
      refresh: async () => {},
    });

    render(
      <ProtectedRoute>
        <div>Setup content</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText("Setup content")).toBeInTheDocument();
    await waitFor(() => expect(replaceMock).not.toHaveBeenCalledWith("/setup"));
  });

  it("redirects from /setup to /dashboard when onboarding is already complete", async () => {
    mockedUsePathname.mockReturnValue("/setup");
    mockedUseAuth.mockReturnValue({
      user: {
        id: 33,
        email: "teacher@example.com",
        first_name: "Taylor",
        last_name: "Teacher",
        tenant_id: 4,
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
        <div>Setup content</div>
      </ProtectedRoute>,
    );

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/dashboard"));
  });

  it("accepts custom unauthorizedRedirect path", async () => {
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
      <ProtectedRoute requiredRoles={["admin"]} unauthorizedRedirect="/forbidden">
        <div>Admin content</div>
      </ProtectedRoute>,
    );

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/forbidden"));
  });

  it("skips onboarding setup redirect when welcome tour is disabled", async () => {
    process.env.NEXT_PUBLIC_DISABLE_WELCOME_TOUR = "true";
    mockedUsePathname.mockReturnValue("/dashboard");
    mockedUseAuth.mockReturnValue({
      user: {
        id: 33,
        email: "teacher@example.com",
        first_name: "Taylor",
        last_name: "Teacher",
        tenant_id: 4,
        roles: ["teacher"],
        google_connected: false,
        onboarding_complete: false,
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
    await waitFor(() => expect(replaceMock).not.toHaveBeenCalledWith("/setup"));
  });

  it("skips onboarding setup redirect when runtime flag disables welcome tour", async () => {
    document.documentElement.dataset.disableWelcomeTour = "1";
    mockedUsePathname.mockReturnValue("/dashboard");
    mockedUseAuth.mockReturnValue({
      user: {
        id: 33,
        email: "teacher@example.com",
        first_name: "Taylor",
        last_name: "Teacher",
        tenant_id: 4,
        roles: ["teacher"],
        google_connected: false,
        onboarding_complete: false,
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
    await waitFor(() => expect(replaceMock).not.toHaveBeenCalledWith("/setup"));
  });
});
