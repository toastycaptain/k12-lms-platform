import { render, screen } from "@testing-library/react";
import GuardianAttendancePage from "@/app/guardian/students/[studentId]/attendance/page";
import { useGuardianAttendance } from "@/hooks/useGuardian";

vi.mock("next/navigation", () => ({
  useParams: () => ({ studentId: "7" }),
}));

vi.mock("@/hooks/useGuardian", () => ({
  useGuardianAttendance: vi.fn(),
}));

describe("GuardianAttendancePage", () => {
  const mockedUseGuardianAttendance = vi.mocked(useGuardianAttendance);

  it("renders attendance summary and records", () => {
    mockedUseGuardianAttendance.mockReturnValue({
      data: {
        summary: { total: 2, present: 1, absent: 1, tardy: 0, excused: 0 },
        records: [
          {
            id: 1,
            student_id: 7,
            student_name: "Lina Student",
            section_id: 2,
            section_name: "Section A",
            course_id: 3,
            course_name: "Math 6",
            occurred_on: "2026-02-28",
            status: "present",
            notes: null,
            recorded_by: { id: 4, name: "Taylor Teacher" },
          },
        ],
      },
      isLoading: false,
      error: undefined,
    } as never);

    render(<GuardianAttendancePage />);

    expect(screen.getByRole("heading", { name: "Attendance" })).toBeInTheDocument();
    expect(screen.getByText("Math 6")).toBeInTheDocument();
    expect(screen.getByText("present")).toBeInTheDocument();
  });
});
