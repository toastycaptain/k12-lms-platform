"use client";

import type { SequenceBlock } from "@/features/ib/planning/SequenceBoard";

export function SequenceBlockEditor({ block }: { block: SequenceBlock | null }) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Sequence block editor</h2>
      <p className="mt-1 text-sm text-slate-600">
        Keep sequence editing lightweight: open a block, review intent, then return to the main
        studio without losing position.
      </p>
      {block ? (
        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {block.category.replace(/_/g, " ")}
          </p>
          <p className="mt-2 font-semibold text-slate-950">{block.title}</p>
          <p className="mt-1">{block.detail || "No additional detail yet."}</p>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
          Select a block from the sequence board to inspect it here.
        </div>
      )}
    </div>
  );
}
