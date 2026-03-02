import { render, screen } from "@testing-library/react";
import GuardianCalendarPage from "@/app/guardian/students/[studentId]/calendar/page";
import { useGuardianCalendar } from "@/hooks/useGuardian";

vi.mock("next/navigation", () => ({
  useParams: () => ({ studentId: "7" }),
}));

vi.mock("@/hooks/useGuardian", () => ({
  useGuardianCalendar: vi.fn(),
}));

describe("GuardianCalendarPage", () => {
  const mockedUseGuardianCalendar = vi.mocked(useGuardianCalendar);

  it("renders calendar events", () => {
    mockedUseGuardianCalendar.mockReturnValue({
      data: {
        events: [
          {
            type: "assignment",
            id: 9,
            title: "Fractions Homework",
            course_id: 3,
            due_date: "2026-03-01T13:00:00Z",
            status: "published",
          },
        ],
      },
      isLoading: false,
      error: undefined,
    } as never);

    render(<GuardianCalendarPage />);

    expect(screen.getByRole("heading", { name: "Calendar" })).toBeInTheDocument();
    expect(screen.getByText("Fractions Homework")).toBeInTheDocument();
  });
});
