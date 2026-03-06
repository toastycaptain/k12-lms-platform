import { CalendarTimeline } from "@k12/ui";

export function CalendarDigest({
  items = [],
}: {
  items?: Array<{ id: number | string; date?: string | null; title: string; detail: string }>;
}) {
  return (
    <CalendarTimeline
      items={items.map((item) => ({
        id: String(item.id),
        date: item.date || "Upcoming",
        title: item.title,
        detail: item.detail,
      }))}
    />
  );
}
