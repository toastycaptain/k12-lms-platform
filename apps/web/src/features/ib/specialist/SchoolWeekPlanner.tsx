import { CalendarTimeline } from "@k12/ui";

export function SchoolWeekPlanner({
  items,
}: {
  items?: Array<{ id: string | number; date?: string | null; title: string; detail: string }>;
}) {
  const timelineItems =
    items && items.length > 0
      ? items.map((item, index) => ({
          id: String(item.id),
          date: item.date || `Priority ${index + 1}`,
          title: item.title,
          detail: item.detail,
        }))
      : [
          {
            id: "specialist-empty",
            date: "This week",
            title: "No specialist blocks scheduled",
            detail: "Specialist requests will appear here as units and evidence need support.",
          },
        ];

  return <CalendarTimeline items={timelineItems} />;
}
