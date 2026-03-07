import { renderHook, waitFor } from "@testing-library/react";
import { type ReactNode } from "react";
import { SWRConfig } from "swr";
import { apiFetch } from "@/lib/api";
import { useSchool } from "@/lib/school-context";
import { buildQueryString, defaultFetcher, useAppSWR } from "@/lib/swr";
import { useSchoolSWR } from "@/lib/useSchoolSWR";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

vi.mock("@/lib/school-context", () => ({
  useSchool: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig>
  );
}

describe("swr utilities", () => {
  const mockedApiFetch = vi.mocked(apiFetch);
  const mockedUseSchool = vi.mocked(useSchool);

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseSchool.mockReturnValue({
      schools: [],
      schoolId: null,
      setSchoolId: vi.fn(),
      loading: false,
    });
  });

  it("builds query strings from optional params", () => {
    expect(
      buildQueryString({ page: 2, per_page: 25, status: "draft", ignored: "", active: true }),
    ).toBe("?page=2&per_page=25&status=draft&active=true");

    expect(buildQueryString({})).toBe("");
  });

  it("defaultFetcher delegates to apiFetch", async () => {
    mockedApiFetch.mockResolvedValueOnce({ ok: true } as never);

    const result = await defaultFetcher<{ ok: boolean }>("/api/v1/ping");

    expect(result).toEqual({ ok: true });
    expect(mockedApiFetch).toHaveBeenCalledWith("/api/v1/ping");
  });

  it("defaultFetcher supports tuple keys", async () => {
    mockedApiFetch.mockResolvedValueOnce({ ok: true } as never);

    const result = await defaultFetcher<{ ok: boolean }>(["/api/v1/ping", "7"]);

    expect(result).toEqual({ ok: true });
    expect(mockedApiFetch).toHaveBeenCalledWith("/api/v1/ping");
  });

  it("useAppSWR fetches data with shared defaults", async () => {
    mockedApiFetch.mockResolvedValueOnce([{ id: 1, title: "Announcement" }] as never);

    const { result } = renderHook(
      () => useAppSWR<Array<{ id: number; title: string }>>(["/api/v1/announcements", "7"]),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.data?.[0].title).toBe("Announcement");
    });

    expect(mockedApiFetch).toHaveBeenCalledWith("/api/v1/announcements");
  });

  it("useSchoolSWR falls back to an unscoped key when no school is selected", async () => {
    mockedApiFetch.mockResolvedValueOnce([{ id: 1, title: "Cells" }] as never);

    const { result } = renderHook(
      () => useSchoolSWR<Array<{ id: number; title: string }>>("/api/v1/unit_plans"),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.data?.[0].title).toBe("Cells");
    });

    expect(mockedApiFetch).toHaveBeenCalledWith("/api/v1/unit_plans");
  });

  it("useSchoolSWR keeps the school id in the cache key when selected", async () => {
    mockedUseSchool.mockReturnValue({
      schools: [{ id: 7, name: "Lincoln High" }],
      schoolId: "7",
      setSchoolId: vi.fn(),
      loading: false,
    });
    mockedApiFetch.mockResolvedValueOnce([{ id: 1, title: "Cells" }] as never);

    const { result } = renderHook(
      () => useSchoolSWR<Array<{ id: number; title: string }>>("/api/v1/unit_plans"),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.data?.[0].title).toBe("Cells");
    });

    expect(mockedApiFetch).toHaveBeenCalledWith("/api/v1/unit_plans");
  });

  it("useSchoolSWR waits for school context resolution before fetching", async () => {
    mockedUseSchool.mockReturnValue({
      schools: [{ id: 7, name: "Lincoln High" }],
      schoolId: null,
      setSchoolId: vi.fn(),
      loading: true,
    });

    renderHook(() => useSchoolSWR<Array<{ id: number; title: string }>>("/api/v1/unit_plans"), {
      wrapper,
    });

    await waitFor(() => {
      expect(mockedApiFetch).not.toHaveBeenCalled();
    });
  });
});
