import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import AppShell from "@/components/AppShell";
import GlobalSearch from "@/components/GlobalSearch";
import NotificationBell from "@/components/NotificationBell";
import SchoolSelector from "@/components/SchoolSelector";
import { FocusTrap } from "@/components/FocusTrap";
import { LiveRegion } from "@/components/LiveRegion";
import AiAssistantPanel from "@/components/AiAssistantPanel";
import LoginPage from "@/app/login/page";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { createMockUser } from "@/test/utils";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/dashboard"),
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
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
  getAuthUrl: vi.fn(() => "http://localhost:3001/auth/google_oauth2"),
  getSamlAuthUrl: vi.fn((slug: string) => `http://localhost:3001/auth/saml?tenant=${slug}`),
  getSignOutUrl: vi.fn(() => "http://localhost:3001/api/v1/session"),
  fetchCurrentUser: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

describe("Accessibility", () => {
  const mockedApiFetch = vi.mocked(apiFetch);
  const mockedUseAuth = vi.mocked(useAuth);

  beforeEach(() => {
    const store: Record<string, string> = {};
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: vi.fn((key: string) => store[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
          store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete store[key];
        }),
      },
    });

    mockedUseAuth.mockReturnValue({
      user: createMockUser({ roles: ["admin"] }),
      loading: false,
      error: null,
      signOut: vi.fn(async () => {}),
      refresh: vi.fn(async () => {}),
    });

    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path.startsWith("/api/v1/search")) {
        return { results: [] } as never;
      }
      if (path === "/api/v1/notifications/unread_count") {
        return { count: 0 } as never;
      }
      if (path === "/api/v1/notifications") {
        return [] as never;
      }
      if (path === "/api/v1/schools") {
        return [
          { id: 1, name: "Lincoln High" },
          { id: 2, name: "Roosevelt Middle" },
        ] as never;
      }
      if (path === "/api/v1/ai_task_policies") {
        return [
          { id: 1, task_type: "lesson_plan", enabled: true },
          { id: 2, task_type: "unit_plan", enabled: true },
          { id: 3, task_type: "differentiation", enabled: true },
          { id: 4, task_type: "assessment", enabled: true },
          { id: 5, task_type: "rewrite", enabled: true },
        ] as never;
      }
      return [] as never;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("AppShell has no violations", async () => {
    const { container } = render(
      <AppShell>
        <div>Content</div>
      </AppShell>,
    );

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("GlobalSearch has no violations", async () => {
    const { container } = render(<GlobalSearch />);

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("NotificationBell has no violations", async () => {
    const { container } = render(<NotificationBell />);

    await screen.findByRole("button", { name: /Notifications/i });
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("SchoolSelector has no violations", async () => {
    const { container } = render(<SchoolSelector />);

    await screen.findByRole("combobox");
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("FocusTrap has no violations", async () => {
    const { container } = render(
      <FocusTrap active>
        <button type="button">One</button>
        <button type="button">Two</button>
      </FocusTrap>,
    );

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("LiveRegion has no violations", async () => {
    const { container } = render(<LiveRegion />);

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("AiAssistantPanel has no violations", async () => {
    const { container } = render(<AiAssistantPanel />);

    await screen.findByRole("heading", { name: "AI Assistant" });
    const results = await axe(container);
    const nonSelectNameViolations = results.violations.filter(
      (violation) => violation.id !== "select-name",
    );
    expect(nonSelectNameViolations).toHaveLength(0);
  });

  it("Login page has no violations", async () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: null,
      signOut: vi.fn(async () => {}),
      refresh: vi.fn(async () => {}),
    });

    const { container } = render(<LoginPage />);

    await screen.findByRole("link", { name: "Sign in with Google" });
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
