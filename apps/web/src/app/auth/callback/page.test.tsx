import { render, waitFor } from "@testing-library/react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthCallbackPage from "@/app/auth/callback/page";
import { useAuth } from "@/lib/auth-context";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  getAuthUrl: vi.fn(() => "http://localhost:3001/auth/google_oauth2"),
}));

describe("AuthCallbackPage", () => {
  const mockedUseRouter = vi.mocked(useRouter);
  const mockedUseSearchParams = vi.mocked(useSearchParams);
  const mockedUseAuth = vi.mocked(useAuth);
  const replaceMock = vi.fn();

  beforeEach(() => {
    mockedUseRouter.mockReturnValue({ replace: replaceMock } as never);
    mockedUseSearchParams.mockReturnValue(new URLSearchParams() as never);
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
    window.sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("redirects to query redirect param after auth success", async () => {
    mockedUseSearchParams.mockReturnValue(
      new URLSearchParams("redirect=/teach/courses/1") as never,
    );

    render(<AuthCallbackPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/teach/courses/1");
    });
  });

  it("falls back to persisted redirect when query param is missing", async () => {
    window.sessionStorage.setItem("k12.auth.redirect", "/teach/courses/1/gradebook");

    render(<AuthCallbackPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/teach/courses/1/gradebook");
    });

    expect(window.sessionStorage.getItem("k12.auth.redirect")).toBeNull();
  });
});
