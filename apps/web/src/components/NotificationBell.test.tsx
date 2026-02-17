import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";
import { apiFetch } from "@/lib/api";
import { announce } from "@k12/ui";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
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
  }) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

vi.mock("@k12/ui", async () => {
  const actual = await vi.importActual<typeof import("@k12/ui")>("@k12/ui");
  return {
    ...actual,
    announce: vi.fn(),
    LiveRegion: () => null,
  };
});

describe("NotificationBell", () => {
  const mockedApiFetch = vi.mocked(apiFetch);
  const mockedUseRouter = vi.mocked(useRouter);
  const mockedAnnounce = vi.mocked(announce);
  const pushMock = vi.fn();

  function mockDefaultResponses(count = 3) {
    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === "/api/v1/notifications/unread_count") {
        return { count } as never;
      }
      if (path === "/api/v1/notifications") {
        return [
          {
            id: 1,
            title: "Assignment posted",
            message: "A new assignment is ready",
            url: "/learn/courses/1/assignments/1",
            read_at: null,
            created_at: new Date().toISOString(),
          },
        ] as never;
      }
      return {} as never;
    });
  }

  beforeEach(() => {
    mockedUseRouter.mockReturnValue({ push: pushMock } as never);
    mockDefaultResponses();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  async function waitForUnreadCountCall() {
    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith("/api/v1/notifications/unread_count");
    });
  }

  it("renders bell button with unread count badge", async () => {
    render(<NotificationBell />);
    await waitForUnreadCountCall();

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("hides badge when unread count is 0", async () => {
    mockDefaultResponses(0);

    render(<NotificationBell />);
    await waitForUnreadCountCall();

    expect(screen.queryByText("99+")).not.toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("toggles notification panel on click", async () => {
    render(<NotificationBell />);
    await waitForUnreadCountCall();

    const bell = screen.getByRole("button", { name: /Notifications/i });
    fireEvent.click(bell);
    expect(await screen.findByText("Notifications")).toBeInTheDocument();

    fireEvent.click(bell);
    await waitFor(() => {
      expect(screen.queryByText("Notifications")).not.toBeInTheDocument();
    });
  });

  it("fetches and renders notifications when panel opens", async () => {
    render(<NotificationBell />);
    await waitForUnreadCountCall();

    fireEvent.click(screen.getByRole("button", { name: /Notifications/i }));

    expect(await screen.findByText("Assignment posted")).toBeInTheDocument();
    expect(mockedApiFetch).toHaveBeenCalledWith("/api/v1/notifications");
  });

  it("renders empty state when no notifications", async () => {
    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === "/api/v1/notifications/unread_count") return { count: 0 } as never;
      if (path === "/api/v1/notifications") return [] as never;
      return {} as never;
    });

    render(<NotificationBell />);
    await waitForUnreadCountCall();
    fireEvent.click(screen.getByRole("button", { name: /Notifications/i }));

    expect(await screen.findByText("No notifications yet.")).toBeInTheDocument();
  });

  it("marks individual notification as read", async () => {
    mockedApiFetch.mockImplementation(async (path: string, options?: RequestInit) => {
      if (path === "/api/v1/notifications/unread_count") return { count: 1 } as never;
      if (path === "/api/v1/notifications") {
        return [
          {
            id: 9,
            title: "Assignment posted",
            message: "A new assignment is ready",
            url: "/learn/courses/1/assignments/1",
            read_at: null,
            created_at: new Date().toISOString(),
          },
        ] as never;
      }
      if (path === "/api/v1/notifications/9/read") {
        expect(options?.method).toBe("PATCH");
        return {} as never;
      }
      return {} as never;
    });

    render(<NotificationBell />);
    await waitForUnreadCountCall();
    fireEvent.click(screen.getByRole("button", { name: /Notifications/i }));

    fireEvent.click(await screen.findByRole("menuitem", { name: /Assignment posted/i }));

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith(
        "/api/v1/notifications/9/read",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
  });

  it("marks all notifications as read", async () => {
    render(<NotificationBell />);
    await waitForUnreadCountCall();

    fireEvent.click(screen.getByRole("button", { name: /Notifications/i }));
    fireEvent.click(await screen.findByRole("button", { name: "Mark all read" }));

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith(
        "/api/v1/notifications/mark_all_read",
        expect.objectContaining({ method: "POST" }),
      );
      expect(mockedAnnounce).toHaveBeenCalledWith("All notifications marked as read");
    });
  });

  it("closes panel on Escape key and returns focus to bell", async () => {
    render(<NotificationBell />);
    await waitForUnreadCountCall();

    const bell = screen.getByRole("button", { name: /Notifications/i });
    fireEvent.click(bell);
    expect(await screen.findByText("Notifications")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByText("Notifications")).not.toBeInTheDocument();
      expect(document.activeElement).toBe(bell);
    });
  });

  it("polls unread count at intervals", async () => {
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval");
    render(<NotificationBell />);
    await waitForUnreadCountCall();

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30000);
  });

  it("has correct ARIA attributes", async () => {
    render(<NotificationBell />);
    await waitForUnreadCountCall();

    const bell = screen.getByRole("button", { name: /Notifications, 3 unread/i });
    expect(bell).toHaveAttribute("aria-haspopup", "menu");
    expect(bell).toHaveAttribute("aria-expanded", "false");
    expect(bell).toHaveAttribute("aria-controls", "notifications-menu");
  });
});
