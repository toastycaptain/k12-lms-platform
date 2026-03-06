"use client";

import { SegmentedControl } from "@k12/ui";
import { useIbContext, type IbWorkMode } from "@/features/ib/core/useIbContext";

const MODE_OPTIONS: Array<{ value: IbWorkMode; label: string }> = [
  { value: "planning", label: "Plan" },
  { value: "teaching", label: "Teach" },
  { value: "meeting", label: "Meeting" },
  { value: "review", label: "Review" },
  { value: "family-preview", label: "Preview" },
];

export function IbWorkModeSwitch() {
  const { active, currentWorkMode, setWorkMode } = useIbContext();

  if (!active) {
    return null;
  }

  return (
    <SegmentedControl
      label="Work mode"
      value={currentWorkMode}
      options={MODE_OPTIONS}
      onChange={(value) => setWorkMode(value as IbWorkMode)}
    />
  );
}
