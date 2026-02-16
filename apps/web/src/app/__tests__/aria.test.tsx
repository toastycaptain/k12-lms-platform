import { fireEvent, render, screen } from "@testing-library/react";
import AppShell from "@/components/AppShell";
import GlobalSearch from "@/components/GlobalSearch";
import NotificationBell from "@/components/NotificationBell";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { createMockUser } from "@/test/utils";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: pushMock, replace: vi.fn() })),
  usePathname: vi.fn(() => "/plan/units"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    onClick,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    [key: string]: unknown;
  }) => (
    <a href={href} className={className} onClick={onClick} {...rest}>
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

describe("ARIA Attributes", () => {
  const mockedApiFetch = vi.mocked(apiFetch);
  const mockedUseAuth = vi.mocked(useAuth);

  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user: createMockUser({ roles: ["teacher"] }),
      loading: false,
      error: null,
      signOut: vi.fn(async () => {}),
      refresh: vi.fn(async () => {}),
    });

    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path.startsWith("/api/v1/search")) {
        return {
          results: [{ type: "unit_plan", id: 1, title: "Cell Unit", url: "/plan/units/1" }],
        } as never;
      }
      if (path === "/api/v1/notifications/unread_count") {
        return { count: 1 } as never;
      }
      if (path === "/api/v1/notifications") {
        return [
          {
            id: 1,
            title: "Reminder",
            message: "Check assignment",
            url: "/notifications/1",
            read_at: null,
            created_at: "2026-02-10T10:00:00Z",
          },
        ] as never;
      }
      if (path === "/api/v1/schools") {
        return [{ id: 1, name: "Lincoln High" }] as never;
      }
      return [] as never;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("AppShell landmarks", () => {
    const { container } = render(
      <AppShell>
        <div>Body</div>
      </AppShell>,
    );

    expect(container.querySelector('nav[aria-label="Main navigation"]')).toBeInTheDocument();
    expect(container.querySelector("main[role='main']")).toBeInTheDocument();
    expect(container.querySelector("header[role='banner']")).toBeInTheDocument();
    expect(container.querySelector('aside[aria-label="Sidebar"]')).toBeInTheDocument();
  });

  it("GlobalSearch combobox pattern", async () => {
    render(<GlobalSearch />);

    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "ce" } });

    const listbox = await screen.findByRole("listbox");
    await screen.findByRole("option", { name: /Cell Unit/i });
    input.focus();
    fireEvent.keyDown(input, { key: "ArrowDown" });

    expect(input).toHaveAttribute("role", "combobox");
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(input).toHaveAttribute("aria-controls");
    expect(input).toHaveAttribute("aria-activedescendant");
    expect(listbox).toHaveAttribute("role", "listbox");
    expect(screen.getByRole("option", { name: /Cell Unit/i })).toBeInTheDocument();
  });

  it("NotificationBell menu pattern", async () => {
    render(<NotificationBell />);

    const bell = await screen.findByRole("button", { name: /Notifications, 1 unread/i });
    fireEvent.click(bell);

    expect(bell).toHaveAttribute("aria-haspopup", "menu");
    expect(bell).toHaveAttribute("aria-expanded", "true");
    expect(bell).toHaveAttribute("aria-controls", "notifications-menu");
    expect(await screen.findByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Reminder/i })).toBeInTheDocument();
  });

  it('Active nav item has aria-current="page"', () => {
    render(
      <AppShell>
        <div>Body</div>
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: "Plan" })).toHaveAttribute("aria-current", "page");
  });

  it("Skip navigation link", () => {
    render(
      <AppShell>
        <div>Body</div>
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveAttribute(
      "href",
      "#main-content",
    );
  });
});
