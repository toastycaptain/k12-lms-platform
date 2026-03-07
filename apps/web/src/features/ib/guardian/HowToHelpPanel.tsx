export function HowToHelpPanel({
  rows,
}: {
  rows: Array<{ id: number; title: string; prompt: string }>;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">How to help at home</h2>
      <div className="mt-4 space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-950">{row.title}</p>
            <p className="mt-1">{row.prompt}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
