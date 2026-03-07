export function GrowthSparkline({ points }: { points: Array<{ label: string; value: number }> }) {
  return (
    <div className="flex items-end gap-2">
      {points.map((point) => (
        <div key={point.label} className="flex-1">
          <div
            className="rounded-t-xl bg-sky-400"
            style={{ height: `${Math.max(point.value * 12, 16)}px` }}
          />
          <p className="mt-2 text-[11px] text-slate-500">{point.label}</p>
        </div>
      ))}
    </div>
  );
}
