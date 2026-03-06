import type { ReactNode } from "react";

interface FilterBarProps {
  title?: string;
  description?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  controls?: ReactNode;
  actions?: ReactNode;
}

export function FilterBar({
  title,
  description,
  searchValue = "",
  onSearchChange,
  controls,
  actions,
}: FilterBarProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          {title ? <h2 className="text-lg font-semibold text-slate-950">{title}</h2> : null}
          {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
        </div>
        <div className="flex flex-col gap-3 lg:items-end">
          {onSearchChange ? (
            <input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Filter, search, or jump"
              className="min-w-[16rem] rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400"
            />
          ) : null}
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </div>
      {controls ? <div className="mt-4 flex flex-wrap gap-2">{controls}</div> : null}
    </section>
  );
}
