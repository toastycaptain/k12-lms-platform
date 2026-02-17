import { renderHook, waitFor } from "@testing-library/react";
import { type ReactNode } from "react";
import { SWRConfig } from "swr";
import { apiFetch } from "@/lib/api";
import { useCourse, useCourses } from "@/hooks/useCourses";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig>
  );
}

describe("useCourses", () => {
  const mockedApiFetch = vi.mocked(apiFetch);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches paginated courses", async () => {
    mockedApiFetch.mockResolvedValueOnce([
      { id: 1, name: "Biology", code: "BIO-101" },
      { id: 2, name: "Algebra", code: "ALG-201" },
    ] as never);

    const { result } = renderHook(() => useCourses({ page: 2, per_page: 10 }), { wrapper });

    await waitFor(() => {
      expect(result.current.data).toHaveLength(2);
    });

    expect(mockedApiFetch).toHaveBeenCalledWith("/api/v1/courses?page=2&per_page=10");
  });

  it("skips fetching a single course when id is missing", async () => {
    renderHook(() => useCourse(null), { wrapper });

    await waitFor(() => {
      expect(mockedApiFetch).not.toHaveBeenCalled();
    });
  });
});
