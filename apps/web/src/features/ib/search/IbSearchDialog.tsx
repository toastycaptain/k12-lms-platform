"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { saveIbSavedSearch, useIbSavedSearches } from "@/features/ib/data";
import { SearchResultList, type IbSearchResultRow } from "@/features/ib/search/SearchResultList";
import { emitIbEvent } from "@/features/ib/analytics/emitIbEvent";
import { SearchOpsPanel } from "@/features/ib/phase9/Phase9Panels";

export function IbSearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IbSearchResultRow[]>([]);
  const [savingSearch, setSavingSearch] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: savedSearches = [], mutate } = useIbSavedSearches("ib");

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      return;
    }

    const handle = window.setTimeout(async () => {
      const response = await apiFetch<{ results: Array<Record<string, unknown>> }>(
        `/api/v1/ib/search?q=${encodeURIComponent(query.trim())}`,
      );
      setResults(
        response.results.map((row) => ({
          title: String(row.title || "IB result"),
          detail: String(row.detail || ""),
          href: String(row.href || "/ib/home"),
          programme: typeof row.programme === "string" ? row.programme : undefined,
          kind: typeof row.kind === "string" ? row.kind : undefined,
        })),
      );
      void emitIbEvent({
        eventName: "ib.search.executed",
        eventFamily: "search_and_navigation",
        surface: "search",
        metadata: { query: query.trim(), result_count: response.results.length },
      });
    }, 150);

    return () => window.clearTimeout(handle);
  }, [open, query]);

  if (!open) return null;

  const visibleResults = query.trim().length < 2 ? [] : results;
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
        metadata: { surface: "ib_search" },
      });
      await mutate();
    } finally {
      setSavingSearch(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/50 px-4 pt-[10vh]">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">IB search</p>
              <p className="mt-1 text-sm text-slate-500">
                Search documents, evidence, stories, milestones, library items, and collections.
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
            placeholder="Search across IB work"
            className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {savedSearches.slice(0, 6).map((search) => (
                <button
                  key={search.id}
                  type="button"
                  onClick={() => setQuery(search.query || "")}
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
        </div>
        <div className="max-h-[28rem] overflow-y-auto px-5 py-4">
          {query.trim().length < 2 && savedSearches.length > 0 ? (
            <div className="mb-4 space-y-2 rounded-[1.5rem] bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">Saved lenses</p>
              <div className="space-y-2">
                {savedSearches.slice(0, 5).map((search) => (
                  <button
                    key={`lens-${search.id}`}
                    type="button"
                    onClick={() => setQuery(search.query || "")}
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
          <SearchResultList
            results={visibleResults}
            empty={
              <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                Type at least two characters to search IB work.
              </p>
            }
          />
        </div>
      </div>
    </div>
  );
}
