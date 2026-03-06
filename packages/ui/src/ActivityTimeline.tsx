import type { ReactNode } from "react";

export interface ActivityTimelineItem {
  id: string;
  title: string;
  description: string;
  meta?: string;
  icon?: ReactNode;
  tone?: "default" | "accent" | "success" | "warning";
}

const TONE_CLASSES = {
  default: "bg-slate-200",
  accent: "bg-sky-400",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
} as const;

interface ActivityTimelineProps {
  items: ActivityTimelineItem[];
}

export function ActivityTimeline({ items }: ActivityTimelineProps) {
  return (
    <ol className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      {items.map((item) => (
        <li key={item.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <span className={`mt-1 h-3 w-3 rounded-full ${TONE_CLASSES[item.tone ?? "default"]}`} />
            <span className="mt-2 h-full w-px bg-slate-200" />
          </div>
          <div className="pb-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-950">{item.title}</p>
              {item.meta ? <span className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.meta}</span> : null}
            </div>
            <p className="mt-1 text-sm text-slate-600">{item.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
