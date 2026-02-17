import { render, screen } from "@testing-library/react";
import DistrictDashboardPage from "@/app/district/dashboard/page";
import { apiFetch } from "@/lib/api";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

describe("DistrictDashboardPage", () => {
  const mockedApiFetch = vi.mocked(apiFetch);

  beforeEach(() => {
    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === "/api/v1/district/user_summary") {
        return [
          {
            tenant_id: 1,
            school: "North High",
            teachers: 12,
            students: 320,
            admins: 3,
            district_admins: 1,
          },
          {
            tenant_id: 2,
            school: "South High",
            teachers: 10,
            students: 280,
            admins: 2,
            district_admins: 0,
          },
        ] as never;
      }
      if (path === "/api/v1/district/standards_coverage") {
        return [
          {
            tenant_id: 1,
            school: "North High",
            frameworks_count: 2,
            standards_count: 50,
            covered_standards: 40,
            coverage_pct: 80.0,
          },
          {
            tenant_id: 2,
            school: "South High",
            frameworks_count: 2,
            standards_count: 50,
            covered_standards: 30,
            coverage_pct: 60.0,
          },
        ] as never;
      }
      throw new Error(`Unexpected API call: ${path}`);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders district dashboard metrics and school cards", async () => {
    render(<DistrictDashboardPage />);

    expect(await screen.findByRole("heading", { name: "District Dashboard" })).toBeInTheDocument();
    expect(screen.getByText("Schools")).toBeInTheDocument();
    expect(screen.getAllByText("Teachers").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Students").length).toBeGreaterThan(0);
    expect(screen.getByText("Avg Standards Coverage")).toBeInTheDocument();
    expect(screen.getByText("North High")).toBeInTheDocument();
    expect(screen.getByText("South High")).toBeInTheDocument();
  });

  it("renders an error message when district data fails to load", async () => {
    mockedApiFetch.mockRejectedValue(new Error("boom"));

    render(<DistrictDashboardPage />);

    expect(await screen.findByText("Unable to load district dashboard.")).toBeInTheDocument();
  });
});
