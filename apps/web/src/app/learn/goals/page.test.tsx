import { render, screen } from "@testing-library/react";
import LearnGoalsPage from "@/app/learn/goals/page";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => "/learn/goals"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
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

describe("Learn Goals Page", () => {
  const mockedApiFetch = vi.mocked(apiFetch);
  const mockedUseAuth = vi.mocked(useAuth);

  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: 7,
        email: "student@example.com",
        first_name: "Sam",
        last_name: "Student",
        tenant_id: 1,
        roles: ["student"],
        google_connected: false,
        onboarding_complete: true,
        preferences: {},
      },
      loading: false,
      error: null,
      signOut: vi.fn(async () => {}),
      refresh: vi.fn(async () => {}),
    });

    mockedApiFetch.mockResolvedValue([
      {
        id: 11,
        student_id: 7,
        title: "Practice multiplication",
        description: "20 questions daily",
        status: "active",
        target_date: "2026-03-31",
        progress_percent: 40,
      },
    ] as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders student goals", async () => {
    render(<LearnGoalsPage />);

    expect(await screen.findByRole("heading", { name: "Goals" })).toBeInTheDocument();
    expect(await screen.findByText("Practice multiplication")).toBeInTheDocument();
  });
});
