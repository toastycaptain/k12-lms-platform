import { render, screen } from "@testing-library/react";
import GuardianDashboardPage from "@/app/guardian/dashboard/page";
import { useGuardianStudents } from "@/hooks/useGuardian";

vi.mock("@/hooks/useGuardian", () => ({
  useGuardianStudents: vi.fn(),
}));

describe("GuardianDashboardPage", () => {
  const mockedUseGuardianStudents = vi.mocked(useGuardianStudents);

  it("renders linked students", () => {
    mockedUseGuardianStudents.mockReturnValue({
      data: [
        {
          id: 1,
          first_name: "Lina",
          last_name: "Student",
          email: "lina@example.edu",
          course_count: 2,
          courses: [
            { id: 1, name: "Math", code: "MATH" },
            { id: 2, name: "Science", code: "SCI" },
          ],
        },
      ],
      isLoading: false,
      error: undefined,
    } as never);

    render(<GuardianDashboardPage />);

    expect(screen.getByRole("heading", { name: "My Students" })).toBeInTheDocument();
    expect(screen.getByText("Lina Student")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View student details/i })).toHaveAttribute(
      "href",
      "/guardian/students/1",
    );
  });
});
