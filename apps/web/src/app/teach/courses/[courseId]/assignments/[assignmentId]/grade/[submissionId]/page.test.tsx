import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CourseAssignmentGradingPage from "@/app/teach/courses/[courseId]/assignments/[assignmentId]/grade/[submissionId]/page";
import { apiFetch } from "@/lib/api";
import { useToast } from "@k12/ui";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  usePathname: vi.fn(() => "/teach/courses/1/assignments/201/grade/301"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useParams: vi.fn(() => ({ courseId: "1", assignmentId: "201", submissionId: "301" })),
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
}));

vi.mock("@k12/ui", async () => {
  const actual = await vi.importActual<typeof import("@k12/ui")>("@k12/ui");
  return {
    ...actual,
    useToast: vi.fn(),
  };
});

describe("Assignment Grading Flow", () => {
  const mockedApiFetch = vi.mocked(apiFetch);
  const mockedUseToast = vi.mocked(useToast);
  const addToast = vi.fn();

  beforeEach(() => {
    mockedUseToast.mockReturnValue({ addToast });

    mockedApiFetch.mockImplementation(async (path: string, options?: RequestInit) => {
      if (path === "/api/v1/submissions/301") {
        return {
          id: 301,
          assignment_id: 201,
          user_id: 2,
          submission_type: "online_text",
          body: "Clear explanation of fraction models.",
          url: null,
          status: "submitted",
          grade: null,
          feedback: "",
          submitted_at: "2026-02-16T10:00:00Z",
        } as never;
      }

      if (path === "/api/v1/assignments/201") {
        return {
          id: 201,
          title: "Fractions Exit Ticket",
          rubric_id: 51,
          points_possible: "10",
        } as never;
      }

      if (path === "/api/v1/assignments/201/submissions") {
        return [
          {
            id: 301,
            assignment_id: 201,
            user_id: 2,
            submission_type: "online_text",
            body: "Clear explanation of fraction models.",
            url: null,
            status: "submitted",
            grade: null,
            feedback: "",
            submitted_at: "2026-02-16T10:00:00Z",
          },
        ] as never;
      }

      if (path === "/api/v1/users") {
        return [
          { id: 2, first_name: "Sam", last_name: "Student", roles: ["student"] },
          { id: 10, first_name: "Taylor", last_name: "Teacher", roles: ["teacher"] },
        ] as never;
      }

      if (path === "/api/v1/rubrics/51") {
        return {
          id: 51,
          title: "Fractions Rubric",
          rubric_criteria: [
            {
              id: 500,
              title: "Conceptual Understanding",
              points: "5",
              rubric_ratings: [
                { id: 901, description: "Developing", points: "3" },
                { id: 902, description: "Exceeds", points: "5" },
              ],
            },
          ],
        } as never;
      }

      if (path === "/api/v1/submissions/301/rubric_scores") {
        return [] as never;
      }

      if (path === "/api/v1/submissions/301" && options?.method === "PATCH") {
        return {} as never;
      }

      throw new Error(`Unexpected apiFetch call: ${path}`);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders rubric grading controls and saves grade + feedback", async () => {
    render(<CourseAssignmentGradingPage />);

    expect(await screen.findByText("Fractions Exit Ticket")).toBeInTheDocument();
    expect(screen.getByText("Clear explanation of fraction models.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Exceeds (5)" }));
    fireEvent.change(screen.getByPlaceholderText("Add feedback for this student..."), {
      target: { value: "Strong reasoning and complete work." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Grade" }));

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith(
        "/api/v1/submissions/301",
        expect.objectContaining({ method: "PATCH" }),
      );
    });

    const patchCall = mockedApiFetch.mock.calls.find(([path, options]) => {
      return path === "/api/v1/submissions/301" && options?.method === "PATCH";
    });

    const body = JSON.parse(String(patchCall?.[1]?.body || "{}"));
    expect(body.grade).toBe(5);
    expect(body.feedback).toBe("Strong reasoning and complete work.");
    expect(body.rubric_scores).toEqual([
      {
        criterion_id: 500,
        rating_id: 902,
        score: 5,
        comments: "",
      },
    ]);
    expect(addToast).toHaveBeenCalledWith("success", "Grade saved.");
  });

  it("shows a toast when saving fails", async () => {
    mockedApiFetch.mockImplementation(async (path: string, options?: RequestInit) => {
      if (path === "/api/v1/submissions/301" && options?.method === "PATCH") {
        throw new Error("save failed");
      }

      if (path === "/api/v1/submissions/301") {
        return {
          id: 301,
          assignment_id: 201,
          user_id: 2,
          submission_type: "online_text",
          body: "Body",
          url: null,
          status: "submitted",
          grade: null,
          feedback: "",
          submitted_at: "2026-02-16T10:00:00Z",
        } as never;
      }
      if (path === "/api/v1/assignments/201") {
        return {
          id: 201,
          title: "Fractions Exit Ticket",
          rubric_id: null,
          points_possible: "10",
        } as never;
      }
      if (path === "/api/v1/assignments/201/submissions") {
        return [
          {
            id: 301,
            assignment_id: 201,
            user_id: 2,
            submission_type: "online_text",
            body: "Body",
            url: null,
            status: "submitted",
            grade: null,
            feedback: "",
            submitted_at: "2026-02-16T10:00:00Z",
          },
        ] as never;
      }
      if (path === "/api/v1/users") {
        return [{ id: 2, first_name: "Sam", last_name: "Student", roles: ["student"] }] as never;
      }
      if (path === "/api/v1/rubrics/51") {
        return { id: 51, title: "Unused", rubric_criteria: [] } as never;
      }
      if (path === "/api/v1/submissions/301/rubric_scores") {
        return [] as never;
      }

      throw new Error(`Unexpected apiFetch call: ${path}`);
    });

    render(<CourseAssignmentGradingPage />);

    fireEvent.change(await screen.findByRole("spinbutton"), {
      target: { value: "7" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Grade" }));

    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith("error", "Failed to save grade.");
    });
  });
});
