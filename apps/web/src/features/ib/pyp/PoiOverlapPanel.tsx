export function PoiOverlapPanel({
  rows,
}: {
  rows: Array<{
    id: number;
    title: string;
    yearLevel: string;
    theme: string;
    signal: string;
    href: string;
  }>;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">POI overlap watchlist</h2>
      <div className="mt-4 space-y-2">
        {rows.map((row) => (
          <a
            key={row.id}
            href={row.href}
            className="block rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 hover:bg-slate-100"
          >
            <span className="font-semibold text-slate-950">{row.title}</span> • {row.yearLevel} •{" "}
            {row.theme} • {row.signal}
          </a>
        ))}
      </div>
    </div>
  );
}
