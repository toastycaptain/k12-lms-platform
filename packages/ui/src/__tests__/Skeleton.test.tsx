import { render, screen } from "@testing-library/react";
import { Skeleton } from "../Skeleton";

describe("Skeleton", () => {
  it("renders with default line variant", () => {
    render(<Skeleton />);
    const el = screen.getByRole("status");
    expect(el).toHaveAttribute("aria-label", "Loading");
    expect(el).toHaveClass("animate-pulse");
    expect(el).toHaveClass("rounded");
  });

  it("renders circle variant", () => {
    render(<Skeleton variant="circle" />);
    const el = screen.getByRole("status");
    expect(el).toHaveClass("rounded-full");
  });

  it("renders rectangle variant", () => {
    render(<Skeleton variant="rectangle" />);
    const el = screen.getByRole("status");
    expect(el).toHaveClass("rounded-lg");
  });

  it("applies custom width and height", () => {
    render(<Skeleton width="w-32" height="h-8" />);
    const el = screen.getByRole("status");
    expect(el).toHaveClass("w-32");
    expect(el).toHaveClass("h-8");
  });

  it("applies custom className", () => {
    render(<Skeleton className="mt-4" />);
    const el = screen.getByRole("status");
    expect(el).toHaveClass("mt-4");
  });

  it("contains sr-only loading text", () => {
    render(<Skeleton />);
    expect(screen.getByText("Loading...")).toHaveClass("sr-only");
  });
});
