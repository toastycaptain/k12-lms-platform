import type { HomeLinkItem } from "@/features/ib/home/useIbHomePayload";
import { ResumeCard } from "@/features/ib/home/ResumeCard";

export function ChangedSinceLastVisit({
  items,
  recentHistory,
}: {
  items: HomeLinkItem[];
  recentHistory: HomeLinkItem[];
}) {
  return (
    <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">Changed since last visit</h2>
        <p className="mt-1 text-sm text-slate-600">
          Only the updates that alter what you should do next, plus the most recent routes you
          opened.
        </p>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <ResumeCard key={item.id} item={item} />
        ))}
      </div>
      {recentHistory.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Recent history
          </p>
          <div className="mt-2 space-y-2">
            {recentHistory.map((item) => (
              <ResumeCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
