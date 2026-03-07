export function BottleneckPanel({ stuckReasons }: { stuckReasons: Record<string, number> }) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Bottlenecks and SLA risk</h2>
      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        {Object.entries(stuckReasons).map(([key, value]) => (
          <div key={key} className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-950">{key.replace(/_/g, " ")}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
