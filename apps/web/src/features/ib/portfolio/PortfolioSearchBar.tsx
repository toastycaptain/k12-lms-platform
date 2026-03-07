"use client";

export function PortfolioSearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Search portfolio evidence or collections"
      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
    />
  );
}
