import { render, screen } from "@testing-library/react";
import LearnTodosPage from "@/app/learn/todos/page";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => "/learn/todos"),
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

describe("Learn Todos Page", () => {
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
        id: "assignment-1",
        source_type: "assignment",
        source_id: 1,
        title: "Essay draft",
        due_at: "2026-03-10T20:00:00Z",
        status: "not_submitted",
        course_id: 44,
        priority: "high",
      },
    ] as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders todo rows", async () => {
    render(<LearnTodosPage />);

    expect(await screen.findByRole("heading", { name: "To-dos" })).toBeInTheDocument();
    expect(await screen.findByText("Essay draft")).toBeInTheDocument();
  });
});
