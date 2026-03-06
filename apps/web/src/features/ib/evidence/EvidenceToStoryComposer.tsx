import { DiffViewer } from "@k12/ui";
import { WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";
import type { EvidenceItem } from "@/features/ib/evidence/EvidenceReviewDrawer";

export function EvidenceToStoryComposer({ item }: { item: EvidenceItem | null }) {
  return (
    <WorkspacePanel
      title="Evidence to story composer"
      description="Teachers can shape family-facing narrative without copying evidence into a second workflow."
    >
      {item ? (
        <DiffViewer
          previous={`Evidence note: ${item.title} in ${item.context}.`}
          next={`Family summary: ${item.title} shows clear progress in ${item.context}. ${item.storyDraft}`}
        />
      ) : (
        <p className="text-sm text-slate-600">
          Select an evidence item to preview how it will translate into a calm family-facing story
          draft.
        </p>
      )}
    </WorkspacePanel>
  );
}
