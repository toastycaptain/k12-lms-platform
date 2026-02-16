import { render, screen } from "@testing-library/react";
import { useParams } from "next/navigation";
import QuizBuilderPage from "@/app/assess/quizzes/[quizId]/page";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { buildQuiz } from "@/test/factories";
import { createMockUser } from "@/test/utils";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => "/assess/quizzes/1"),
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

describe("Quiz Management Page", () => {
  const mockedApiFetch = vi.mocked(apiFetch);
  const mockedUseAuth = vi.mocked(useAuth);
  const mockedUseParams = vi.mocked(useParams);

  function setupApi() {
    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === "/api/v1/quizzes/1") {
        return buildQuiz({
          id: 1,
          title: "Quiz 1",
          description: "Quiz description",
          instructions: "Answer all questions",
          time_limit_minutes: 20,
          attempts_allowed: 2,
          points_possible: 25,
          status: "draft",
          quiz_type: "standard",
          shuffle_questions: false,
          shuffle_choices: false,
          show_results: "after_submit",
          due_at: null,
          unlock_at: null,
          lock_at: null,
          course_id: 1,
        }) as never;
      }
      if (path === "/api/v1/quizzes/1/quiz_items") {
        return [
          { id: 1, question_id: 101, position: 1, points: "5" },
          { id: 2, question_id: 102, position: 2, points: "10" },
        ] as never;
      }
      if (path === "/api/v1/question_banks") {
        return [] as never;
      }
      if (path === "/api/v1/quizzes/1/accommodations") {
        return [] as never;
      }
      return [] as never;
    });
  }

  beforeEach(() => {
    mockedUseParams.mockReturnValue({ quizId: "1" } as never);
    mockedUseAuth.mockReturnValue({
      user: createMockUser({ roles: ["teacher"] }),
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

  it("renders quiz details", async () => {
    render(<QuizBuilderPage />);

    expect(await screen.findByRole("heading", { name: "Quiz Builder" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Quiz 1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Quiz description")).toBeInTheDocument();
  });

  it("renders question count", async () => {
    render(<QuizBuilderPage />);

    expect(await screen.findByRole("heading", { name: "Questions (2)" })).toBeInTheDocument();
  });

  it("renders accommodations section", async () => {
    render(<QuizBuilderPage />);

    expect(await screen.findByRole("heading", { name: "Accommodations" })).toBeInTheDocument();
  });

  it("handles loading state", () => {
    mockedApiFetch.mockImplementation(() => new Promise(() => {}) as Promise<never>);

    render(<QuizBuilderPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
