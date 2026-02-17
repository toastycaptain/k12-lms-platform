import { renderHook, waitFor } from "@testing-library/react";
import { type ReactNode } from "react";
import { SWRConfig } from "swr";
import { apiFetch } from "@/lib/api";
import { buildQueryString, defaultFetcher, useAppSWR } from "@/lib/swr";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig>
  );
}

describe("swr utilities", () => {
  const mockedApiFetch = vi.mocked(apiFetch);

  beforeEach(() => {
    vi.clearAllMocks();
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

  it("useAppSWR fetches data with shared defaults", async () => {
    mockedApiFetch.mockResolvedValueOnce([{ id: 1, title: "Announcement" }] as never);

    const { result } = renderHook(
      () => useAppSWR<Array<{ id: number; title: string }>>("/api/v1/announcements"),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.data?.[0].title).toBe("Announcement");
    });

    expect(mockedApiFetch).toHaveBeenCalledWith("/api/v1/announcements");
  });
});
