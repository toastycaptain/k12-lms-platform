export interface ChipOption {
  value: string;
  label: string;
}

interface ChipGroupProps {
  options: ChipOption[];
  selected: string[];
  onChange: (next: string[]) => void;
}

export function ChipGroup({ options, selected, onChange }: ChipGroupProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() =>
              onChange(
                active ? selected.filter((item) => item !== option.value) : [...selected, option.value],
              )
            }
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              active
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
