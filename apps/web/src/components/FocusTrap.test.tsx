import { fireEvent, render, screen } from "@testing-library/react";
import { FocusTrap } from "@/components/FocusTrap";

describe("FocusTrap", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  function renderTrap(active = true, onEscape?: () => void) {
    return render(
      <FocusTrap active={active} onEscape={onEscape}>
        <button type="button">First</button>
        <button type="button">Second</button>
      </FocusTrap>,
    );
  }

  it("focuses first focusable element when active", () => {
    renderTrap(true);

    expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
  });

  it("does not focus when inactive", () => {
    renderTrap(false);

    expect(screen.getByRole("button", { name: "First" })).not.toHaveFocus();
  });

  it("wraps Tab focus from last to first", () => {
    const { container } = renderTrap(true);
    const first = screen.getByRole("button", { name: "First" });
    const second = screen.getByRole("button", { name: "Second" });

    second.focus();
    fireEvent.keyDown(container.firstChild as Element, { key: "Tab" });

    expect(first).toHaveFocus();
  });

  it("wraps Shift+Tab focus from first to last", () => {
    const { container } = renderTrap(true);
    const first = screen.getByRole("button", { name: "First" });
    const second = screen.getByRole("button", { name: "Second" });

    first.focus();
    fireEvent.keyDown(container.firstChild as Element, { key: "Tab", shiftKey: true });

    expect(second).toHaveFocus();
  });

  it("calls onEscape when Escape is pressed", () => {
    const onEscape = vi.fn();
    const { container } = renderTrap(true, onEscape);

    fireEvent.keyDown(container.firstChild as Element, { key: "Escape" });

    expect(onEscape).toHaveBeenCalled();
  });

  it("does not trap when deactivated", () => {
    const { container } = renderTrap(false);
    const first = screen.getByRole("button", { name: "First" });
    const second = screen.getByRole("button", { name: "Second" });

    second.focus();
    fireEvent.keyDown(container.firstChild as Element, { key: "Tab" });

    expect(second).toHaveFocus();
    expect(first).not.toHaveFocus();
  });
});
