"use client";

import { useMemo, useState } from "react";
import { WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

const TARGET_UNITS = [
  "Grade 4 • Systems around us",
  "Grade 5 • Changing communities",
  "MYP Design • Sustainable futures",
];

export function MultiUnitAttachFlow() {
  const [selected, setSelected] = useState<string[]>([TARGET_UNITS[0]]);

  const summary = useMemo(() => {
    if (selected.length === 0) {
      return "No target units selected yet.";
    }

    return `${selected.length} unit${selected.length === 1 ? "" : "s"} will receive this contribution.`;
  }, [selected]);

  return (
    <WorkspacePanel
      title="Multi-unit attach"
      description="One contribution can be attached across classes without turning specialist work into copy/paste drudgery."
    >
      <div className="space-y-3">
        {TARGET_UNITS.map((unit) => {
          const checked = selected.includes(unit);
          return (
            <label
              key={unit}
              className="flex items-center gap-3 rounded-[1.2rem] border border-slate-200 px-4 py-3 text-sm text-slate-700"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) =>
                  setSelected((current) =>
                    event.target.checked
                      ? [...current, unit]
                      : current.filter((entry) => entry !== unit),
                  )
                }
              />
              <span>{unit}</span>
            </label>
          );
        })}
      </div>
      <p className="mt-4 text-sm text-slate-600">{summary}</p>
    </WorkspacePanel>
  );
}
