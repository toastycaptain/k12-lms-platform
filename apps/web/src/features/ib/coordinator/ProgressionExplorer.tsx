export function ProgressionExplorer({
  rows,
}: {
  rows: Record<string, Array<{ id: number; title: string; href: string; documentType: string }>>;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Continuum explorer</h2>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {Object.entries(rows).map(([programme, items]) => (
          <div key={programme} className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-950">{programme}</p>
            <div className="mt-2 space-y-2">
              {items.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  className="block underline-offset-4 hover:underline"
                >
                  {item.title}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
