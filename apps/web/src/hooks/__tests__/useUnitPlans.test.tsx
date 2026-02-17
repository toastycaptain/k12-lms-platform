import { renderHook, waitFor } from "@testing-library/react";
import { type ReactNode } from "react";
import { SWRConfig } from "swr";
import { apiFetch } from "@/lib/api";
import { useUnitPlan, useUnitPlans, useUnitPlanVersions } from "@/hooks/useUnitPlans";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig>
  );
}

describe("useUnitPlans", () => {
  const mockedApiFetch = vi.mocked(apiFetch);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches unit plans with filters", async () => {
    mockedApiFetch.mockResolvedValueOnce([
      { id: 10, title: "Cells", status: "draft", course_id: 1, current_version_id: 101 },
    ] as never);

    const { result } = renderHook(
      () => useUnitPlans({ page: 1, per_page: 20, status: "draft", course_id: 1 }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.data?.[0].title).toBe("Cells");
    });

    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/api/v1/unit_plans?page=1&per_page=20&status=draft&course_id=1",
    );
  });

  it("fetches a single unit plan when id is provided", async () => {
    mockedApiFetch.mockResolvedValueOnce({
      id: 10,
      title: "Cells",
      status: "draft",
      course_id: 1,
      current_version_id: 101,
    } as never);

    const { result } = renderHook(() => useUnitPlan(10), { wrapper });

    await waitFor(() => {
      expect(result.current.data?.id).toBe(10);
    });

    expect(mockedApiFetch).toHaveBeenCalledWith("/api/v1/unit_plans/10");
  });

  it("fetches unit versions", async () => {
    mockedApiFetch.mockResolvedValueOnce([
      { id: 101, version_number: 1, title: "Cells v1" },
      { id: 102, version_number: 2, title: "Cells v2" },
    ] as never);

    const { result } = renderHook(() => useUnitPlanVersions(10), { wrapper });

    await waitFor(() => {
      expect(result.current.data).toHaveLength(2);
    });

    expect(mockedApiFetch).toHaveBeenCalledWith("/api/v1/unit_plans/10/versions");
  });
});
