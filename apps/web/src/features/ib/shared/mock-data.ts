import type { ActivityTimelineItem } from "@k12/ui";

export function makeTimeline(prefix: string): ActivityTimelineItem[] {
  return [
    {
      id: `${prefix}-1`,
      title: "Review unit evidence",
      description: "Check the evidence queue and confirm which moments are family-visible.",
      meta: "Today",
      tone: "accent",
    },
    {
      id: `${prefix}-2`,
      title: "Refine inquiry sequence",
      description: "Tighten the next learning experience and connect it to assessment signals.",
      meta: "Tomorrow",
      tone: "warning",
    },
    {
      id: `${prefix}-3`,
      title: "Publish programme snapshot",
      description: "Share a concise update across the continuum with coordinator-facing context.",
      meta: "This week",
      tone: "success",
    },
  ];
}

export const SAMPLE_COMMENTS = [
  {
    id: "comment-1",
    author: "Amina Coordinator",
    body: "This sequence is clear. Bring the family-facing summary closer to the evidence checkpoint.",
    timestamp: "5m ago",
  },
  {
    id: "comment-2",
    author: "Luis Specialist",
    body: "Add a specialist contribution note so the weekly flow stays transdisciplinary.",
    timestamp: "24m ago",
  },
];

export const SAMPLE_PRESENCE = [
  { id: "1", name: "Amina Coordinator" },
  { id: "2", name: "Luis Specialist" },
  { id: "3", name: "Tara Teacher" },
];
