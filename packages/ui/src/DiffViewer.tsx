interface DiffViewerProps {
  previous: string;
  next: string;
  className?: string;
}

export function DiffViewer({ previous, next, className = "" }: DiffViewerProps) {
  return (
    <div className={`grid gap-3 md:grid-cols-2 ${className}`}>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Current</p>
        <pre className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{previous || "(empty)"}</pre>
      </div>
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Proposed</p>
        <pre className="mt-2 whitespace-pre-wrap text-sm text-emerald-900">{next || "(empty)"}</pre>
      </div>
    </div>
  );
}
