export function ProgressSummary({ items = [] }: { items?: string[] }) {
  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-950">Progress summary</h3>
      <ul className="mt-4 space-y-3 text-sm text-slate-600">
        {items.length > 0 ? (
          items.map((item) => (
            <li key={item} className="rounded-3xl bg-slate-50 p-4">
              {item}
            </li>
          ))
        ) : (
          <li className="rounded-3xl bg-slate-50 p-4">
            Published progress signals will appear here once available.
          </li>
        )}
      </ul>
    </section>
  );
}
