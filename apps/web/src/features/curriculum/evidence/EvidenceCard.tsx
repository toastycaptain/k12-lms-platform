import type { EvidenceItem } from "@/features/curriculum/evidence/types";

interface EvidenceCardProps {
  item: EvidenceItem;
  onOpen: () => void;
}

const VISIBILITY_LABELS = {
  private: "Private",
  teacher: "Teacher only",
  student: "Student + teacher",
  family: "Family visible",
  cohort: "Cohort visible",
} as const;

const VALIDATION_STYLES = {
  draft: "bg-slate-100 text-slate-600",
  submitted: "bg-amber-100 text-amber-800",
  validated: "bg-emerald-100 text-emerald-800",
} as const;

export function EvidenceCard({ item, onOpen }: EvidenceCardProps) {
  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              {item.programme}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${VALIDATION_STYLES[item.validationState]}`}
            >
              {item.validationState}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {VISIBILITY_LABELS[item.visibility]}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-slate-950">{item.title}</h3>
          <p className="mt-1 text-sm text-slate-600">{item.description}</p>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Open detail
        </button>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Learner
          </p>
          <p className="mt-1">{item.learner}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Unit</p>
          <p className="mt-1">{item.unitTitle}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tags</p>
          <p className="mt-1">
            {[...item.learnerProfileTags, ...item.atlTags].slice(0, 3).join(", ")}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Updated
          </p>
          <p className="mt-1">{item.updatedAt}</p>
        </div>
      </div>
    </article>
  );
}
