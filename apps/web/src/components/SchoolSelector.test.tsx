import { fireEvent, render, screen } from "@testing-library/react";
import SchoolSelector from "@/components/SchoolSelector";
import { useSchool } from "@/lib/school-context";

vi.mock("@/lib/school-context", () => ({
  useSchool: vi.fn(),
}));

describe("SchoolSelector", () => {
  const mockedUseSchool = vi.mocked(useSchool);
  const setSchoolId = vi.fn();

  beforeEach(() => {
    mockedUseSchool.mockReturnValue({
      schools: [],
      schoolId: null,
      setSchoolId,
      loading: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    mockedUseSchool.mockReturnValue({
      schools: [],
      schoolId: null,
      setSchoolId,
      loading: true,
    });

    render(<SchoolSelector />);

    expect(screen.getByText("Loading school...")).toBeInTheDocument();
  });

  it("renders single school name without dropdown", () => {
    mockedUseSchool.mockReturnValue({
      schools: [{ id: 1, name: "Lincoln High" }],
      schoolId: "1",
      setSchoolId,
      loading: false,
    });

    render(<SchoolSelector />);

    expect(screen.getByText("Lincoln High")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("renders dropdown for multiple schools", () => {
    mockedUseSchool.mockReturnValue({
      schools: [
        { id: 1, name: "Lincoln High" },
        { id: 2, name: "Roosevelt Middle" },
      ],
      schoolId: "1",
      setSchoolId,
      loading: false,
    });

    render(<SchoolSelector />);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Lincoln High" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Roosevelt Middle" })).toBeInTheDocument();
  });

  it("uses the selected school id from context", () => {
    mockedUseSchool.mockReturnValue({
      schools: [
        { id: 1, name: "Lincoln High" },
        { id: 2, name: "Roosevelt Middle" },
      ],
      schoolId: "2",
      setSchoolId,
      loading: false,
    });

    render(<SchoolSelector />);

    expect(screen.getByRole("combobox")).toHaveValue("2");
  });

  it("updates the school selection through context", () => {
    mockedUseSchool.mockReturnValue({
      schools: [
        { id: 1, name: "Lincoln High" },
        { id: 2, name: "Roosevelt Middle" },
      ],
      schoolId: "1",
      setSchoolId,
      loading: false,
    });

    render(<SchoolSelector />);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "2" } });

    expect(setSchoolId).toHaveBeenCalledWith("2");
  });

  it('renders "No school" when no school is selected', () => {
    render(<SchoolSelector />);

    expect(screen.getByText("No school")).toBeInTheDocument();
  });
});
