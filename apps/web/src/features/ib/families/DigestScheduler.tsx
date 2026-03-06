"use client";

import { SegmentedControl } from "@k12/ui";
import { WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

export function DigestScheduler({
  cadence,
  onCadenceChange,
  onSchedule,
}: {
  cadence: "weekly" | "twice-weekly" | "publish-now";
  onCadenceChange: (value: "weekly" | "twice-weekly" | "publish-now") => void;
  onSchedule: () => void;
}) {
  return (
    <WorkspacePanel
      title="Digest scheduler"
      description="Teachers should know when families will hear from them and how often."
    >
      <SegmentedControl
        label="Cadence"
        value={cadence}
        onChange={(value) => onCadenceChange(value as "weekly" | "twice-weekly" | "publish-now")}
        options={[
          { value: "weekly", label: "Weekly digest" },
          { value: "twice-weekly", label: "Twice weekly" },
          { value: "publish-now", label: "Publish now" },
        ]}
      />
      <button
        type="button"
        onClick={onSchedule}
        className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white"
      >
        Save publishing plan
      </button>
    </WorkspacePanel>
  );
}
