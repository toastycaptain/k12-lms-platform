import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { IbSearchDialog } from "@/features/ib/search/IbSearchDialog";

const savedSearches = [
  {
    id: 1,
    name: "IA risk lens",
    query: "extended essay risk",
    lensKey: "coordinator_lens",
    scopeKey: "ib",
    shareToken: "abc12345token",
    filters: {},
    metadata: {},
    lastRunAt: "2026-03-05T12:00:00Z",
    updatedAt: "2026-03-05T12:00:00Z",
  },
];

const saveIbSavedSearchMock = vi.fn(async (payload: Record<string, unknown>) => {
  void payload;
  return {};
});
const mutateSavedSearchesMock = vi.fn(async () => undefined);
const apiFetchMock = vi.fn<(url: string) => Promise<{ results: Array<Record<string, string>> }>>(
  async (url: string) => {
    void url;
    return { results: [] };
  },
);

vi.mock("@/features/ib/data", () => ({
  useIbSavedSearches: () => ({
    data: savedSearches,
    mutate: mutateSavedSearchesMock,
  }),
  saveIbSavedSearch: (payload: Record<string, unknown>) => saveIbSavedSearchMock(payload),
}));

vi.mock("@/lib/api", () => ({
  apiFetch: (url: string) => apiFetchMock(url),
}));

vi.mock("@/features/ib/analytics/emitIbEvent", () => ({
  emitIbEvent: vi.fn(async () => undefined),
}));

describe("IbSearchDialog", () => {
  beforeEach(() => {
    apiFetchMock.mockResolvedValue({
      results: [
        {
          title: "Extended essay risk",
          detail: "DP milestone",
          href: "/ib/dp/ee/1",
          programme: "DP",
          kind: "operational_record",
        },
      ],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows saved lenses, executes search, and saves the current query", async () => {
    render(<IbSearchDialog open onClose={() => undefined} />);

    expect(screen.getByText("Saved lenses")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "IA risk lens" })[0]);
    expect(screen.getByDisplayValue("extended essay risk")).toBeInTheDocument();

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalled();
      expect(screen.getByText("Extended essay risk")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Save current search" }));

    await waitFor(() => {
      expect(saveIbSavedSearchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          query: "extended essay risk",
          lens_key: "quick_search",
        }),
      );
      expect(mutateSavedSearchesMock).toHaveBeenCalled();
    });
  });
});
