import type { ReactNode } from "react";

export interface IbSearchResultRow {
  title: string;
  detail: string;
  href: string;
  programme?: string;
  kind?: string;
}

export function SearchResultList({
  results,
  empty,
}: {
  results: IbSearchResultRow[];
  empty?: ReactNode;
}) {
  if (results.length === 0) {
    return <>{empty || <p className="text-sm text-slate-500">No matching IB results.</p>}</>;
  }

  return (
    <div className="space-y-2">
      {results.map((result) => (
        <a
          key={`${result.kind || "result"}:${result.href}`}
          href={result.href}
          className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">{result.title}</p>
              <p className="mt-1 text-sm text-slate-600">{result.detail}</p>
            </div>
            <div className="text-right text-[11px] uppercase tracking-[0.18em] text-slate-400">
              <div>{result.kind || "IB"}</div>
              {result.programme ? <div className="mt-1">{result.programme}</div> : null}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
