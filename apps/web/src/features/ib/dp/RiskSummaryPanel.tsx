export function RiskSummaryPanel({
  rows,
}: {
  rows: Array<{ id: number; title: string; riskScore: number; factors: string[]; href: string }>;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">DP risk summary</h2>
      <div className="mt-4 space-y-2">
        {rows.map((row) => (
          <a
            key={row.id}
            href={row.href}
            className="block rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700 hover:bg-slate-100"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-950">{row.title}</p>
                <p className="mt-1">{row.factors.join(" • ") || "No visible risk factors."}</p>
              </div>
              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-900">
                {row.riskScore}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
