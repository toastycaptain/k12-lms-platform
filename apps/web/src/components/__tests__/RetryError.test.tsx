import { fireEvent, render, screen } from "@testing-library/react";
import { RetryError } from "@/components/RetryError";

describe("RetryError", () => {
  it("renders a network-specific message", () => {
    render(<RetryError error={new Error("Failed to fetch")} onRetry={() => undefined} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Connection Error");
    expect(screen.getByText(/Unable to reach the server/i)).toBeInTheDocument();
  });

  it("renders a generic message for non-network errors", () => {
    render(<RetryError error={new Error("Request failed")} onRetry={() => undefined} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Unable to load data");
    expect(screen.getByText("Request failed")).toBeInTheDocument();
  });

  it("triggers retry callback", () => {
    const onRetry = vi.fn();
    render(<RetryError error={new Error("Failed to fetch")} onRetry={onRetry} />);

    fireEvent.click(screen.getByRole("button", { name: "Try Again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("disables button while retrying", () => {
    render(
      <RetryError error={new Error("Failed to fetch")} onRetry={() => undefined} isRetrying />,
    );

    expect(screen.getByRole("button", { name: "Retrying..." })).toBeDisabled();
  });
});
