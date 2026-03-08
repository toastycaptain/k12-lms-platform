"use client";

import type { ReactNode } from "react";

export function MobileCompactShell({
  title,
  description,
  badges,
  summary,
  lowBandwidth,
  onToggleLowBandwidth,
}: {
  title: string;
  description: string;
  badges?: ReactNode;
  summary?: string;
  lowBandwidth: boolean;
  onToggleLowBandwidth: () => void;
}) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-5 shadow-sm md:hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Mobile workspace
          </p>
          <h1 className="mt-2 text-xl font-semibold text-slate-950">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <button
          type="button"
          onClick={onToggleLowBandwidth}
          aria-pressed={lowBandwidth}
          className={`min-h-11 rounded-full px-4 text-xs font-semibold ${
            lowBandwidth
              ? "bg-slate-950 text-white"
              : "border border-slate-200 bg-white text-slate-700"
          }`}
        >
          {lowBandwidth ? "Low-bandwidth on" : "Low-bandwidth off"}
        </button>
      </div>
      {badges ? <div className="mt-4 flex flex-wrap gap-2">{badges}</div> : null}
      {summary ? (
        <div className="mt-4 rounded-[1.2rem] bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {summary}
        </div>
      ) : null}
    </section>
  );
}
