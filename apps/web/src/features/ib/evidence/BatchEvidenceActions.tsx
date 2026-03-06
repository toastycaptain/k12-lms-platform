import { IbTonePill } from "@/features/ib/core/IbSurfaceState";

export type EvidenceBatchAction = "validate" | "reflection" | "story" | "hold-internal";

const ACTION_LABELS: Record<EvidenceBatchAction, string> = {
  validate: "Validate",
  reflection: "Request reflection",
  story: "Add to story draft",
  "hold-internal": "Hold internal",
};

export function BatchEvidenceActions({
  selectedCount,
  lastAction,
  onAction,
}: {
  selectedCount: number;
  lastAction: EvidenceBatchAction | null;
  onAction: (action: EvidenceBatchAction) => void;
}) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Batch actions</h2>
          <p className="mt-1 text-sm text-slate-600">
            Operate on the obvious next step without opening every evidence item one by one.
          </p>
        </div>
        <IbTonePill
          label={selectedCount > 0 ? `${selectedCount} selected` : "Select evidence"}
          tone={selectedCount > 0 ? "accent" : "default"}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {(Object.keys(ACTION_LABELS) as EvidenceBatchAction[]).map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => onAction(action)}
            disabled={selectedCount === 0}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ACTION_LABELS[action]}
          </button>
        ))}
      </div>

      {lastAction ? (
        <p className="mt-4 text-sm text-slate-600">
          Last action preview:{" "}
          <span className="font-semibold text-slate-900">{ACTION_LABELS[lastAction]}</span>
        </p>
      ) : null}
    </section>
  );
}
