export interface SegmentedControlOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  label?: string;
  value: string;
  options: SegmentedControlOption[];
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({
  label,
  value,
  options,
  onChange,
  className = "",
}: SegmentedControlProps) {
  return (
    <div className={className}>
      {label ? <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p> : null}
      <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
