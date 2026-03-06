import { act, fireEvent, render, screen } from "@testing-library/react";
import { ReflectionComposer } from "@/features/curriculum/evidence/ReflectionComposer";

describe("ReflectionComposer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows autosave transitions and commits the updated reflection", () => {
    const onCommit = vi.fn();

    render(<ReflectionComposer initialValue="First reflection" onCommit={onCommit} />);

    fireEvent.change(screen.getByRole("textbox", { name: /Student reflection/i }), {
      target: { value: "Updated reflection" },
    });

    expect(screen.getByText("Saving draft")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(onCommit).toHaveBeenCalledWith("Updated reflection");
    expect(screen.getByText("Saved just now")).toBeInTheDocument();
  });
});
