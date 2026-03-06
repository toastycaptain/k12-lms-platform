import { Drawer, SegmentedControl } from "@k12/ui";
import { MultiUnitAttachFlow } from "@/features/ib/specialist/MultiUnitAttachFlow";

export function SpecialistContributionDrawer({
  open,
  onClose,
  contributionMode,
  onContributionModeChange,
  title,
}: {
  open: boolean;
  onClose: () => void;
  contributionMode: "comment" | "evidence" | "resource" | "support-note";
  onContributionModeChange: (value: "comment" | "evidence" | "resource" | "support-note") => void;
  title: string;
}) {
  return (
    <Drawer
      open={open}
      title={title}
      description="Fast contribution modes keep specialists useful between classes without forcing a full unit-studio visit."
      onClose={onClose}
    >
      <SegmentedControl
        label="Contribution type"
        value={contributionMode}
        onChange={(value) =>
          onContributionModeChange(value as "comment" | "evidence" | "resource" | "support-note")
        }
        options={[
          { value: "comment", label: "Comment" },
          { value: "evidence", label: "Evidence" },
          { value: "resource", label: "Resource" },
          { value: "support-note", label: "Support note" },
        ]}
      />
      <textarea
        aria-label="Specialist contribution draft"
        className="mt-4 min-h-32 w-full rounded-[1.35rem] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-400"
        defaultValue="Add one concise contribution note here."
      />
      <div className="mt-4">
        <MultiUnitAttachFlow />
      </div>
    </Drawer>
  );
}
