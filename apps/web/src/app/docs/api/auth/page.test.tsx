import { render, screen } from "@testing-library/react";
import ApiAuthDocsPage from "@/app/docs/api/auth/page";

describe("API auth docs page", () => {
  it("renders auth methods and bearer token example", () => {
    render(<ApiAuthDocsPage />);

    expect(screen.getByRole("heading", { name: "Authentication Guide" })).toBeInTheDocument();
    expect(screen.getByText(/Authorization: Bearer/i)).toBeInTheDocument();
    expect(screen.getByText(/Webhook Signature Verification/i)).toBeInTheDocument();
  });
});
