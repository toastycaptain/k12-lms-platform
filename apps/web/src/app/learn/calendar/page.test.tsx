import { render, screen } from "@testing-library/react";
import LearnCalendarPage from "@/app/learn/calendar/page";
import { apiFetch } from "@/lib/api";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => "/learn/calendar"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
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

describe("Learn Calendar Page", () => {
  const mockedApiFetch = vi.mocked(apiFetch);

  beforeEach(() => {
    mockedApiFetch.mockResolvedValue({
      events: [
        {
          type: "assignment",
          id: 1,
          title: "Lab Report",
          course_id: 5,
          due_date: "2026-03-15T15:00:00Z",
          status: "published",
        },
      ],
    } as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders calendar events", async () => {
    render(<LearnCalendarPage />);

    expect(await screen.findByRole("heading", { name: "Calendar" })).toBeInTheDocument();
    expect(await screen.findByText("Lab Report")).toBeInTheDocument();
  });
});
