export function PortfolioHighlights({ items = [] }: { items?: string[] }) {
  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-950">Portfolio highlights</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item} className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
              {item}
            </div>
          ))
        ) : (
          <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
            No portfolio highlights are currently visible.
          </div>
        )}
      </div>
    </section>
  );
}
