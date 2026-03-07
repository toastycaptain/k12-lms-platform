export function CoverageBalanceDashboard({
  balances,
}: {
  balances: Record<string, Record<string, number>>;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {Object.entries(balances).map(([label, values]) => (
        <div
          key={label}
          className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-950">{label.replace(/_/g, " ")}</h2>
          <p className="mt-3 text-sm text-slate-700">
            {Object.entries(values)
              .map(([value, count]) => `${value}: ${count}`)
              .join(" • ") || "No signals yet."}
          </p>
        </div>
      ))}
    </div>
  );
}
