import { ChipGroup, TagInput } from "@k12/ui";

const LEARNER_PROFILE_OPTIONS = [
  { value: "Inquirer", label: "Inquirer" },
  { value: "Thinker", label: "Thinker" },
  { value: "Communicator", label: "Communicator" },
  { value: "Caring", label: "Caring" },
  { value: "Reflective", label: "Reflective" },
];

const ATL_OPTIONS = [
  { value: "Research", label: "Research" },
  { value: "Communication", label: "Communication" },
  { value: "Collaboration", label: "Collaboration" },
  { value: "Self-management", label: "Self-management" },
  { value: "Creative thinking", label: "Creative thinking" },
];

interface EvidenceTagPickerProps {
  learnerProfileTags: string[];
  atlTags: string[];
  conceptTags: string[];
  contextTags: string[];
  onLearnerProfileChange: (value: string[]) => void;
  onAtlChange: (value: string[]) => void;
  onConceptChange: (value: string[]) => void;
  onContextChange: (value: string[]) => void;
}

export function EvidenceTagPicker({
  learnerProfileTags,
  atlTags,
  conceptTags,
  contextTags,
  onLearnerProfileChange,
  onAtlChange,
  onConceptChange,
  onContextChange,
}: EvidenceTagPickerProps) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Learner profile
        </p>
        <div className="mt-2">
          <ChipGroup
            options={LEARNER_PROFILE_OPTIONS}
            selected={learnerProfileTags}
            onChange={onLearnerProfileChange}
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">ATL</p>
        <div className="mt-2">
          <ChipGroup options={ATL_OPTIONS} selected={atlTags} onChange={onAtlChange} />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Concepts</p>
        <div className="mt-2">
          <TagInput
            value={conceptTags}
            onChange={onConceptChange}
            placeholder="Key concepts, related concepts, or core ideas"
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Context</p>
        <div className="mt-2">
          <TagInput
            value={contextTags}
            onChange={onContextChange}
            placeholder="Unit, project, action, or family window context"
          />
        </div>
      </div>
    </div>
  );
}
