import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SchoolSelector from "@/components/SchoolSelector";
import { apiFetch } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

describe("SchoolSelector", () => {
  const mockedApiFetch = vi.mocked(apiFetch);
  const store: Record<string, string> = {};

  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: vi.fn((key: string) => store[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
          store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete store[key];
        }),
        clear: vi.fn(() => {
          Object.keys(store).forEach((key) => delete store[key]);
        }),
      },
    });
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    mockedApiFetch.mockImplementation(() => new Promise(() => {}) as Promise<never>);

    render(<SchoolSelector />);

    expect(screen.getByText("Loading school...")).toBeInTheDocument();
  });

  it("renders single school name without dropdown", async () => {
    mockedApiFetch.mockResolvedValue([{ id: 1, name: "Lincoln High" }] as never);

    render(<SchoolSelector />);

    expect(await screen.findByText("Lincoln High")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("renders dropdown for multiple schools", async () => {
    mockedApiFetch.mockResolvedValue([
      { id: 1, name: "Lincoln High" },
      { id: 2, name: "Roosevelt Middle" },
    ] as never);

    render(<SchoolSelector />);

    expect(await screen.findByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Lincoln High" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Roosevelt Middle" })).toBeInTheDocument();
  });

  it("selects school from localStorage if valid", async () => {
    window.localStorage.setItem("k12.selectedSchoolId", "2");
    mockedApiFetch.mockResolvedValue([
      { id: 1, name: "Lincoln High" },
      { id: 2, name: "Roosevelt Middle" },
    ] as never);

    render(<SchoolSelector />);

    const select = await screen.findByRole("combobox");
    expect(select).toHaveValue("2");
  });

  it("defaults to first school when localStorage value is invalid", async () => {
    window.localStorage.setItem("k12.selectedSchoolId", "999");
    mockedApiFetch.mockResolvedValue([
      { id: 1, name: "Lincoln High" },
      { id: 2, name: "Roosevelt Middle" },
    ] as never);

    render(<SchoolSelector />);

    const select = await screen.findByRole("combobox");
    expect(select).toHaveValue("1");
  });

  it("persists selection to localStorage on change", async () => {
    mockedApiFetch.mockResolvedValue([
      { id: 1, name: "Lincoln High" },
      { id: 2, name: "Roosevelt Middle" },
    ] as never);

    render(<SchoolSelector />);

    const select = await screen.findByRole("combobox");
    fireEvent.change(select, { target: { value: "2" } });

    expect(window.localStorage.setItem).toHaveBeenCalledWith("k12.selectedSchoolId", "2");
  });

  it('renders "No school" when API returns empty array', async () => {
    mockedApiFetch.mockResolvedValue([] as never);

    render(<SchoolSelector />);

    expect(await screen.findByText("No school")).toBeInTheDocument();
  });

  it("handles API error gracefully", async () => {
    mockedApiFetch.mockRejectedValue(new Error("boom"));

    render(<SchoolSelector />);

    await waitFor(() => {
      expect(screen.getByText("No school")).toBeInTheDocument();
    });
  });
});
