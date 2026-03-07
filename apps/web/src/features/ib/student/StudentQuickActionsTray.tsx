export function StudentQuickActionsTray({
  actions,
}: {
  actions: Array<{ id: string; label: string; detail: string; href: string }>;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm md:hidden">
      <h2 className="text-lg font-semibold text-slate-950">Quick actions</h2>
      <div className="mt-4 flex snap-x gap-3 overflow-x-auto pb-2">
        {actions.map((action) => (
          <a
            key={action.id}
            href={action.href}
            className="min-w-[15rem] snap-start rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700"
          >
            <p className="font-semibold text-slate-950">{action.label}</p>
            <p className="mt-1">{action.detail}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
