import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import GlobalSearch from "@/components/GlobalSearch";
import { announce } from "@/components/LiveRegion";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

vi.mock("@/components/LiveRegion", () => ({
  announce: vi.fn(),
  LiveRegion: () => null,
}));

describe("GlobalSearch", () => {
  const mockedApiFetch = vi.mocked(apiFetch);
  const mockedUseRouter = vi.mocked(useRouter);
  const mockedAnnounce = vi.mocked(announce);
  const pushMock = vi.fn();

  beforeEach(() => {
    mockedUseRouter.mockReturnValue({ push: pushMock } as never);
    mockedApiFetch.mockResolvedValue({ results: [] } as never);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  async function performSearch(query: string) {
    fireEvent.change(screen.getByRole("combobox"), { target: { value: query } });
    await waitFor(
      () => {
        expect(mockedApiFetch).toHaveBeenCalled();
      },
      { timeout: 1500 },
    );
  }

  it("does not search when query is shorter than 2 characters", async () => {
    render(<GlobalSearch />);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "c" } });
    await new Promise((resolve) => setTimeout(resolve, 350));

    expect(mockedApiFetch).not.toHaveBeenCalled();
  });

  it("debounces search by 300ms", async () => {
    vi.useFakeTimers();
    render(<GlobalSearch />);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "cell" } });
    await vi.advanceTimersByTimeAsync(299);
    expect(mockedApiFetch).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(mockedApiFetch).toHaveBeenCalledWith("/api/v1/search?q=cell");
  });

  it("renders search results grouped by type", async () => {
    mockedApiFetch.mockResolvedValue({
      results: [
        { type: "unit_plan", id: 1, title: "Unit A", url: "/plan/units/1" },
        { type: "course", id: 2, title: "Course B", url: "/teach/courses/2" },
      ],
    } as never);

    render(<GlobalSearch />);
    await performSearch("cell");

    expect(await screen.findByText("Unit Plans")).toBeInTheDocument();
    expect(screen.getByText("Courses")).toBeInTheDocument();
    expect(screen.getByText("Unit A")).toBeInTheDocument();
    expect(screen.getByText("Course B")).toBeInTheDocument();
  });

  it("renders empty state when no results", async () => {
    mockedApiFetch.mockResolvedValue({ results: [] } as never);

    render(<GlobalSearch />);
    await performSearch("cell");

    expect(screen.getByText("No results")).toBeInTheDocument();
  });

  it("navigates on result click", async () => {
    mockedApiFetch.mockResolvedValue({
      results: [{ type: "unit_plan", id: 1, title: "Unit A", url: "/plan/units/1" }],
    } as never);

    render(<GlobalSearch />);
    await performSearch("unit");

    fireEvent.click(await screen.findByRole("option", { name: /Unit A/i }));

    expect(pushMock).toHaveBeenCalledWith("/plan/units/1");
  });

  it("keyboard ArrowDown/ArrowUp navigates results", async () => {
    mockedApiFetch.mockResolvedValue({
      results: [
        { type: "unit_plan", id: 1, title: "Unit A", url: "/plan/units/1" },
        { type: "unit_plan", id: 2, title: "Unit B", url: "/plan/units/2" },
      ],
    } as never);

    render(<GlobalSearch />);
    await performSearch("unit");

    const input = screen.getByRole("combobox");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    const first = input.getAttribute("aria-activedescendant");
    expect(first).toBeTruthy();

    fireEvent.keyDown(input, { key: "ArrowDown" });
    const second = input.getAttribute("aria-activedescendant");
    expect(second).toBeTruthy();
    expect(second).not.toEqual(first);

    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input.getAttribute("aria-activedescendant")).toEqual(first);
  });

  it("keyboard Enter navigates to active result", async () => {
    mockedApiFetch.mockResolvedValue({
      results: [{ type: "unit_plan", id: 1, title: "Unit A", url: "/plan/units/1" }],
    } as never);

    render(<GlobalSearch />);
    await performSearch("unit");

    const input = screen.getByRole("combobox");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(pushMock).toHaveBeenCalledWith("/plan/units/1");
  });

  it("keyboard Escape clears active descendant", async () => {
    mockedApiFetch.mockResolvedValue({
      results: [{ type: "unit_plan", id: 1, title: "Unit A", url: "/plan/units/1" }],
    } as never);

    render(<GlobalSearch />);
    await performSearch("unit");

    const input = screen.getByRole("combobox");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.getAttribute("aria-activedescendant")).toBeTruthy();

    expect(await screen.findByRole("listbox")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Escape" });

    expect(input.getAttribute("aria-activedescendant")).toBeNull();
  });

  it("announces result count to screen reader", async () => {
    mockedApiFetch.mockResolvedValue({
      results: [
        { type: "unit_plan", id: 1, title: "Unit A", url: "/plan/units/1" },
        { type: "course", id: 2, title: "Course B", url: "/teach/courses/2" },
      ],
    } as never);

    render(<GlobalSearch />);
    await performSearch("unit");

    expect(mockedAnnounce).toHaveBeenCalledWith("2 search results loaded");
  });

  it("has combobox ARIA attributes", () => {
    render(<GlobalSearch />);

    const input = screen.getByRole("combobox");
    expect(input).toHaveAttribute("role", "combobox");
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(input).toHaveAttribute("aria-controls");
    expect(input).toHaveAttribute("aria-autocomplete", "list");
  });
});
