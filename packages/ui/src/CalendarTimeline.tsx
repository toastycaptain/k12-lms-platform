export interface CalendarTimelineItem {
  id: string;
  date: string;
  title: string;
  detail?: string;
}

interface CalendarTimelineProps {
  items: CalendarTimelineItem[];
}

export function CalendarTimeline({ items }: CalendarTimelineProps) {
  return (
    <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      {items.map((item) => (
        <div key={item.id} className="grid gap-2 rounded-2xl border border-slate-200 p-3 sm:grid-cols-[8rem_1fr]">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {item.date}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
            {item.detail ? <p className="mt-1 text-sm text-slate-600">{item.detail}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
