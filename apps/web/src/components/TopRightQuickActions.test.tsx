import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import TopRightQuickActions from "@/components/TopRightQuickActions";
import { createMockUser } from "@/test/utils";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

vi.mock("@/components/GlobalSearch", () => ({
  default: () => <div>GlobalSearchStub</div>,
}));

vi.mock("@/components/NotificationBell", () => ({
  default: () => (
    <button type="button" aria-label="Notifications">
      NotificationBellStub
    </button>
  ),
}));

describe("TopRightQuickActions", () => {
  const mockedUseAuth = vi.mocked(useAuth);
  const mockedApiFetch = vi.mocked(apiFetch);
  const signOutMock = vi.fn(async () => {});

  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user: createMockUser({
        first_name: "Casey",
        last_name: "Creator",
        email: "casey@example.com",
        roles: ["teacher", "admin"],
      }),
      loading: false,
      error: null,
      signOut: signOutMock,
      refresh: vi.fn(async () => {}),
    });
    mockedApiFetch.mockResolvedValue({ events: [] } as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders controls in order: search, schedule, notifications, help, profile", () => {
    render(<TopRightQuickActions />);

    const searchButton = screen.getByRole("button", { name: "Search your account" });
    const scheduleButton = screen.getByRole("button", { name: "Today's schedule" });
    const notificationsButton = screen.getByRole("button", { name: "Notifications" });
    const helpButton = screen.getByRole("button", { name: "Help center" });
    const profileButton = screen.getByRole("button", { name: /Casey Creator/i });

    expect(
      searchButton.compareDocumentPosition(scheduleButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      scheduleButton.compareDocumentPosition(notificationsButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      notificationsButton.compareDocumentPosition(helpButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      helpButton.compareDocumentPosition(profileButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    expect(screen.getByRole("button", { name: "Search your account" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Today's schedule" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Help center" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Casey Creator/i })).toBeInTheDocument();
  });

  it("omits notifications when disabled", () => {
    render(<TopRightQuickActions showNotifications={false} />);

    expect(screen.queryByRole("button", { name: "Notifications" })).not.toBeInTheDocument();
  });

  it("loads and displays today's schedule in a top-right dropdown", async () => {
    mockedApiFetch.mockResolvedValue({
      events: [
        { id: 99, type: "assignment", title: "Math Homework", due_date: "2026-02-27T13:00:00Z" },
      ],
    } as never);

    render(<TopRightQuickActions />);
    fireEvent.click(screen.getByRole("button", { name: "Today's schedule" }));

    expect(await screen.findByText("Today's Schedule")).toBeInTheDocument();
    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith(
        expect.stringMatching(
          /^\/api\/v1\/calendar\?start_date=\d{4}-\d{2}-\d{2}&end_date=\d{4}-\d{2}-\d{2}$/,
        ),
      );
    });
    expect(screen.getByText("Math Homework")).toBeInTheDocument();
  });

  it("shows help links and search tool from their dropdowns", () => {
    render(<TopRightQuickActions />);

    fireEvent.click(screen.getByRole("button", { name: "Help center" }));
    expect(screen.getByRole("heading", { name: "Help Center" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Help Center" })).toHaveAttribute("href", "/docs/api");

    fireEvent.click(screen.getByRole("button", { name: "Search your account" }));
    expect(screen.getByRole("heading", { name: "Search Your Account" })).toBeInTheDocument();
    expect(screen.getByText("GlobalSearchStub")).toBeInTheDocument();
  });

  it("shows profile details and supports sign out", () => {
    render(<TopRightQuickActions />);

    fireEvent.click(screen.getByRole("button", { name: /Casey Creator/i }));
    expect(screen.getByRole("heading", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByText("casey@example.com")).toBeInTheDocument();
    expect(screen.getByText("Roles: teacher, admin")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(signOutMock).toHaveBeenCalled();
  });

  it("renders nothing when no authenticated user exists", () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: null,
      signOut: signOutMock,
      refresh: vi.fn(async () => {}),
    });

    render(<TopRightQuickActions />);
    expect(screen.queryByRole("button", { name: "Today's schedule" })).not.toBeInTheDocument();
    expect(screen.queryByText("GlobalSearchStub")).not.toBeInTheDocument();
  });
});
