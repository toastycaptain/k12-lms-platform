import { render, screen } from "@testing-library/react";
import FormField from "@/components/forms/FormField";
import TextInput from "@/components/forms/TextInput";

describe("FormField", () => {
  it("renders label, description, and links aria-describedby to error and description", () => {
    render(
      <FormField
        label="Email"
        htmlFor="email"
        description="Use your school email address."
        error="Email is required."
        required
      >
        <TextInput />
      </FormField>,
    );

    const input = screen.getByLabelText("Email");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("id", "email");
    expect(screen.getByText("Use your school email address.")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Email is required.");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", expect.stringContaining("email-description"));
    expect(input).toHaveAttribute("aria-describedby", expect.stringContaining("email-error"));
  });
});
