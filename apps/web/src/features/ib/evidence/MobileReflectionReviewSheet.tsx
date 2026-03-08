"use client";

import { useMemo, useState } from "react";
import { Drawer } from "@k12/ui";
import { ApiError } from "@/lib/api";
import { enqueueMutation } from "@/lib/offlineMutationQueue";
import { updateIbReflectionRequest, type IbReflectionRequestItem } from "@/features/ib/data";
import { IbAiAssistPanel } from "@/features/ib/ai/IbAiAssistPanel";
import { saveIbMobileSyncDiagnostic } from "@/features/ib/phase9/data";
import { recordMobileConflict } from "@/features/ib/mobile/mobileDraftStore";

export function MobileReflectionReviewSheet({
  open,
  requests,
  onClose,
  onUpdated,
}: {
  open: boolean;
  requests: IbReflectionRequestItem[];
  onClose: () => void;
  onUpdated?: () => void;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [responseExcerpt, setResponseExcerpt] = useState("");
  const activeRequest = useMemo(() => {
    const preferred = selectedId
      ? requests.find((request) => request.id === selectedId)
      : undefined;
    return preferred || requests[0] || null;
  }, [requests, selectedId]);

  async function submit(action: "respond" | "approve" | "cancel") {
    if (!activeRequest) {
      return;
    }

    const payload = {
      action,
      response_excerpt: responseExcerpt || activeRequest.responseExcerpt || undefined,
      metadata: { surface: "mobile_sheet" },
    };

    try {
      await updateIbReflectionRequest(activeRequest.id, payload);
      void saveIbMobileSyncDiagnostic({
        workflow_key: "approve_return",
        status: "healthy",
        queue_depth: 0,
        diagnostics: { action, reflection_request_id: activeRequest.id },
      });
      setResponseExcerpt("");
      onUpdated?.();
      if (action === "approve" || action === "cancel") {
        onClose();
      }
    } catch (error) {
      enqueueMutation({
        url: `/api/v1/ib/reflection_requests/${activeRequest.id}`,
        method: "PATCH",
        body: JSON.stringify({ ib_reflection_request: payload }),
        revalidateKeys: ["/api/v1/ib/reflection_requests", "/api/v1/ib/evidence_items"],
      });
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        recordMobileConflict({
          id: `reflection-${activeRequest.id}`,
          title: activeRequest.prompt,
          detail: error.message,
          createdAt: new Date().toISOString(),
        });
      }
      void saveIbMobileSyncDiagnostic({
        workflow_key: "approve_return",
        status: "conflicted",
        queue_depth: 1,
        failure_payload: {
          error: error instanceof Error ? error.message : "Unknown reflection review error",
          reflection_request_id: activeRequest.id,
        },
      });
    }
  }

  return (
    <Drawer
      open={open}
      title="Reflection review"
      description="Approve, return, or defer the latest student reflection without leaving the mobile queue."
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {requests.slice(0, 4).map((request) => (
            <button
              key={request.id}
              type="button"
              onClick={() => setSelectedId(request.id)}
              className={`min-h-11 rounded-full px-4 py-2 text-sm ${
                activeRequest?.id === request.id
                  ? "bg-slate-950 text-white"
                  : "border border-slate-200 bg-white text-slate-700"
              }`}
            >
              #{request.id}
            </button>
          ))}
        </div>
        {activeRequest ? (
          <>
            <div className="rounded-[1.35rem] bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Prompt
              </p>
              <p className="mt-2 text-sm text-slate-700">{activeRequest.prompt}</p>
              <p className="mt-3 text-xs text-slate-500">Status: {activeRequest.status}</p>
            </div>
            <label className="block text-sm font-medium text-slate-700">
              Response or approval note
              <textarea
                value={responseExcerpt}
                onChange={(event) => setResponseExcerpt(event.target.value)}
                placeholder={
                  activeRequest.responseExcerpt ||
                  "Capture the short approval note or return guidance."
                }
                className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              />
            </label>
            <div className="grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => void submit("respond")}
                className="min-h-11 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Mark responded
              </button>
              <button
                type="button"
                onClick={() => void submit("approve")}
                className="min-h-11 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => void submit("cancel")}
                className="min-h-11 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Cancel
              </button>
            </div>
            <IbAiAssistPanel
              title="AI reflection assist"
              description="Draft a teacher-review summary without approving or returning the reflection automatically."
              compact
              taskOptions={[
                {
                  taskType: "ib_reflection_summary",
                  label: "Reflection summary",
                  description:
                    "Condense the reflection into a shorter excerpt teachers can review before acting.",
                  mode: "diff",
                  promptSeed: "Summarize the reflection faithfully and keep uncertainty explicit.",
                  targetFields: [
                    {
                      field: "response_excerpt",
                      label: "Response excerpt",
                      currentValue: responseExcerpt || activeRequest.responseExcerpt || "",
                    },
                  ],
                  applyTarget: { type: "IbReflectionRequest", id: activeRequest.id },
                  context: {
                    workflow: "reflection_review",
                    reflection_prompt: activeRequest.prompt,
                    reflection_response: responseExcerpt || activeRequest.responseExcerpt || "",
                    source_text: responseExcerpt || activeRequest.responseExcerpt || "",
                    grounding_refs: [
                      {
                        type: "reflection_response",
                        label: "Student reflection",
                        excerpt: responseExcerpt || activeRequest.responseExcerpt || "",
                      },
                    ].filter((ref) => ref.excerpt),
                    target_fields: [{ field: "response_excerpt", label: "Response excerpt" }],
                    current_values: {
                      response_excerpt: responseExcerpt || activeRequest.responseExcerpt || "",
                    },
                  },
                  onApply: async (changes) => {
                    setResponseExcerpt(changes.response_excerpt || "");
                  },
                },
              ]}
            />
          </>
        ) : (
          <p className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-600">
            No reflection requests are waiting right now.
          </p>
        )}
      </div>
    </Drawer>
  );
}
