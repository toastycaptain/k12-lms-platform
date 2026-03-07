export function StudentGoalsPanel({
  goals,
}: {
  goals: Array<{
    id: number;
    title: string;
    description?: string | null;
    progressPercent?: number | null;
    status: string;
  }>;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Goals</h2>
      <div className="mt-4 space-y-2">
        {goals.map((goal) => (
          <div key={goal.id} className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-950">{goal.title}</p>
                {goal.description ? <p className="mt-1">{goal.description}</p> : null}
              </div>
              <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                {goal.progressPercent ?? 0}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
