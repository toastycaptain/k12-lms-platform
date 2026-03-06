"use client";

import { ActivityTimeline, type ActivityTimelineItem } from "@k12/ui";

interface UnifiedTimelinePanelProps {
  title?: string;
  items: ActivityTimelineItem[];
}

export function UnifiedTimelinePanel({
  title = "Unified Timeline",
  items,
}: UnifiedTimelinePanelProps) {
  return (
    <section>
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm text-slate-600">
          One place for deadlines, evidence moments, family visibility, and project checkpoints.
        </p>
      </div>
      <ActivityTimeline items={items} />
    </section>
  );
}
