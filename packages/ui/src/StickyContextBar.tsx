import type { ReactNode } from "react";

interface StickyContextBarProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  badges?: ReactNode;
}

export function StickyContextBar({
  title,
  description,
  actions,
  badges,
}: StickyContextBarProps) {
  return (
    <section className="sticky top-0 z-20 rounded-3xl border border-slate-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">{badges}</div>
          <h1 className="mt-2 text-xl font-semibold text-slate-950">{title}</h1>
          {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}
