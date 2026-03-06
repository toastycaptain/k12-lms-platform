import { MobileTriageTray } from "@/features/ib/mobile/MobileTriageTray";
import type { EvidenceItem } from "@/features/ib/evidence/EvidenceReviewDrawer";

export function MobileEvidenceTriage({ items }: { items: EvidenceItem[] }) {
  return (
    <MobileTriageTray
      title="Evidence triage"
      description="Validate, request reflection, or hold visibility from a compact mobile queue."
      items={items.slice(0, 3).map((item, index) => ({
        id: item.id,
        label: item.title,
        detail: item.nextAction,
        href: String((item as { href?: string }).href || `/ib/evidence/items/${item.id}`),
        status: (item as { changedSinceLastSeen?: boolean }).changedSinceLastSeen
          ? "pending"
          : index === 0
            ? "saved"
            : "retry",
      }))}
    />
  );
}
