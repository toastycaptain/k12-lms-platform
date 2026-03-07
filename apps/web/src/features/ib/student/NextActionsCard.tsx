export function NextActionsCard({
  actions,
}: {
  actions: Array<{ id: string; title: string; detail: string; href: string; tone?: string }>;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Next actions</h2>
      <div className="mt-4 space-y-2">
        {actions.map((action) => (
          <a
            key={action.id}
            href={action.href}
            className="block rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700 hover:bg-slate-100"
          >
            <p className="font-semibold text-slate-950">{action.title}</p>
            <p className="mt-1">{action.detail}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
