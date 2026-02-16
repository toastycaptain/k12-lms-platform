import { act, render } from "@testing-library/react";
import { LiveRegion, announce } from "@/components/LiveRegion";

describe("LiveRegion", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders with aria-live="polite" and aria-atomic="true"', () => {
    const { container } = render(<LiveRegion />);

    const region = container.querySelector('[aria-live="polite"]') as HTMLElement;
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute("aria-atomic", "true");
  });

  it("displays message when sr-announce event is dispatched", () => {
    const { container } = render(<LiveRegion />);

    act(() => {
      window.dispatchEvent(new CustomEvent("sr-announce", { detail: "hello" }));
    });

    expect(container).toHaveTextContent("hello");
  });

  it("clears message after timeout", async () => {
    const { container } = render(<LiveRegion />);

    act(() => {
      window.dispatchEvent(new CustomEvent("sr-announce", { detail: "hello" }));
    });
    expect(container).toHaveTextContent("hello");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(container).not.toHaveTextContent("hello");
  });

  it("replaces previous message on rapid dispatch", () => {
    const { container } = render(<LiveRegion />);

    act(() => {
      window.dispatchEvent(new CustomEvent("sr-announce", { detail: "first" }));
      window.dispatchEvent(new CustomEvent("sr-announce", { detail: "second" }));
    });

    expect(container).not.toHaveTextContent("first");
    expect(container).toHaveTextContent("second");
  });

  it("announce() helper dispatches the event", () => {
    const { container } = render(<LiveRegion />);

    act(() => {
      announce("hello");
    });

    expect(container).toHaveTextContent("hello");
  });
});
