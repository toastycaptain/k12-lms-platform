export interface GuardianStoryFeedItem {
  id: number | string;
  title: string;
  detail: string;
  prompt: string;
}

export function LearningStoryFeed({ stories = [] }: { stories?: GuardianStoryFeedItem[] }) {
  return (
    <div className="space-y-3">
      {stories.length > 0 ? (
        stories.map((story) => (
          <article
            key={story.id}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm"
          >
            <h3 className="text-base font-semibold text-slate-950">{story.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{story.detail}</p>
            <p className="mt-3 text-sm font-medium text-slate-700">At home: {story.prompt}</p>
          </article>
        ))
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
          No published stories yet.
        </div>
      )}
    </div>
  );
}
