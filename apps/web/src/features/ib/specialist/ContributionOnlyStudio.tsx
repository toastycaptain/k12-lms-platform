export function ContributionOnlyStudio({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Contribution-only mode</h2>
      <p className="mt-1 text-sm text-slate-600">
        Lightweight specialist work without the full owner studio.
      </p>
      <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
        <p className="font-semibold text-slate-950">{title}</p>
        <p className="mt-1">{detail}</p>
      </div>
    </div>
  );
}
