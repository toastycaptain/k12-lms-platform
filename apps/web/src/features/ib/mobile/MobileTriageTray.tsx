import Link from "next/link";

interface MobileTriageItem {
  id: string;
  label: string;
  detail: string;
  href: string;
  status: "pending" | "saved" | "retry";
}

const STATUS_COPY: Record<MobileTriageItem["status"], string> = {
  pending: "Pending sync",
  saved: "Saved",
  retry: "Retry needed",
};

const STATUS_STYLES: Record<MobileTriageItem["status"], string> = {
  pending: "bg-amber-100 text-amber-900",
  saved: "bg-emerald-100 text-emerald-900",
  retry: "bg-rose-100 text-rose-900",
};

export function MobileTriageTray({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: MobileTriageItem[];
}) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-5 shadow-sm md:hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
          Mobile triage
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="block rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${STATUS_STYLES[item.status]}`}
              >
                {STATUS_COPY[item.status]}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
