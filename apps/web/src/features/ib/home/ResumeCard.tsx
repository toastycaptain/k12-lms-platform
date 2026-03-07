import Link from "next/link";
import type { HomeLinkItem } from "@/features/ib/home/useIbHomePayload";

export function ResumeCard({ item }: { item: HomeLinkItem }) {
  return (
    <Link
      href={item.href}
      className="block rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 shadow-sm hover:border-slate-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">{item.label}</p>
          <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
        </div>
        {item.changedSinceLastSeen ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-900">
            Updated
          </span>
        ) : null}
      </div>
    </Link>
  );
}
