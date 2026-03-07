export function ChannelStrategyPanel({
  urgentCount,
  cadenceOptions,
}: {
  urgentCount: number;
  cadenceOptions: string[];
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Channel strategy</h2>
      <p className="mt-1 text-sm text-slate-600">
        Urgent items should stay visible without turning routine publishing into noise.
      </p>
      <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
        <p>Urgent visible items: {urgentCount}</p>
        <p className="mt-2">Available cadence controls: {cadenceOptions.join(", ")}</p>
      </div>
    </div>
  );
}
