"use client";

import { useMemo } from "react";

export interface SequenceBlock {
  id: string;
  title: string;
  detail: string;
  category: string;
}

export function buildSequenceBlocks(content: Record<string, unknown>): SequenceBlock[] {
  const rows: SequenceBlock[] = [];

  Object.entries(content).forEach(([key, value]) => {
    if (Array.isArray(value) && value.length > 0) {
      value.forEach((entry, index) => {
        if (typeof entry === "string" && entry.trim()) {
          rows.push({
            id: `${key}-${index}`,
            title: entry,
            detail: `Sequence item ${index + 1}`,
            category: key,
          });
        } else if (entry && typeof entry === "object") {
          const record = entry as Record<string, unknown>;
          rows.push({
            id: `${key}-${index}`,
            title: String(record.title || record.name || `${key} ${index + 1}`),
            detail: String(record.detail || record.summary || record.description || ""),
            category: key,
          });
        }
      });
    }
  });

  return rows.slice(0, 12);
}

export function SequenceBoard({
  content,
  onSelect,
}: {
  content: Record<string, unknown>;
  onSelect: (block: SequenceBlock) => void;
}) {
  const blocks = useMemo(() => buildSequenceBlocks(content), [content]);

  if (blocks.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">
        Sequence blocks appear here when the document includes ordered experiences, inquiries, or
        lesson segments.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {blocks.map((block) => (
        <button
          key={block.id}
          type="button"
          onClick={() => onSelect(block)}
          className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {block.category.replace(/_/g, " ")}
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-950">{block.title}</p>
          <p className="mt-1 text-sm text-slate-600">
            {block.detail || "Open to refine this block."}
          </p>
        </button>
      ))}
    </div>
  );
}
