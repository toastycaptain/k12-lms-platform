"use client";

import { useMemo, useState } from "react";
import { Button, Modal, TextArea, useToast } from "@k12/ui";
import { apiFetch, ApiError } from "@/lib/api";
import type { WorkflowEvent } from "@/curriculum/workflow/types";

interface WorkflowActionsProps {
  documentId: number;
  events: WorkflowEvent[];
  onTransitionComplete: () => Promise<void> | void;
}

export default function WorkflowActions({
  documentId,
  events,
  onTransitionComplete,
}: WorkflowActionsProps) {
  const { addToast } = useToast();
  const [activeEvent, setActiveEvent] = useState<WorkflowEvent | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const visibleEvents = useMemo(() => events.filter((event) => event.label), [events]);

  async function submit(event: WorkflowEvent): Promise<void> {
    setSubmitting(true);
    setInlineError(null);

    try {
      await apiFetch(`/api/v1/curriculum_documents/${documentId}/transition`, {
        method: "POST",
        body: JSON.stringify({
          event: event.event,
          comment: comment || undefined,
        }),
      });
      addToast("success", `${event.label} complete.`);
      setActiveEvent(null);
      setComment("");
      await onTransitionComplete();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to transition document.";
      setInlineError(message);
      addToast("error", message);
    } finally {
      setSubmitting(false);
    }
  }

  if (visibleEvents.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {visibleEvents.map((event) => (
          <Button key={event.event} variant="secondary" onClick={() => setActiveEvent(event)}>
            {event.label}
          </Button>
        ))}
      </div>
      <Modal
        open={Boolean(activeEvent)}
        title={activeEvent?.label || "Transition document"}
        onClose={() => {
          setActiveEvent(null);
          setComment("");
          setInlineError(null);
        }}
      >
        <div className="space-y-4">
          {activeEvent?.confirm && <p className="text-sm text-gray-700">{activeEvent.confirm}</p>}
          {activeEvent?.requires_comment && (
            <div className="space-y-1.5">
              <label htmlFor="workflow-comment" className="text-sm font-medium text-gray-700">
                {activeEvent.comment_label || "Comment"}
              </label>
              <TextArea
                id="workflow-comment"
                rows={4}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                error={Boolean(inlineError)}
              />
            </div>
          )}
          {inlineError && <p className="text-sm text-red-600">{inlineError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setActiveEvent(null)}>
              Cancel
            </Button>
            {activeEvent && (
              <Button
                onClick={() => void submit(activeEvent)}
                disabled={submitting || (activeEvent.requires_comment && !comment.trim())}
              >
                {submitting ? "Working..." : activeEvent.label}
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
