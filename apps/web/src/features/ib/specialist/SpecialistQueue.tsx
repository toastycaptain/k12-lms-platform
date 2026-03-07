import { HandoffStatePill } from "@/features/ib/specialist/HandoffStatePill";

export interface SpecialistQueueItem {
  id: number;
  title: string;
  detail: string;
  href: string;
  handoffState?: string;
}

export function SpecialistQueue({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: SpecialistQueueItem[];
}) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className="block rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700 hover:bg-slate-100"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-950">{item.title}</p>
                <p className="mt-1">{item.detail}</p>
              </div>
              {item.handoffState ? <HandoffStatePill state={item.handoffState} /> : null}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
