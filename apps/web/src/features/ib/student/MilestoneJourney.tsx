export function MilestoneJourney({
  rows,
}: {
  rows: Array<{
    id: number;
    title: string;
    programme: string;
    nextAction?: string | null;
    href: string;
    checkpoints: Array<{ id: number; title: string; status: string }>;
  }>;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Milestone journey</h2>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <a
            key={row.id}
            href={row.href}
            className="block rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700 hover:bg-slate-100"
          >
            <p className="font-semibold text-slate-950">{row.title}</p>
            <p className="mt-1">
              {row.programme} • {row.nextAction || "Review the next checkpoint."}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {row.checkpoints
                .map((checkpoint) => `${checkpoint.title} (${checkpoint.status})`)
                .join(" • ")}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
