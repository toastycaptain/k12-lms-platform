import type { ReactNode } from "react";

export interface KanbanCard {
  id: string;
  title: string;
  meta?: string;
  body?: ReactNode;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
}

export function KanbanBoard({ columns }: KanbanBoardProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {columns.map((column) => (
        <section key={column.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            {column.title}
          </h3>
          <div className="mt-4 space-y-3">
            {column.cards.map((card) => (
              <article key={card.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">{card.title}</p>
                  {card.meta ? <span className="text-xs text-slate-400">{card.meta}</span> : null}
                </div>
                {card.body ? <div className="mt-2 text-sm text-slate-600">{card.body}</div> : null}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
