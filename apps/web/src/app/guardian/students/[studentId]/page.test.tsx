import { render, screen } from "@testing-library/react";
import GuardianStudentDetailPage from "@/app/guardian/students/[studentId]/page";
import {
  useGuardianAttendance,
  useGuardianAnnouncements,
  useGuardianAssignments,
  useGuardianCalendar,
  useGuardianClassesToday,
  useGuardianGrades,
} from "@/hooks/useGuardian";

vi.mock("next/navigation", () => ({
  useParams: () => ({ studentId: "7" }),
}));

vi.mock("@/hooks/useGuardian", () => ({
  useGuardianAttendance: vi.fn(),
  useGuardianGrades: vi.fn(),
  useGuardianAssignments: vi.fn(),
  useGuardianAnnouncements: vi.fn(),
  useGuardianClassesToday: vi.fn(),
  useGuardianCalendar: vi.fn(),
}));

describe("GuardianStudentDetailPage", () => {
  const mockedUseGuardianAttendance = vi.mocked(useGuardianAttendance);
  const mockedUseGuardianGrades = vi.mocked(useGuardianGrades);
  const mockedUseGuardianAssignments = vi.mocked(useGuardianAssignments);
  const mockedUseGuardianAnnouncements = vi.mocked(useGuardianAnnouncements);
  const mockedUseGuardianClassesToday = vi.mocked(useGuardianClassesToday);
  const mockedUseGuardianCalendar = vi.mocked(useGuardianCalendar);

  it("renders student overview content", () => {
    mockedUseGuardianGrades.mockReturnValue({
      data: [
        {
          id: 11,
          assignment_id: 2,
          assignment_title: "Fractions Quiz",
          course_id: 3,
          course_name: "Math 6",
          score: 18,
          points_possible: 20,
          percentage: 90,
          graded_at: "2026-02-24T12:00:00Z",
          status: "graded",
        },
      ],
      isLoading: false,
      error: undefined,
    } as never);

    mockedUseGuardianAssignments.mockReturnValue({
      data: [
        {
          id: 20,
          title: "Homework",
          description: null,
          due_at: new Date(Date.now() + 86_400_000).toISOString(),
          course_id: 3,
          course_name: "Math 6",
          status: "submitted",
          submitted_at: null,
          grade: null,
          points_possible: 10,
        },
      ],
      isLoading: false,
      error: undefined,
    } as never);

    mockedUseGuardianAnnouncements.mockReturnValue({
      data: [
        {
          id: 31,
          title: "Quiz Reminder",
          message: "Bring pencils",
          created_at: "2026-02-24T09:00:00Z",
          course_id: 3,
        },
      ],
      isLoading: false,
      error: undefined,
    } as never);

    mockedUseGuardianAttendance.mockReturnValue({
      data: {
        summary: { total: 4, present: 3, absent: 1, tardy: 0, excused: 0 },
        records: [],
      },
      isLoading: false,
      error: undefined,
    } as never);

    mockedUseGuardianClassesToday.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined,
    } as never);

    mockedUseGuardianCalendar.mockReturnValue({
      data: {
        events: [],
      },
      isLoading: false,
      error: undefined,
    } as never);

    render(<GuardianStudentDetailPage />);

    expect(screen.getByRole("heading", { name: "Student Overview" })).toBeInTheDocument();
    expect(screen.getByText("Fractions Quiz")).toBeInTheDocument();
    expect(screen.getByText("Homework")).toBeInTheDocument();
    expect(screen.getByText("Quiz Reminder")).toBeInTheDocument();
  });
});
