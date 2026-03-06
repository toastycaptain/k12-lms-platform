import { FilterBar, VirtualDataGrid } from "@k12/ui";

const ROWS = [
  {
    strand: "Systems thinking",
    pyp: "Visible in Grade 4 inquiry and action evidence",
    myp: "Connected to design and interdisciplinary planning",
    dp: "Referenced in EE research framing and TOK prompts",
  },
  {
    strand: "Communication ATL",
    pyp: "Family windows and oral reflection",
    myp: "Campaign messaging and criterion-linked feedback",
    dp: "Supervision meetings, IA commentary, and TOK discussion",
  },
  {
    strand: "Learner profile - Reflective",
    pyp: "Weekly reflection prompts",
    myp: "Criterion review and project checkpoints",
    dp: "Core milestone reflection and evidence review",
  },
];

export function ContinuumMap() {
  return (
    <div className="space-y-4">
      <FilterBar
        title="Continuum map"
        description="Track progression across PYP, MYP, and DP using concepts, ATL, learner profile, and evidence density."
        controls={
          <>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700">
              Concept progression
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              ATL progression
            </span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-900">
              Evidence density
            </span>
          </>
        }
      />
      <VirtualDataGrid
        columns={[
          { key: "strand", header: "Continuum strand" },
          { key: "pyp", header: "PYP" },
          { key: "myp", header: "MYP" },
          { key: "dp", header: "DP" },
        ]}
        rows={ROWS}
      />
    </div>
  );
}
