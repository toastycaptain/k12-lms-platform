import { EvidenceQualityBadge } from "@/features/ib/standards/EvidenceQualityBadge";

export function EvidenceGapPanel({
  rows,
}: {
  rows: Array<{
    id: number;
    title: string;
    evidenceQuality: string;
    weakReason: string;
    href: string;
  }>;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Evidence quality overlay</h2>
      <div className="mt-4 space-y-2">
        {rows.map((row) => (
          <a
            key={row.id}
            href={row.href}
            className="block rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700 hover:bg-slate-100"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-950">{row.title}</p>
                <p className="mt-1">{row.weakReason}</p>
              </div>
              <EvidenceQualityBadge value={row.evidenceQuality} />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
