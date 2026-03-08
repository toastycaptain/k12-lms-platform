"use client";

import { useMemo, useState } from "react";
import { Drawer } from "@k12/ui";
import { ApiError } from "@/lib/api";
import { enqueueMutation } from "@/lib/offlineMutationQueue";
import { createIbEvidenceItem, linkIbEvidenceItemToStory } from "@/features/ib/data";
import { saveIbMobileSyncDiagnostic } from "@/features/ib/phase9/data";
import {
  recordMobileConflict,
  removeMobileDraft,
  upsertMobileDraft,
} from "@/features/ib/mobile/mobileDraftStore";

interface StoryOption {
  id: number;
  title: string;
}

export function MobileEvidenceCaptureSheet({
  open,
  onClose,
  onCreated,
  curriculumDocumentId,
  operationalRecordId,
  storyOptions = [],
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  curriculumDocumentId?: number | null;
  operationalRecordId?: number | null;
  storyOptions?: StoryOption[];
}) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [programme, setProgramme] = useState<"PYP" | "MYP" | "DP">("PYP");
  const [selectedStoryId, setSelectedStoryId] = useState<number | "">("");
  const [files, setFiles] = useState<File[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const draftId = useMemo(() => `mobile-evidence-${Date.now()}`, [open]);

  async function handleSubmit() {
    if (!title.trim()) {
      setStatusMessage("Add a short evidence title before saving.");
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    const payload = {
      programme,
      title: title.trim(),
      summary: summary.trim(),
      next_action: "Review or publish from mobile capture.",
      curriculum_document_id: curriculumDocumentId,
      ib_operational_record_id: operationalRecordId,
      metadata: {
        capture_mode: files.length > 0 ? "camera_upload" : "quick_note",
        story_id: selectedStoryId || null,
      },
    };

    try {
      const createdItem =
        files.length === 0
          ? await createIbEvidenceItem(payload)
          : await (async () => {
              const formData = new FormData();
              formData.append("ib_evidence_item[programme]", programme);
              formData.append("ib_evidence_item[title]", title.trim());
              formData.append("ib_evidence_item[summary]", summary.trim());
              formData.append(
                "ib_evidence_item[next_action]",
                "Review or publish from mobile capture.",
              );
              formData.append("ib_evidence_item[metadata][capture_mode]", "camera_upload");
              if (selectedStoryId) {
                formData.append("ib_evidence_item[metadata][story_id]", String(selectedStoryId));
              }
              if (curriculumDocumentId) {
                formData.append(
                  "ib_evidence_item[curriculum_document_id]",
                  String(curriculumDocumentId),
                );
              }
              if (operationalRecordId) {
                formData.append(
                  "ib_evidence_item[ib_operational_record_id]",
                  String(operationalRecordId),
                );
              }
              files.forEach((file) => formData.append("ib_evidence_item[attachments][]", file));
              return createIbEvidenceItem(formData);
            })();

      if (selectedStoryId) {
        await linkIbEvidenceItemToStory(createdItem.id, Number(selectedStoryId));
      }

      removeMobileDraft(draftId);
      void saveIbMobileSyncDiagnostic({
        workflow_key: "evidence_capture",
        status: "healthy",
        queue_depth: 0,
        diagnostics: { capture_mode: files.length > 0 ? "camera_upload" : "quick_note" },
      });
      setTitle("");
      setSummary("");
      setFiles([]);
      setSelectedStoryId("");
      onCreated?.();
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        recordMobileConflict({
          id: draftId,
          title: title.trim() || "Mobile evidence draft",
          detail: error.message,
          createdAt: new Date().toISOString(),
        });
      } else if (files.length === 0) {
        enqueueMutation({
          url: "/api/v1/ib/evidence_items",
          method: "POST",
          body: JSON.stringify({ ib_evidence_item: payload }),
          revalidateKeys: ["/api/v1/ib/evidence_items"],
        });
      } else {
        upsertMobileDraft({
          id: draftId,
          title: title.trim() || "Mobile evidence draft",
          summary: summary.trim(),
          programme,
          attachmentNames: files.map((file) => file.name),
          curriculumDocumentId,
          operationalRecordId,
          storyId: selectedStoryId || null,
          status: "attachment_retry",
          createdAt: new Date().toISOString(),
        });
      }

      void saveIbMobileSyncDiagnostic({
        workflow_key: "evidence_capture",
        status: files.length > 0 ? "degraded" : "offline",
        queue_depth: files.length > 0 ? 1 : 0,
        failure_payload: {
          error: error instanceof Error ? error.message : "Unknown mobile capture error",
          attachment_count: files.length,
        },
      });
      setStatusMessage(
        files.length > 0
          ? "Draft saved for attachment retry. Re-open this capture on the same device session to resend files."
          : "Queued for sync when the connection returns.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Drawer
      open={open}
      title="Mobile evidence capture"
      description="Capture one observation, tag it, and keep it attached to the right IB context."
      onClose={onClose}
    >
      <div className="space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Observation or artifact title"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Summary
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="What happened and why it matters"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Programme
            <select
              value={programme}
              onChange={(event) => setProgramme(event.target.value as "PYP" | "MYP" | "DP")}
              className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            >
              <option value="PYP">PYP</option>
              <option value="MYP">MYP</option>
              <option value="DP">DP</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Story route
            <select
              value={selectedStoryId}
              onChange={(event) =>
                setSelectedStoryId(event.target.value ? Number(event.target.value) : "")
              }
              className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            >
              <option value="">Keep in evidence inbox</option>
              {storyOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-sm font-medium text-slate-700">
          Attachments
          <input
            aria-label="Evidence attachments"
            type="file"
            multiple
            accept="image/*,application/pdf,video/mp4,audio/mpeg"
            onChange={(event) => setFiles(Array.from(event.target.files || []))}
            className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />
          {files.length > 0 ? (
            <p className="mt-2 text-xs text-slate-500">
              {files.length} attachment(s) queued for upload.
            </p>
          ) : null}
        </label>
        {statusMessage ? (
          <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {statusMessage}
          </p>
        ) : null}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="min-h-11 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save capture"}
          </button>
        </div>
      </div>
    </Drawer>
  );
}
