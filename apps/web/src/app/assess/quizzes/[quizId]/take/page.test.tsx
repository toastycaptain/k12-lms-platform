import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useParams, useRouter } from "next/navigation";
import QuizTakePage from "@/app/assess/quizzes/[quizId]/take/page";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { buildQuiz } from "@/test/factories";
import { createMockUser } from "@/test/utils";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => "/assess/quizzes/1/take"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useParams: vi.fn(() => ({ quizId: "1" })),
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

vi.mock("@/components/AppShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ProtectedRoute", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("Quiz Attempt Page", () => {
  const mockedApiFetch = vi.mocked(apiFetch);
  const mockedUseAuth = vi.mocked(useAuth);
  const mockedUseParams = vi.mocked(useParams);
  const mockedUseRouter = vi.mocked(useRouter);
  const pushMock = vi.fn();

  function setupApi(attempts: Array<Record<string, unknown>> = []) {
    mockedApiFetch.mockImplementation(async (path: string, options?: RequestInit) => {
      if (path === "/api/v1/quizzes/1") {
        return buildQuiz({
          id: 1,
          title: "Cell Biology Quiz",
          instructions: "Read each question carefully.",
          time_limit_minutes: 30,
          attempts_allowed: 2,
          points_possible: 100,
          status: "published",
        }) as never;
      }
      if (path === "/api/v1/quizzes/1/attempts" && (!options || !options.method)) {
        return attempts as never;
      }
      if (path === "/api/v1/quizzes/1/attempts" && options?.method === "POST") {
        return { id: 99 } as never;
      }
      return [] as never;
    });
  }

  beforeEach(() => {
    mockedUseParams.mockReturnValue({ quizId: "1" } as never);
    mockedUseRouter.mockReturnValue({ push: pushMock } as never);
    mockedUseAuth.mockReturnValue({
      user: createMockUser({ roles: ["student"] }),
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

  it("renders quiz title and instructions", async () => {
    render(<QuizTakePage />);

    expect(await screen.findByRole("heading", { name: "Cell Biology Quiz" })).toBeInTheDocument();
    expect(screen.getByText("Read each question carefully.")).toBeInTheDocument();
  });

  it("renders timer details when time limit is set", async () => {
    render(<QuizTakePage />);

    expect(await screen.findByText("30 minutes")).toBeInTheDocument();
  });

  it("starts a new attempt on click", async () => {
    render(<QuizTakePage />);

    fireEvent.click(await screen.findByRole("button", { name: "Start Attempt" }));

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith(
        "/api/v1/quizzes/1/attempts",
        expect.objectContaining({ method: "POST" }),
      );
      expect(pushMock).toHaveBeenCalledWith("/assess/attempts/99");
    });
  });

  it("renders previous attempts", async () => {
    setupApi([{ id: 5, attempt_number: 1, status: "submitted" }]);

    render(<QuizTakePage />);

    expect(await screen.findByText("Previous Attempts")).toBeInTheDocument();
    expect(screen.getByText("Attempt #1")).toBeInTheDocument();
  });

  it("shows an error when attempt start fails", async () => {
    mockedApiFetch.mockImplementation(async (path: string, options?: RequestInit) => {
      if (path === "/api/v1/quizzes/1") {
        return buildQuiz({
          id: 1,
          title: "Cell Biology Quiz",
          instructions: "Read each question carefully.",
          time_limit_minutes: 30,
          attempts_allowed: 2,
          points_possible: 100,
          status: "published",
        }) as never;
      }
      if (path === "/api/v1/quizzes/1/attempts" && (!options || !options.method)) {
        return [] as never;
      }
      if (path === "/api/v1/quizzes/1/attempts" && options?.method === "POST") {
        throw new Error("Nope");
      }
      return [] as never;
    });

    render(<QuizTakePage />);

    fireEvent.click(await screen.findByRole("button", { name: "Start Attempt" }));

    expect(
      await screen.findByText(/Unable to start attempt\. The quiz may be locked/i),
    ).toBeInTheDocument();
  });
});
