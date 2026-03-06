import { SegmentedControl } from "@k12/ui";
import type { EvidenceVisibility } from "@/features/curriculum/evidence/types";

interface ShareVisibilityControlProps {
  value: EvidenceVisibility;
  onChange: (value: EvidenceVisibility) => void;
}

export function ShareVisibilityControl({ value, onChange }: ShareVisibilityControlProps) {
  return (
    <SegmentedControl
      label="Visibility"
      value={value}
      onChange={(next) => onChange(next as EvidenceVisibility)}
      options={[
        { value: "private", label: "Private" },
        { value: "teacher", label: "Teacher" },
        { value: "student", label: "Student" },
        { value: "family", label: "Family" },
        { value: "cohort", label: "Cohort" },
      ]}
    />
  );
}
