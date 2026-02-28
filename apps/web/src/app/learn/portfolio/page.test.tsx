import { render, screen } from "@testing-library/react";
import LearnPortfolioPage from "@/app/learn/portfolio/page";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => "/learn/portfolio"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock("@/components/AppShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ProtectedRoute", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("Learn Portfolio Page", () => {
  it("renders placeholder content", () => {
    render(<LearnPortfolioPage />);

    expect(screen.getByRole("heading", { name: "My Portfolio" })).toBeInTheDocument();
    expect(screen.getByText("Portfolio is coming soon.")).toBeInTheDocument();

    const addButton = screen.getByRole("button", { name: "Add Portfolio Entry" });
    expect(addButton).toBeDisabled();
  });
});
