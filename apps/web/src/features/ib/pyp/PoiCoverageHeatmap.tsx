export function PoiCoverageHeatmap({ rows }: { rows: Record<string, Record<string, number>> }) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">POI coverage heatmap</h2>
      <div className="mt-4 space-y-3 text-sm text-slate-700">
        {Object.entries(rows).map(([year, themes]) => (
          <div key={year} className="rounded-2xl bg-slate-50 px-4 py-4">
            <p className="font-semibold text-slate-950">{year}</p>
            <p className="mt-2">
              {Object.entries(themes)
                .map(([theme, count]) => `${theme}: ${count}`)
                .join(" • ")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
