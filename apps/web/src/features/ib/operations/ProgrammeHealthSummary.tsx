export function ProgrammeHealthSummary({ summary }: { summary: Record<string, number> }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Object.entries(summary).map(([key, value]) => (
        <div key={key} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {key.replace(/_/g, " ")}
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
        </div>
      ))}
    </div>
  );
}
