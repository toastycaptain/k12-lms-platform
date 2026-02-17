import { render, screen } from "@testing-library/react";
import Select from "@/components/forms/Select";

describe("Select", () => {
  it("renders options and selected value", () => {
    render(
      <Select defaultValue="teacher">
        <option value="">Pick one</option>
        <option value="teacher">Teacher</option>
        <option value="student">Student</option>
      </Select>,
    );

    const select = screen.getByRole("combobox");
    expect(select).toHaveValue("teacher");
    expect(screen.getByRole("option", { name: "Teacher" })).toBeInTheDocument();
  });

  it("applies error styling when error is true", () => {
    render(
      <Select error defaultValue="">
        <option value="">Pick one</option>
      </Select>,
    );

    expect(screen.getByRole("combobox")).toHaveClass("border-red-300");
  });
});
