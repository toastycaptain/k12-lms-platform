"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { saveIbSavedSearch, useIbSavedSearches } from "@/features/ib/data";
import {
  flattenSearchGroups,
  SearchResultList,
  type IbSearchResultGroup,
  type IbSearchResultRow,
} from "@/features/ib/search/SearchResultList";
import { emitIbEvent } from "@/features/ib/analytics/emitIbEvent";
import { SearchOpsPanel } from "@/features/ib/phase9/Phase9Panels";

interface SearchFacet {
  key: string;
  label: string;
  count: number;
}

interface SearchSupportRow {
  key: string;
  label: string;
  detail: string;
}

interface SearchLens {
  key: string;
  label: string;
  query: string;
  detail: string;
}

interface SearchConcept {
  key: string;
  label: string;
  strength: number;
}

interface SearchPayload {
  results: IbSearchResultRow[];
  grouped_results: IbSearchResultGroup[];
  facets: {
    kind: SearchFacet[];
    programme: SearchFacet[];
    status: SearchFacet[];
    visibility: SearchFacet[];
  };
  suggestions: string[];
  zero_result_help: SearchSupportRow[];
  coordinator_lenses: SearchLens[];
  concept_graph: SearchConcept[];
  query_language: {
    applied_filters: Record<string, string[]>;
    tokens: string[];
  };
  freshness: {
    index_strategy: string;
    backpressure_strategy: string;
  };
  semantic_pipeline: {
    fallback_mode: string;
  };
}

type SearchFilters = Record<string, string[]>;

function normalizeFilters(value: Record<string, unknown> | undefined): SearchFilters {
  if (!value) return {};

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, raw]) => {
        const values = Array.isArray(raw)
          ? raw.map((entry) => String(entry).trim()).filter(Boolean)
          : typeof raw === "string"
            ? raw
                .split(",")
                .map((entry) => entry.trim())
                .filter(Boolean)
            : [];
        return [key, values];
      })
      .filter(([, values]) => values.length > 0),
  );
}

function buildSearchUrl(query: string, filters: SearchFilters) {
  const params = new URLSearchParams({ q: query.trim() });
  Object.entries(filters).forEach(([key, values]) => {
    values.forEach((value) => params.append(`filters[${key}][]`, value));
  });
  return `/api/v1/ib/search?${params.toString()}`;
}

function groupEntries(groups: IbSearchResultGroup[]) {
  return groups.flatMap((group) => group.results.map((result) => ({ group: group.label, result })));
}

export function IbSearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [payload, setPayload] = useState<SearchPayload | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [savingSearch, setSavingSearch] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: savedSearches = [], mutate } = useIbSavedSearches("ib");

  const resultEntries = useMemo(
    () => groupEntries(payload?.grouped_results || []),
    [payload?.grouped_results],
  );
  const selectedResult = resultEntries[activeIndex]?.result || null;

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setPayload(null);
      setActiveIndex(0);
      return;
    }

    const handle = window.setTimeout(async () => {
      const response = await apiFetch<SearchPayload>(buildSearchUrl(query, filters));
      setPayload(response);
      setActiveIndex(0);
      void emitIbEvent({
        eventName: "ib.search.executed",
        eventFamily: "search_and_navigation",
        surface: "search",
        metadata: {
          query: query.trim(),
          result_count: response.results.length,
          filters,
          backpressure_strategy: response.freshness?.backpressure_strategy,
        },
      });
    }, 150);

    return () => window.clearTimeout(handle);
  }, [filters, open, query]);

  useEffect(() => {
    if (activeIndex >= resultEntries.length) {
      setActiveIndex(resultEntries.length > 0 ? 0 : 0);
    }
  }, [activeIndex, resultEntries.length]);

  if (!open) return null;

  const visibleGroups = query.trim().length < 2 ? [] : payload?.grouped_results || [];
  const canSaveCurrentQuery = query.trim().length >= 2;

  async function handleSaveSearch() {
    if (!canSaveCurrentQuery) {
      return;
    }

    setSavingSearch(true);
    try {
      await saveIbSavedSearch({
        name: query.trim().slice(0, 48),
        query: query.trim(),
        lens_key: "quick_search",
        scope_key: "ib",
        filters,
        metadata: { surface: "ib_search", query_tokens: payload?.query_language.tokens || [] },
      });
      await mutate();
      void emitIbEvent({
        eventName: "ib.search.saved",
        eventFamily: "search_and_navigation",
        surface: "search",
        metadata: { query: query.trim(), filters },
      });
    } finally {
      setSavingSearch(false);
    }
  }

  function handleFacetToggle(key: keyof SearchPayload["facets"], value: string) {
    setFilters((current) => {
      const existing = current[key] || [];
      const nextValues = existing.includes(value)
        ? existing.filter((entry) => entry !== value)
        : [value];

      if (nextValues.length === 0) {
        const next = { ...current };
        delete next[key];
        return next;
      }

      return { ...current, [key]: nextValues };
    });
  }

  function handleSavedSearchSelect(search: (typeof savedSearches)[number]) {
    setQuery(search.query || "");
    setFilters(normalizeFilters(search.filters));
  }

  function handleLensSelect(lens: SearchLens) {
    setQuery(lens.query);
  }

  function handleResultOpen(result: IbSearchResultRow) {
    void emitIbEvent({
      eventName: "ib.search.result_opened",
      eventFamily: "search_and_navigation",
      surface: "search",
      metadata: {
        href: result.href,
        kind: result.kind,
        programme: result.programme,
      },
    });
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (resultEntries.length === 0) {
      if (event.key === "Escape") onClose();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % resultEntries.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + resultEntries.length) % resultEntries.length);
      return;
    }

    if (event.key === "Enter" && selectedResult) {
      handleResultOpen(selectedResult);
      window.location.assign(selectedResult.href);
      return;
    }

    if (event.key === "Escape") {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/55 px-4 pt-[8vh]">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">IB search</p>
              <p className="mt-1 text-sm text-slate-500">
                Search documents, evidence, reflections, stories, reports, and coordinator signals.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search across IB work or use filters like kind:report programme:DP"
            className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {savedSearches.slice(0, 6).map((search) => (
                <button
                  key={search.id}
                  type="button"
                  onClick={() => handleSavedSearchSelect(search)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  {search.name}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void handleSaveSearch()}
              disabled={!canSaveCurrentQuery || savingSearch}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-50"
            >
              {savingSearch ? "Saving..." : "Save current search"}
            </button>
          </div>
          {payload?.coordinator_lenses && payload.coordinator_lenses.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {payload.coordinator_lenses.slice(0, 4).map((lens) => (
                <button
                  key={lens.key}
                  type="button"
                  onClick={() => handleLensSelect(lens)}
                  className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                >
                  {lens.label}
                </button>
              ))}
            </div>
          ) : null}
          {payload ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {(["kind", "programme", "status"] as const).flatMap((facetKey) =>
                payload.facets[facetKey].slice(0, 3).map((facet) => {
                  const active = (filters[facetKey] || []).includes(facet.key);
                  return (
                    <button
                      key={`${facetKey}:${facet.key}`}
                      type="button"
                      onClick={() => handleFacetToggle(facetKey, facet.key)}
                      className={[
                        "rounded-full border px-3 py-1 text-xs font-semibold",
                        active
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {facet.label} ({facet.count})
                    </button>
                  );
                }),
              )}
            </div>
          ) : null}
        </div>
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.4fr)_minmax(19rem,0.9fr)]">
          <div className="max-h-[32rem] overflow-y-auto border-b border-slate-200 px-5 py-4 lg:border-b-0 lg:border-r">
            {query.trim().length < 2 && savedSearches.length > 0 ? (
              <div className="mb-4 space-y-2 rounded-[1.5rem] bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-950">Saved lenses</p>
                <div className="space-y-2">
                  {savedSearches.slice(0, 5).map((search) => (
                    <button
                      key={`lens-${search.id}`}
                      type="button"
                      onClick={() => handleSavedSearchSelect(search)}
                      className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <span>
                        <span className="block font-semibold text-slate-950">{search.name}</span>
                        <span className="mt-1 block text-xs text-slate-500">
                          {search.query || "Saved coordinator lens"}
                        </span>
                      </span>
                      <span className="ml-3 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                        {search.shareToken.slice(0, 8)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {query.trim().length < 2 ? <SearchOpsPanel compact /> : null}
            {payload?.suggestions && payload.suggestions.length > 0 ? (
              <div className="mb-4 flex flex-wrap gap-2">
                {payload.suggestions.slice(0, 5).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setQuery(suggestion)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}
            <SearchResultList
              groups={visibleGroups}
              activeHref={selectedResult?.href || null}
              onSelect={(result) => {
                const nextIndex = flattenSearchGroups(visibleGroups).findIndex(
                  (entry) => entry.href === result.href,
                );
                if (nextIndex >= 0) {
                  setActiveIndex(nextIndex);
                }
              }}
              onOpen={handleResultOpen}
              empty={
                query.trim().length >= 2 && payload?.zero_result_help?.length ? (
                  <div className="space-y-3 rounded-[1.5rem] bg-slate-50 px-4 py-5">
                    <p className="text-sm font-semibold text-slate-950">No direct matches</p>
                    {payload.zero_result_help.map((item) => (
                      <div key={item.key} className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                        <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    Type at least two characters to search IB work.
                  </p>
                )
              }
            />
          </div>
          <aside className="space-y-4 px-5 py-4">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Quick preview
              </p>
              {selectedResult ? (
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{selectedResult.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{selectedResult.detail}</p>
                  </div>
                  {selectedResult.preview ? (
                    <p className="text-sm leading-6 text-slate-600">{selectedResult.preview}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {[selectedResult.kind, selectedResult.programme, selectedResult.visibility]
                      .filter(Boolean)
                      .map((chip) => (
                        <span
                          key={chip}
                          className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500"
                        >
                          {chip}
                        </span>
                      ))}
                  </div>
                  {selectedResult.keywords && selectedResult.keywords.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Related concepts
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedResult.keywords.slice(0, 5).map((keyword) => (
                          <span
                            key={`${selectedResult.href}:${keyword}`}
                            className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Use the arrow keys to move through results and preview them before opening.
                </p>
              )}
            </div>

            {payload ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Search operations
                  </p>
                  <dl className="mt-3 space-y-2 text-sm text-slate-600">
                    <div className="flex items-center justify-between gap-3">
                      <dt>Index strategy</dt>
                      <dd className="font-semibold text-slate-900">
                        {payload.freshness.index_strategy}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt>Fallback mode</dt>
                      <dd className="font-semibold text-slate-900">
                        {payload.semantic_pipeline.fallback_mode}
                      </dd>
                    </div>
                  </dl>
                </div>
                {payload.concept_graph.length > 0 ? (
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Concept graph
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {payload.concept_graph.slice(0, 5).map((concept) => (
                        <span
                          key={concept.key}
                          className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600"
                        >
                          {concept.label}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
