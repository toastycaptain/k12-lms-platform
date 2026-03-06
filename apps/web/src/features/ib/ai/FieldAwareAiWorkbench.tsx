"use client";

import { useMemo, useState } from "react";
import AiApplyModal, { type AiApplyChange } from "@/components/AiApplyModal";
import { buildSuggestionDiffs, parseUnitSuggestion } from "@/lib/ai-output-parser";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

const CURRENT_VALUES = {
  central_idea: "Students explore water systems.",
  lines_of_inquiry: "How water moves\nWhy systems change",
  family_window_summary: "We are learning about water.",
};

const STRUCTURED_SUGGESTION = JSON.stringify(
  {
    programme: "PYP",
    task_type: "unit_plan",
    fields: [
      {
        field: "central_idea",
        label: "Central idea",
        value:
          "Natural systems respond to change, and responsible choices affect how communities live with them.",
      },
      {
        field: "lines_of_inquiry",
        label: "Lines of inquiry",
        value:
          "How water systems move and change\nHow human choices affect those systems\nHow action can support more responsible use",
      },
      {
        field: "family_window_summary",
        label: "Family window summary",
        value:
          "We are investigating how water systems react to change and how thoughtful choices can help communities care for shared resources.",
      },
    ],
  },
  null,
  2,
);

export function FieldAwareAiWorkbench() {
  const [open, setOpen] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  const diffs = useMemo(() => {
    const suggestion = parseUnitSuggestion(STRUCTURED_SUGGESTION);
    return buildSuggestionDiffs(CURRENT_VALUES, suggestion).map((diff) => ({
      field: diff.label,
      previous: diff.previous,
      next: diff.next,
    })) satisfies AiApplyChange[];
  }, []);

  return (
    <>
      <IbWorkspaceScaffold
        title="Field-aware AI assistance"
        description="Structured suggestions target real planner fields and require explicit review before apply."
        badges={
          <>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
              Structured output
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              Selective apply
            </span>
          </>
        }
        metrics={[
          {
            label: "Suggested fields",
            value: String(diffs.length),
            detail: "No invisible edits",
            tone: "accent",
          },
          {
            label: "Apply mode",
            value: "Selective",
            detail: "Per-field acceptance or rejection",
            tone: "success",
          },
          {
            label: "Fallback mode",
            value: "Legacy headings",
            detail: "Still supported for migration",
            tone: "warm",
          },
          {
            label: "School control",
            value: "Configurable",
            detail: "AI remains optional and bounded",
          },
        ]}
        main={
          <WorkspacePanel
            title="Structured payload preview"
            description="The assistant should know the active programme and the real planner fields it is allowed to suggest."
          >
            <pre className="overflow-auto rounded-3xl bg-slate-950 p-4 text-sm text-slate-100">
              {STRUCTURED_SUGGESTION}
            </pre>
          </WorkspacePanel>
        }
        aside={
          <WorkspacePanel
            title="Apply rules"
            description="AI never applies invisibly and never replaces non-AI paths."
          >
            <ul className="space-y-3 text-sm text-slate-600">
              <li>Users can apply only selected fields.</li>
              <li>Diffs stay visible before confirmation.</li>
              <li>Programme-specific fields are explicit.</li>
            </ul>
            <button
              type="button"
              onClick={() => {
                setSelectedFields(diffs.map((diff) => diff.field));
                setOpen(true);
              }}
              className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Review diffs
            </button>
          </WorkspacePanel>
        }
      />
      <AiApplyModal
        open={open}
        changes={diffs}
        selectedFields={selectedFields}
        onSelectionChange={setSelectedFields}
        onCancel={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      />
    </>
  );
}
