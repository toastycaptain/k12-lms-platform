import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AppShell from "@/components/AppShell";
import GlobalSearch from "@/components/GlobalSearch";
import NotificationBell from "@/components/NotificationBell";
import { FocusTrap } from "@k12/ui";
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
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    [key: string]: unknown;
  }) => (
    <a href={href} className={className} onClick={onClick}>
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

describe("Keyboard Navigation", () => {
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
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("Tab navigation through AppShell landmarks", async () => {
    render(
      <AppShell>
        <div>Main content body</div>
      </AppShell>,
    );

    const skip = screen.getByRole("link", { name: "Skip to main content" });
    const home = screen.getByRole("link", { name: "K-12 LMS" });
    const plan = screen.getByRole("link", { name: "Plan" });

    skip.focus();
    expect(skip).toHaveFocus();
    home.focus();
    expect(home).toHaveFocus();
    plan.focus();
    expect(plan).toHaveFocus();
  });

  it("GlobalSearch keyboard flow", async () => {
    render(<GlobalSearch />);

    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "cell" } });

    await screen.findByRole("listbox");
    const [firstOption] = await screen.findAllByRole("option");
    expect(firstOption).toHaveTextContent(/Cell\s+Unit/i);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(pushMock).toHaveBeenCalledWith("/plan/units/1");

    fireEvent.change(input, { target: { value: "cell" } });
    await screen.findByRole("listbox");
    input.focus();
    fireEvent.keyDown(input, { key: "Escape" });

    await waitFor(() => expect(input).toHaveAttribute("aria-expanded", "false"));
  });

  it("NotificationBell keyboard flow", async () => {
    render(<NotificationBell />);

    const bell = await screen.findByRole("button", { name: /Notifications, 1 unread/i });
    bell.focus();
    expect(bell).toHaveFocus();

    fireEvent.click(bell);
    expect(await screen.findByText("Notifications")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByText("Notifications")).not.toBeInTheDocument();
      expect(bell).toHaveFocus();
    });
  });

  it("FocusTrap captures Tab cycle", () => {
    const { container } = render(
      <FocusTrap active>
        <button type="button">First</button>
        <button type="button">Second</button>
      </FocusTrap>,
    );

    const first = screen.getByRole("button", { name: "First" });
    const second = screen.getByRole("button", { name: "Second" });

    second.focus();
    fireEvent.keyDown(container.firstChild as Element, { key: "Tab" });
    expect(first).toHaveFocus();

    first.focus();
    fireEvent.keyDown(container.firstChild as Element, { key: "Tab", shiftKey: true });
    expect(second).toHaveFocus();
  });
});
