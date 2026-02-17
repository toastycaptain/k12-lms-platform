import { render, screen } from "@testing-library/react";
import TextInput from "@/components/forms/TextInput";

describe("TextInput", () => {
  it("renders input attributes", () => {
    render(<TextInput type="email" placeholder="Email" defaultValue="teacher@example.com" />);

    const input = screen.getByPlaceholderText("Email");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveValue("teacher@example.com");
  });

  it("applies error styling when error is true", () => {
    render(<TextInput error placeholder="Field" />);

    expect(screen.getByPlaceholderText("Field")).toHaveClass("border-red-300");
  });
});
