import { Drawer } from "@k12/ui";
import { IbTonePill } from "@/features/ib/core/IbSurfaceState";

export interface EvidenceItem extends Record<string, unknown> {
  id: string;
  title: string;
  programme: "PYP" | "MYP" | "DP";
  context: string;
  contributor: string;
  status: string;
  visibility: string;
  nextAction: string;
  storyDraft: string;
  warnings: string[];
}

export function EvidenceReviewDrawer({
  item,
  open,
  onClose,
}: {
  item: EvidenceItem | null;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Drawer
      open={open && Boolean(item)}
      title={item?.title ?? "Evidence"}
      description="Review context, visibility, and the next action without losing your queue place."
      onClose={onClose}
    >
      {item ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <IbTonePill label={item.programme} tone="accent" />
            <IbTonePill label={item.status} tone="warm" />
            <IbTonePill label={item.visibility} tone="default" />
          </div>
          <div className="rounded-[1.35rem] bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Context
            </p>
            <p className="mt-2 text-sm text-slate-700">{item.context}</p>
          </div>
          <div className="rounded-[1.35rem] bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Next action
            </p>
            <p className="mt-2 text-sm text-slate-700">{item.nextAction}</p>
          </div>
          <div className="rounded-[1.35rem] bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Story draft link
            </p>
            <p className="mt-2 text-sm text-slate-700">{item.storyDraft}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Missing-context warnings
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {item.warnings.map((warning) => (
                <li
                  key={warning}
                  className="rounded-[1.2rem] border border-amber-200 bg-amber-50 px-4 py-3"
                >
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </Drawer>
  );
}
