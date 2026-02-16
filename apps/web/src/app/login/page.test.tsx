import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import LoginPage from "@/app/login/page";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  getAuthUrl: vi.fn(() => "http://localhost:3001/auth/google_oauth2"),
  getSamlAuthUrl: vi.fn((slug: string) => `http://localhost:3001/auth/saml?tenant=${slug}`),
}));

describe("LoginPage", () => {
  const mockedUseRouter = vi.mocked(useRouter);
  const mockedUseSearchParams = vi.mocked(useSearchParams);
  const mockedUseAuth = vi.mocked(useAuth);
  const pushMock = vi.fn();

  beforeEach(() => {
    mockedUseRouter.mockReturnValue({ push: pushMock } as never);
    mockedUseSearchParams.mockReturnValue(new URLSearchParams() as never);
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: null,
      signOut: vi.fn(async () => {}),
      refresh: vi.fn(async () => {}),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders Google sign-in link", () => {
    render(<LoginPage />);

    expect(screen.getByRole("link", { name: "Sign in with Google" })).toHaveAttribute(
      "href",
      "http://localhost:3001/auth/google_oauth2",
    );
  });

  it("renders SSO button", () => {
    render(<LoginPage />);

    expect(screen.getByRole("button", { name: "Sign in with SSO" })).toBeInTheDocument();
  });

  it("shows school code input when SSO is clicked", () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByRole("button", { name: "Sign in with SSO" }));

    expect(screen.getByPlaceholderText("school-slug")).toBeInTheDocument();
  });

  it("shows error when SSO submitted without school code", () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByRole("button", { name: "Sign in with SSO" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue with SSO" }));

    expect(screen.getByText("Enter your school code to continue.")).toBeInTheDocument();
  });

  it("redirects authenticated user to /dashboard", async () => {
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

    render(<LoginPage />);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows auth error from URL params", () => {
    mockedUseSearchParams.mockReturnValue(new URLSearchParams("error=failed") as never);

    render(<LoginPage />);

    expect(screen.getByText("Authentication failed. Please try again.")).toBeInTheDocument();
  });

  it("renders loading state while auth is resolving", () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: true,
      error: null,
      signOut: vi.fn(async () => {}),
      refresh: vi.fn(async () => {}),
    });

    render(<LoginPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
