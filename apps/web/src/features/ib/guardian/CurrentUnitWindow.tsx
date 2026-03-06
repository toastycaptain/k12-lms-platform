export function CurrentUnitWindow({
  title,
  summary,
}: {
  title?: string;
  summary?: Record<string, unknown>;
}) {
  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-950">Current unit window</h3>
      <p className="mt-2 text-sm text-slate-600">
        {title || "No current unit has been shared yet."}
      </p>
      <ul className="mt-4 space-y-3 text-sm text-slate-600">
        {Object.entries(summary || {}).length > 0 ? (
          Object.entries(summary || {}).map(([key, value]) => (
            <li key={key} className="rounded-3xl bg-slate-50 p-4">
              {key.replace(/_/g, " ")}: {String(value)}
            </li>
          ))
        ) : (
          <li className="rounded-3xl bg-slate-50 p-4">
            Family-visible unit details will appear here once published.
          </li>
        )}
      </ul>
    </section>
  );
}
