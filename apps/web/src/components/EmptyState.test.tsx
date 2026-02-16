import { render, screen, fireEvent } from "@testing-library/react";
import { EmptyState } from "@/components/EmptyState";

describe("EmptyState", () => {
  it("renders title", () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText("No items found")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<EmptyState title="Empty" description="Create your first item" />);
    expect(screen.getByText("Create your first item")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    const { container } = render(<EmptyState title="Empty" />);
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });

  it("renders action button with onAction callback", () => {
    const onAction = vi.fn();
    render(<EmptyState title="Empty" actionLabel="Create" onAction={onAction} />);
    const button = screen.getByText("Create");
    fireEvent.click(button);
    expect(onAction).toHaveBeenCalledOnce();
  });

  it("renders action link with actionHref", () => {
    render(<EmptyState title="Empty" actionLabel="Go" actionHref="/new" />);
    const link = screen.getByText("Go");
    expect(link.closest("a")).toHaveAttribute("href", "/new");
  });

  it("does not render action when no actionLabel provided", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders custom icon when provided", () => {
    render(<EmptyState title="Empty" icon={<span data-testid="custom-icon">★</span>} />);
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("renders default icon when no custom icon provided", () => {
    const { container } = render(<EmptyState title="Empty" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
