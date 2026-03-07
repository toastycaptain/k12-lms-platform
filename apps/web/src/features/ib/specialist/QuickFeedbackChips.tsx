export function QuickFeedbackChips({ onSelect }: { onSelect: (value: string) => void }) {
  const chips = [
    "Strong evidence",
    "Clarify the next step",
    "Add student voice",
    "Ready for family view",
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          key={chip}
          type="button"
          onClick={() => onSelect(chip)}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
