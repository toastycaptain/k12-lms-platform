"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { announce } from "@/components/LiveRegion";

interface SearchResult {
  type: string;
  id: number;
  title: string;
  url: string;
}

interface SearchResponse {
  results: SearchResult[];
}

const TYPE_ICONS: Record<string, string> = {
  unit_plan: "📋",
  lesson_plan: "📝",
  course: "📚",
  standard: "📏",
  assignment: "📎",
};

const TYPE_LABELS: Record<string, string> = {
  unit_plan: "Unit Plans",
  lesson_plan: "Lesson Plans",
  course: "Courses",
  standard: "Standards",
  assignment: "Assignments",
};

export default function GlobalSearch() {
  const router = useRouter();
  const listboxId = useId();
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const trimmedQuery = query.trim();

  const groupedResults = useMemo(() => {
    return results.reduce<Record<string, SearchResult[]>>((accumulator, result) => {
      if (!accumulator[result.type]) {
        accumulator[result.type] = [];
      }
      accumulator[result.type].push(result);
      return accumulator;
    }, {});
  }, [results]);

  const flatResults = useMemo(() => {
    return Object.values(groupedResults).flat();
  }, [groupedResults]);

  const fetchResults = useCallback(async () => {
    if (trimmedQuery.length < 2) {
      setResults([]);
      setActiveIndex(-1);
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch<SearchResponse>(
        `/api/v1/search?q=${encodeURIComponent(trimmedQuery)}`,
      );
      const nextResults = response.results || [];
      setResults(nextResults);
      setActiveIndex(-1);
      announce(
        nextResults.length > 0
          ? `${nextResults.length} search results loaded`
          : "No search results found",
      );
    } catch {
      setResults([]);
      setActiveIndex(-1);
    } finally {
      setLoading(false);
    }
  }, [trimmedQuery]);

  useEffect(() => {
    if (trimmedQuery.length < 2) {
      setOpen(false);
      setResults([]);
      setActiveIndex(-1);
      return;
    }

    setOpen(true);
    const timer = setTimeout(() => {
      void fetchResults();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchResults, trimmedQuery]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  function closeWithDelay() {
    blurTimeoutRef.current = setTimeout(() => {
      setOpen(false);
      setActiveIndex(-1);
    }, 140);
  }

  function navigateTo(url: string) {
    setOpen(false);
    setQuery("");
    setResults([]);
    setActiveIndex(-1);
    router.push(url);
  }

  return (
    <div className="relative w-full max-w-xl">
      <input
        ref={inputRef}
        type="text"
        value={query}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => {
          if (trimmedQuery.length >= 2) {
            setOpen(true);
          }
        }}
        onBlur={closeWithDelay}
        onKeyDown={(event) => {
          if (!open || flatResults.length === 0) {
            if (event.key === "Escape") {
              setOpen(false);
              inputRef.current?.focus();
            }
            return;
          }

          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((previous) => (previous + 1) % flatResults.length);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((previous) => (previous <= 0 ? flatResults.length - 1 : previous - 1));
          } else if (event.key === "Enter" && activeIndex >= 0) {
            event.preventDefault();
            navigateTo(flatResults[activeIndex].url);
          } else if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
            setActiveIndex(-1);
            inputRef.current?.focus();
          }
        }}
        placeholder="Search units, lessons, courses, standards, assignments..."
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Search results"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg"
        >
          {loading ? (
            <p className="px-3 py-3 text-sm text-gray-500">Searching...</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-gray-500">No results</p>
          ) : (
            Object.entries(groupedResults).map(([type, typeResults]) => (
              <div key={type} className="border-b border-gray-100 last:border-b-0">
                <p className="bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {TYPE_LABELS[type] || type}
                </p>
                <ul>
                  {typeResults.map((result) => {
                    const globalIndex = flatResults.findIndex(
                      (entry) =>
                        entry.type === result.type &&
                        entry.id === result.id &&
                        entry.url === result.url,
                    );
                    const isActive = globalIndex === activeIndex;
                    return (
                      <li key={`${result.type}-${result.id}-${result.url}`}>
                        <button
                          id={`${listboxId}-option-${globalIndex}`}
                          role="option"
                          aria-selected={isActive}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => navigateTo(result.url)}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                            isActive ? "bg-blue-50 text-blue-800" : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <span>{TYPE_ICONS[result.type] || "•"}</span>
                          <span className="truncate">{result.title}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
