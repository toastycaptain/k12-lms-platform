import { render, screen } from "@testing-library/react";
import ApiDocsPage from "@/app/docs/api/page";

vi.mock("@/app/docs/api/reference-client", () => ({
  default: () => <div>Swagger UI Mock</div>,
}));

describe("API docs page", () => {
  it("renders interactive API reference with swagger container", () => {
    render(<ApiDocsPage />);

    expect(screen.getByRole("heading", { name: "Interactive API Reference" })).toBeInTheDocument();
    expect(screen.getByText("Swagger UI Mock")).toBeInTheDocument();
  });
});
