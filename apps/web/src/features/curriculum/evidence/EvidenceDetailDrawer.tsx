"use client";

import { CommentThread, Drawer } from "@k12/ui";
import { EvidenceTagPicker } from "@/features/curriculum/evidence/EvidenceTagPicker";
import { ReflectionComposer } from "@/features/curriculum/evidence/ReflectionComposer";
import { ShareVisibilityControl } from "@/features/curriculum/evidence/ShareVisibilityControl";
import type { EvidenceItem, EvidenceVisibility } from "@/features/curriculum/evidence/types";

interface EvidenceDetailDrawerProps {
  item: EvidenceItem | null;
  open: boolean;
  onClose: () => void;
  onReflectionChange: (value: string) => void;
  onVisibilityChange: (value: EvidenceVisibility) => void;
  onTagsChange: (
    field: "learnerProfileTags" | "atlTags" | "conceptTags" | "contextTags",
    nextTags: string[],
  ) => void;
  onCommentSubmit: (body: string) => void;
}

export function EvidenceDetailDrawer({
  item,
  open,
  onClose,
  onReflectionChange,
  onVisibilityChange,
  onTagsChange,
  onCommentSubmit,
}: EvidenceDetailDrawerProps) {
  if (!item) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={item.title}
      description={`${item.programme} • ${item.unitTitle} • ${item.learner}`}
      widthClassName="w-full max-w-3xl"
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-700">{item.description}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Attachments
              </p>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                {item.attachments.map((attachment) => (
                  <li key={attachment.id} className="rounded-2xl bg-white px-3 py-2">
                    {attachment.label} • {attachment.kind}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <ShareVisibilityControl value={item.visibility} onChange={onVisibilityChange} />
            </div>
          </div>
        </section>

        <ReflectionComposer initialValue={item.reflection} onCommit={onReflectionChange} />

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">IB metadata</p>
          <p className="mt-1 text-sm text-slate-600">
            Keep learner profile, ATL, concepts, and context visible on every evidence item.
          </p>
          <div className="mt-4">
            <EvidenceTagPicker
              learnerProfileTags={item.learnerProfileTags}
              atlTags={item.atlTags}
              conceptTags={item.conceptTags}
              contextTags={item.contextTags}
              onLearnerProfileChange={(next) => onTagsChange("learnerProfileTags", next)}
              onAtlChange={(next) => onTagsChange("atlTags", next)}
              onConceptChange={(next) => onTagsChange("conceptTags", next)}
              onContextChange={(next) => onTagsChange("contextTags", next)}
            />
          </div>
        </section>

        <CommentThread comments={item.comments} onSubmit={onCommentSubmit} />
      </div>
    </Drawer>
  );
}
