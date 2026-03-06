import Link from "next/link";

export function StudentLearningStream({
  items = [],
}: {
  items?: Array<{
    id: number | string;
    title: string;
    context: string;
    detail: string;
    href: string;
  }>;
}) {
  return (
    <div className="space-y-3">
      {items.length > 0 ? (
        items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="block rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {item.context}
            </p>
            <h3 className="mt-2 text-base font-semibold text-slate-950">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
          </Link>
        ))
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
          No learning items are currently visible.
        </div>
      )}
    </div>
  );
}
