import { render, screen } from "@testing-library/react";
import NotFoundPage from "@/app/not-found";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("Not Found Page", () => {
  it("renders custom 404 content", () => {
    render(<NotFoundPage />);

    expect(screen.getByText("Page not found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });
});
