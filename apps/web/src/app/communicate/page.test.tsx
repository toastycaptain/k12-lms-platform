import { fireEvent, render, screen } from "@testing-library/react";
import CommunicatePage from "@/app/communicate/page";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { createMockUser } from "@/test/utils";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => "/communicate"),
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
  ApiError: class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

vi.mock("@/components/LiveRegion", () => ({
  announce: vi.fn(),
  LiveRegion: () => null,
}));

vi.mock("@/components/AppShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ProtectedRoute", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("Communicate Page", () => {
  const mockedApiFetch = vi.mocked(apiFetch);
  const mockedUseAuth = vi.mocked(useAuth);

  function setupApi({ announcements = true }: { announcements?: boolean } = {}) {
    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === "/api/v1/announcements") {
        return announcements
          ? [
              {
                id: 1,
                course_id: 1,
                title: "Welcome",
                message: "Welcome class",
                created_at: "2026-02-10T10:00:00Z",
                published_at: "2026-02-10T10:00:00Z",
                course_name: "Biology 101",
                created_by_name: "Taylor Teacher",
              },
            ]
          : [];
      }
      if (path === "/api/v1/message_threads") {
        return [
          {
            id: 7,
            subject: "Homework question",
            thread_type: "direct",
            participants: [
              { id: 1, first_name: "Taylor", last_name: "Teacher", roles: ["teacher"] },
              { id: 2, first_name: "Sam", last_name: "Student", roles: ["student"] },
            ],
            last_message: {
              id: 99,
              body: "Can I get help?",
              created_at: "2026-02-11T10:00:00Z",
            },
            unread_count: 1,
            updated_at: "2026-02-11T10:00:00Z",
          },
        ] as never;
      }
      if (path === "/api/v1/courses") {
        return [{ id: 1, name: "Biology 101" }] as never;
      }
      return [] as never;
    });
  }

  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user: createMockUser({ id: 1, roles: ["teacher"] }),
      loading: false,
      error: null,
      signOut: vi.fn(async () => {}),
      refresh: vi.fn(async () => {}),
    });
    setupApi();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders Announcements tab by default", async () => {
    render(<CommunicatePage />);

    const tab = await screen.findByRole("tab", { name: "Announcements" });
    expect(tab).toHaveAttribute("aria-selected", "true");
  });

  it("switches to Messages tab", async () => {
    render(<CommunicatePage />);

    fireEvent.click(await screen.findByRole("tab", { name: "Messages" }));

    expect(await screen.findByRole("heading", { name: "Message Threads" })).toBeInTheDocument();
  });

  it("renders announcement list", async () => {
    render(<CommunicatePage />);

    expect(await screen.findByText("Welcome")).toBeInTheDocument();
    expect(screen.getByText(/Welcome class/)).toBeInTheDocument();
  });

  it("renders thread list in Messages tab", async () => {
    render(<CommunicatePage />);

    fireEvent.click(await screen.findByRole("tab", { name: "Messages" }));

    expect(await screen.findByText("Homework question")).toBeInTheDocument();
  });

  it("shows empty state for no announcements", async () => {
    setupApi({ announcements: false });

    render(<CommunicatePage />);

    expect(await screen.findByText("No announcements yet.")).toBeInTheDocument();
  });
});
