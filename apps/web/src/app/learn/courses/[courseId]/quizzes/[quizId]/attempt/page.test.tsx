import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LearnQuizAttemptPage from "@/app/learn/courses/[courseId]/quizzes/[quizId]/attempt/page";
import { apiFetch, ApiError } from "@/lib/api";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => "/learn/courses/1/quizzes/5/attempt"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useParams: vi.fn(() => ({ courseId: "1", quizId: "5" })),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/AppShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ProtectedRoute", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message);
      this.name = "ApiError";
    }
  },
}));

describe("Learn Quiz Attempt Flow", () => {
  const mockedApiFetch = vi.mocked(apiFetch);

  beforeEach(() => {
    vi.spyOn(window, "confirm").mockReturnValue(true);

    mockedApiFetch.mockImplementation(async (path: string, options?: RequestInit) => {
      if (path === "/api/v1/quizzes/5") {
        return {
          id: 5,
          title: "Fractions Quiz",
          description: "Mastering equivalent fractions",
          instructions: "Choose the best answer.",
          points_possible: 10,
          time_limit_minutes: 30,
          attempts_allowed: 2,
          show_results: "after_submit",
          status: "published",
          due_at: null,
        } as never;
      }

      if (path === "/api/v1/quizzes/5/attempts" && (!options || !options.method)) {
        return [] as never;
      }

      if (path === "/api/v1/quizzes/5/accommodations") {
        return [
          {
            id: 1,
            quiz_id: 5,
            user_id: 9,
            extra_time_minutes: 15,
            extra_attempts: 1,
          },
        ] as never;
      }

      if (path === "/api/v1/quizzes/5/attempts" && options?.method === "POST") {
        return {
          id: 99,
          quiz_id: 5,
          attempt_number: 1,
          status: "in_progress",
          score: null,
          percentage: null,
          started_at: new Date().toISOString(),
          submitted_at: null,
          effective_time_limit: 45,
          created_at: new Date().toISOString(),
        } as never;
      }

      if (path === "/api/v1/quizzes/5/quiz_items") {
        return [{ id: 1, question_id: 88, position: 1, points: "5" }] as never;
      }

      if (path === "/api/v1/quiz_attempts/99/answers" && (!options || !options.method)) {
        return [] as never;
      }

      if (path === "/api/v1/questions/88") {
        return {
          id: 88,
          question_type: "multiple_choice",
          prompt: "Which fraction equals one half?",
          choices: [
            { key: "a", text: "2/4" },
            { key: "b", text: "3/5" },
          ],
        } as never;
      }

      if (path === "/api/v1/quiz_attempts/99/answers" && options?.method === "POST") {
        return {} as never;
      }

      if (path === "/api/v1/quiz_attempts/99/submit" && options?.method === "POST") {
        return {
          id: 99,
          quiz_id: 5,
          attempt_number: 1,
          status: "submitted",
          score: 8,
          percentage: 80,
          started_at: new Date().toISOString(),
          submitted_at: new Date().toISOString(),
          effective_time_limit: 45,
          created_at: new Date().toISOString(),
        } as never;
      }

      throw new Error(`Unexpected apiFetch call: ${path}`);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders accommodations, starts an attempt, and submits to results", async () => {
    render(<LearnQuizAttemptPage />);

    expect(await screen.findByText("Fractions Quiz")).toBeInTheDocument();
    expect(
      screen.getByText(/Accommodation applied: \+15 minutes, \+1 attempts\./i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Start Quiz" }));

    expect(await screen.findByText("Attempt #1")).toBeInTheDocument();
    expect(screen.getByText(/\d{2}:\d{2}/)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("2/4"));
    fireEvent.click(screen.getByRole("button", { name: "Submit Quiz" }));

    expect(await screen.findByText("Attempt Submitted")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Results" })).toHaveAttribute(
      "href",
      "/learn/courses/1/quizzes/5/results/99",
    );

    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/api/v1/quiz_attempts/99/submit",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("shows API error messages when attempt start is rejected", async () => {
    mockedApiFetch.mockImplementation(async (path: string, options?: RequestInit) => {
      if (path === "/api/v1/quizzes/5") {
        return {
          id: 5,
          title: "Fractions Quiz",
          description: null,
          instructions: null,
          points_possible: 10,
          time_limit_minutes: 30,
          attempts_allowed: 1,
          show_results: "after_submit",
          status: "published",
          due_at: null,
        } as never;
      }
      if (path === "/api/v1/quizzes/5/attempts" && (!options || !options.method)) {
        return [] as never;
      }
      if (path === "/api/v1/quizzes/5/accommodations") {
        return [] as never;
      }
      if (path === "/api/v1/quizzes/5/attempts" && options?.method === "POST") {
        throw new ApiError(422, "Attempt limit reached");
      }
      throw new Error(`Unexpected apiFetch call: ${path}`);
    });

    render(<LearnQuizAttemptPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Start Quiz" }));

    await waitFor(() => {
      expect(screen.getByText("Attempt limit reached")).toBeInTheDocument();
    });
  });
});
