export function TimelineFilters({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const options = ["all", "milestone", "evidence", "goal"];
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${value === option ? "bg-slate-950 text-white" : "border border-slate-200 text-slate-700"}`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
