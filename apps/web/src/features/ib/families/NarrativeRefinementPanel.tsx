import { TranslationStatePill } from "@/features/ib/families/TranslationStatePill";

export function NarrativeRefinementPanel({
  stories,
}: {
  stories: Array<{ id: number; title: string; summary?: string | null; translationState?: string }>;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Narrative refinement</h2>
      <div className="mt-4 space-y-2">
        {stories.map((story) => (
          <div key={story.id} className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-950">{story.title}</p>
                <p className="mt-1">
                  {story.summary || "Plain-language refinement keeps the story family-ready."}
                </p>
              </div>
              {story.translationState ? (
                <TranslationStatePill state={story.translationState} />
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
