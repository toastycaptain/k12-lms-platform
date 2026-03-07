import type { IbSpecialistLibraryItem } from "@/features/ib/data";

export function SpecialistLibraryPanel({ items }: { items: IbSpecialistLibraryItem[] }) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Reuse library</h2>
      <p className="mt-1 text-sm text-slate-600">
        Save cross-grade artifacts once, then adapt them without copy-paste drift.
      </p>
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-950">{item.title}</p>
            <p className="mt-1">{item.summary || "Reusable specialist artifact"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
