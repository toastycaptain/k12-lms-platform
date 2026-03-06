import { WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

export interface FamilyStoryItem extends Record<string, unknown> {
  id: string;
  title: string;
  programme: "PYP" | "MYP" | "DP";
  audience: string;
  teacher: string;
  cadence: string;
  state: import("@/features/ib/families/StoryStatePill").StoryState;
  summary: string;
  supportPrompt: string;
}

export function FamilyPreviewPanel({ story }: { story: FamilyStoryItem | null }) {
  return (
    <WorkspacePanel
      title="Family preview"
      description="This preview mirrors the calm, permission-safe wording families actually receive."
    >
      {story ? (
        <div className="space-y-4 rounded-[1.5rem] bg-slate-50 p-4 text-sm text-slate-700">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Family sees
            </p>
            <p className="mt-2 font-semibold text-slate-950">{story.title}</p>
            <p className="mt-2">{story.summary}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Support at home
            </p>
            <p className="mt-2">{story.supportPrompt}</p>
          </div>
          <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
            Audience: {story.audience}
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-600">
          Pick a story from the queue to see the final family-facing wording before it is scheduled
          or published.
        </p>
      )}
    </WorkspacePanel>
  );
}
