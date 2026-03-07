"use client";

import { useState } from "react";
import type { HomeLinkItem } from "@/features/ib/home/useIbHomePayload";

export function BulkCarryForwardPanel({ items }: { items: HomeLinkItem[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-950">Bulk carry forward</h2>
        <p className="mt-1 text-sm text-slate-600">
          Select high-value items to prepare for the next cycle without rebuilding them from
          scratch.
        </p>
      </div>
      <div className="space-y-2">
        {items.map((item) => {
          const checked = selectedIds.includes(item.id);
          return (
            <label
              key={item.id}
              className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) =>
                  setSelectedIds((current) =>
                    event.target.checked
                      ? [...current, item.id]
                      : current.filter((value) => value !== item.id),
                  )
                }
              />
              <span>
                <span className="font-semibold text-slate-950">{item.label}</span>
                <span className="mt-1 block">{item.detail}</span>
              </span>
            </label>
          );
        })}
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-400">
        {selectedIds.length} selected
      </p>
    </div>
  );
}
