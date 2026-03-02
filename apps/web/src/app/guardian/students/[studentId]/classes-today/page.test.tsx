import { render, screen } from "@testing-library/react";
import GuardianClassesTodayPage from "@/app/guardian/students/[studentId]/classes-today/page";
import { useGuardianClassesToday } from "@/hooks/useGuardian";

vi.mock("next/navigation", () => ({
  useParams: () => ({ studentId: "7" }),
}));

vi.mock("@/hooks/useGuardian", () => ({
  useGuardianClassesToday: vi.fn(),
}));

describe("GuardianClassesTodayPage", () => {
  const mockedUseGuardianClassesToday = vi.mocked(useGuardianClassesToday);

  it("renders class rows", () => {
    mockedUseGuardianClassesToday.mockReturnValue({
      data: [
        {
          student_id: 7,
          student_name: "Lina Student",
          section_id: 2,
          section_name: "Section A",
          course_id: 3,
          course_name: "Math 6",
          weekday: 6,
          start_at: "2026-02-28T09:00:00-05:00",
          end_at: "2026-02-28T10:00:00-05:00",
          location: "Room 204",
          teachers: [{ id: 4, name: "Taylor Teacher" }],
        },
      ],
      isLoading: false,
      error: undefined,
    } as never);

    render(<GuardianClassesTodayPage />);

    expect(screen.getByRole("heading", { name: "Classes Today" })).toBeInTheDocument();
    expect(screen.getByText("Math 6")).toBeInTheDocument();
    expect(screen.getByText(/Taylor Teacher/)).toBeInTheDocument();
  });
});
