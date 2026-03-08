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
const apiFetchMock = vi.fn<(url: string) => Promise<Record<string, unknown>>>(
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

vi.mock("@/features/ib/phase9/Phase9Panels", () => ({
  SearchOpsPanel: () => <div>Search Ops Panel</div>,
}));

describe("IbSearchDialog", () => {
  beforeEach(() => {
    apiFetchMock.mockResolvedValue({
      grouped_results: [
        {
          key: "operational_record",
          label: "Operational records",
          count: 1,
          results: [
            {
              title: "Extended essay risk",
              detail: "DP milestone",
              preview: "Finish the next draft before the benchmark window closes.",
              href: "/ib/dp/ee/1",
              programme: "DP",
              kind: "operational_record",
              keywords: ["extended essay", "risk"],
              matchedTerms: ["extended", "essay"],
              visibility: "internal",
            },
          ],
        },
      ],
      facets: {
        kind: [{ key: "operational_record", label: "Operational Record", count: 1 }],
        programme: [{ key: "DP", label: "DP", count: 1 }],
        status: [{ key: "watch", label: "Watch", count: 1 }],
        visibility: [{ key: "internal", label: "Internal", count: 1 }],
      },
      suggestions: ["extended essay", "deadline risk"],
      zero_result_help: [],
      coordinator_lenses: [
        {
          key: "dp_deadlines",
          label: "DP deadlines at risk",
          query: "programme:DP kind:operational_record risk",
          detail: "Watch coordinator deadlines.",
        },
      ],
      concept_graph: [{ key: "extended_essay", label: "Extended essay", strength: 3 }],
      query_language: { applied_filters: {}, tokens: ["extended", "essay", "risk"] },
      freshness: { index_strategy: "database_scoped_search_v3", backpressure_strategy: "steady" },
      semantic_pipeline: { fallback_mode: "token_overlap_and_synonyms" },
      results: [
        {
          title: "Extended essay risk",
          detail: "DP milestone",
          preview: "Finish the next draft before the benchmark window closes.",
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

  it("shows saved lenses, executes search, previews grouped results, and saves the current query", async () => {
    render(<IbSearchDialog open onClose={() => undefined} />);

    expect(screen.getByText("Saved lenses")).toBeInTheDocument();
    expect(screen.getByText("Search Ops Panel")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "IA risk lens" })[0]);
    expect(screen.getByDisplayValue("extended essay risk")).toBeInTheDocument();

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalled();
      expect(screen.getAllByText("Extended essay risk")).toHaveLength(2);
      expect(screen.getByText("Operational records")).toBeInTheDocument();
      expect(screen.getByText("Quick preview")).toBeInTheDocument();
      expect(
        screen.getAllByText("Finish the next draft before the benchmark window closes."),
      ).toHaveLength(2);
    });

    fireEvent.click(screen.getByRole("button", { name: "DP deadlines at risk" }));
    expect(
      screen.getByDisplayValue("programme:DP kind:operational_record risk"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save current search" }));

    await waitFor(() => {
      expect(saveIbSavedSearchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          query: "programme:DP kind:operational_record risk",
          lens_key: "quick_search",
        }),
      );
      expect(mutateSavedSearchesMock).toHaveBeenCalled();
    });
  });

  it("applies facet filters and surfaces zero-result help", async () => {
    apiFetchMock
      .mockResolvedValueOnce({
        grouped_results: [
          {
            key: "operational_record",
            label: "Operational records",
            count: 1,
            results: [
              {
                title: "Extended essay risk",
                detail: "DP milestone",
                href: "/ib/dp/ee/1",
                programme: "DP",
                kind: "operational_record",
                preview: "Preview",
                keywords: [],
                matchedTerms: [],
              },
            ],
          },
        ],
        facets: {
          kind: [{ key: "operational_record", label: "Operational Record", count: 1 }],
          programme: [{ key: "DP", label: "DP", count: 1 }],
          status: [{ key: "watch", label: "Watch", count: 1 }],
          visibility: [],
        },
        suggestions: [],
        zero_result_help: [],
        coordinator_lenses: [],
        concept_graph: [],
        query_language: { applied_filters: {}, tokens: [] },
        freshness: { index_strategy: "database_scoped_search_v3", backpressure_strategy: "steady" },
        semantic_pipeline: { fallback_mode: "token_overlap_and_synonyms" },
        results: [
          {
            title: "Extended essay risk",
            detail: "DP milestone",
            href: "/ib/dp/ee/1",
            programme: "DP",
            kind: "operational_record",
          },
        ],
      })
      .mockResolvedValueOnce({
        grouped_results: [],
        facets: { kind: [], programme: [], status: [], visibility: [] },
        suggestions: ["extended essay"],
        zero_result_help: [
          {
            key: "broaden_terms",
            label: "Broaden the query",
            detail: "Try fewer words.",
          },
        ],
        coordinator_lenses: [],
        concept_graph: [],
        query_language: { applied_filters: { kind: ["operational_record"] }, tokens: [] },
        freshness: { index_strategy: "database_scoped_search_v3", backpressure_strategy: "steady" },
        semantic_pipeline: { fallback_mode: "token_overlap_and_synonyms" },
        results: [],
      });

    render(<IbSearchDialog open onClose={() => undefined} />);
    fireEvent.change(screen.getByPlaceholderText(/Search across IB work/i), {
      target: { value: "essay risk" },
    });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Operational Record (1)" })).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Operational Record (1)" }));

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenLastCalledWith(
        expect.stringContaining("filters%5Bkind%5D%5B%5D=operational_record"),
      );
      expect(screen.getByText("Broaden the query")).toBeInTheDocument();
    });
  });
});
