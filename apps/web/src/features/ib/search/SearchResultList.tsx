import type { ReactNode } from "react";

export interface IbSearchResultRow {
  title: string;
  detail: string;
  href: string;
  programme?: string;
  kind?: string;
  preview?: string;
  keywords?: string[];
  status?: string;
  visibility?: string;
  matchedTerms?: string[];
  score?: number;
  redaction?: string | null;
}

export interface IbSearchResultGroup {
  key: string;
  label: string;
  count: number;
  results: IbSearchResultRow[];
}

export function flattenSearchGroups(groups: IbSearchResultGroup[]) {
  return groups.flatMap((group) => group.results);
}

export function SearchResultList({
  groups,
  activeHref,
  onSelect,
  onOpen,
  empty,
}: {
  groups: IbSearchResultGroup[];
  activeHref?: string | null;
  onSelect?: (result: IbSearchResultRow) => void;
  onOpen?: (result: IbSearchResultRow) => void;
  empty?: ReactNode;
}) {
  if (groups.length === 0) {
    return <>{empty || <p className="text-sm text-slate-500">No matching IB results.</p>}</>;
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section key={group.key} className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {group.label}
            </p>
            <span className="text-xs text-slate-400">{group.count}</span>
          </div>
          <div className="space-y-2">
            {group.results.map((result) => {
              const active = activeHref === result.href;
              return (
                <a
                  key={`${result.kind || "result"}:${result.href}`}
                  href={result.href}
                  onMouseEnter={() => onSelect?.(result)}
                  onFocus={() => onSelect?.(result)}
                  onClick={() => onOpen?.(result)}
                  className={[
                    "block rounded-[1.4rem] border px-4 py-3 transition",
                    active
                      ? "border-sky-300 bg-sky-50 shadow-[0_12px_30px_rgba(14,165,233,0.12)]"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-950">{result.title}</p>
                        {result.status ? (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            {result.status.replaceAll("_", " ")}
                          </span>
                        ) : null}
                        {result.redaction ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                            reviewed
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{result.detail}</p>
                      {result.preview ? (
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                          {result.preview}
                        </p>
                      ) : null}
                      {result.matchedTerms && result.matchedTerms.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {result.matchedTerms.slice(0, 3).map((term) => (
                            <span
                              key={`${result.href}:${term}`}
                              className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500"
                            >
                              {term}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="text-right text-[11px] uppercase tracking-[0.18em] text-slate-400">
                      <div>{result.kind || "IB"}</div>
                      {result.programme ? <div className="mt-1">{result.programme}</div> : null}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
