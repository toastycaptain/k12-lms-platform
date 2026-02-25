import { render, screen } from "@testing-library/react";
import ApiWebhookDocsPage from "@/app/docs/api/webhooks/page";

describe("API webhook docs page", () => {
  it("renders event catalog and signature guidance", () => {
    render(<ApiWebhookDocsPage />);

    expect(screen.getByRole("heading", { name: "Webhook Integration Guide" })).toBeInTheDocument();
    expect(screen.getByText("assignment.created")).toBeInTheDocument();
    expect(screen.getByText(/Signature Verification/i)).toBeInTheDocument();
  });
});
