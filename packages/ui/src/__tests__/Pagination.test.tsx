import { render, screen, fireEvent } from "@testing-library/react";
import { Pagination } from "../Pagination";

describe("Pagination", () => {
  it("returns null when totalPages is 1", () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders Previous and Next buttons", () => {
    render(<Pagination currentPage={2} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText("Previous page")).toBeInTheDocument();
    expect(screen.getByLabelText("Next page")).toBeInTheDocument();
  });

  it("disables Previous on first page", () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText("Previous page")).toBeDisabled();
  });

  it("disables Next on last page", () => {
    render(<Pagination currentPage={5} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText("Next page")).toBeDisabled();
  });

  it("calls onPageChange when clicking a page number", () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByLabelText("Page 2"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("marks current page with aria-current", () => {
    render(<Pagination currentPage={2} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText("Page 2")).toHaveAttribute("aria-current", "page");
    expect(screen.getByLabelText("Page 3")).not.toHaveAttribute("aria-current");
  });

  it("calls onPageChange with previous page on Previous click", () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByLabelText("Previous page"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("renders per-page selector when perPage and onPerPageChange provided", () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={vi.fn()}
        perPage={10}
        onPerPageChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Per page:")).toBeInTheDocument();
  });

  it("calls onPerPageChange when selecting a different per-page value", () => {
    const onPerPageChange = vi.fn();
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={vi.fn()}
        perPage={10}
        onPerPageChange={onPerPageChange}
      />,
    );
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "50" } });
    expect(onPerPageChange).toHaveBeenCalledWith(50);
  });

  it("shows ellipsis for large page ranges", () => {
    render(<Pagination currentPage={5} totalPages={10} onPageChange={vi.fn()} />);
    const nav = screen.getByRole("navigation");
    expect(nav.textContent).toContain("...");
  });
});
