export function LearningTimeline({
  items,
}: {
  items: Array<{ id: string; title: string; detail: string; href: string; kind: string }>;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <a
          key={item.id}
          href={item.href}
          className="block rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700 hover:bg-slate-100"
        >
          <p className="font-semibold text-slate-950">{item.title}</p>
          <p className="mt-1">{item.detail}</p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">
            {item.kind.replace(/_/g, " ")}
          </p>
        </a>
      ))}
    </div>
  );
}
