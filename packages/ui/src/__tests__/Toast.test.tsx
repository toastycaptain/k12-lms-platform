import { render, screen, fireEvent, act } from "@testing-library/react";
import { ToastProvider, useToast } from "../Toast";

function ToastTrigger({ type = "success" as const, message = "Test message" }) {
  const { addToast } = useToast();
  return <button onClick={() => addToast(type, message)}>Add toast</button>;
}

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders children within ToastProvider", () => {
    render(
      <ToastProvider>
        <div>App content</div>
      </ToastProvider>,
    );
    expect(screen.getByText("App content")).toBeInTheDocument();
  });

  it("throws error when useToast is used outside ToastProvider", () => {
    const originalError = console.error;
    console.error = vi.fn();

    expect(() => {
      render(<ToastTrigger />);
    }).toThrow("useToast must be used within a ToastProvider");

    console.error = originalError;
  });

  it("displays a toast when addToast is called", () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Hello toast" />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Add toast"));
    expect(screen.getByText("Hello toast")).toBeInTheDocument();
  });

  it("renders toast with alert role", () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Add toast"));
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("dismisses toast when dismiss button is clicked", () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Dismissable" />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Add toast"));
    expect(screen.getByText("Dismissable")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Dismiss notification"));
    expect(screen.queryByText("Dismissable")).not.toBeInTheDocument();
  });

  it("auto-dismisses toast after duration", () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Auto dismiss" />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Add toast"));
    expect(screen.getByText("Auto dismiss")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(screen.queryByText("Auto dismiss")).not.toBeInTheDocument();
  });

  it("renders multiple toasts", () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Toast 1" />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Add toast"));
    fireEvent.click(screen.getByText("Add toast"));

    const alerts = screen.getAllByRole("alert");
    expect(alerts.length).toBe(2);
  });
});
