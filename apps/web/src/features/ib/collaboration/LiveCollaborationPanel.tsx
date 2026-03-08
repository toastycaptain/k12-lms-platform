"use client";

import { useMemo, useState } from "react";
import { Button, CommentThread, PresenceStack, useToast } from "@k12/ui";
import {
  createIbDocumentComment,
  updateIbDocumentComment,
  useIbCollaborationSessions,
  useIbDocumentComments,
  type IbComment,
} from "@/features/ib/data";
import {
  saveIbCollaborationEvent,
  saveIbCollaborationTask,
  useIbCollaborationWorkbench,
} from "@/features/ib/phase9/data";
import { WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

function fallbackSuggestion(suggestion: {
  id: number;
  body: string;
  status: string;
  anchorPath?: string | null;
  metadata: Record<string, unknown>;
  replyCount: number;
  updatedAt: string;
}): IbComment {
  return {
    id: suggestion.id,
    authorId: 0,
    authorLabel: null,
    commentType: "suggestion",
    status: suggestion.status,
    visibility: "internal",
    anchorPath: suggestion.anchorPath,
    body: suggestion.body,
    parentCommentId: null,
    resolvedAt: null,
    metadata: suggestion.metadata,
    replyCount: suggestion.replyCount,
    replies: [],
    createdAt: suggestion.updatedAt,
    updatedAt: suggestion.updatedAt,
  };
}

export function LiveCollaborationPanel({
  documentId,
  scopeKey,
}: {
  documentId: number;
  scopeKey: string;
}) {
  const { addToast } = useToast();
  const { data: presence, mutate: mutatePresence } = useIbCollaborationSessions(documentId);
  const { data: comments = [], mutate: mutateComments } = useIbDocumentComments(documentId);
  const { data: workbench, mutate: mutateWorkbench } = useIbCollaborationWorkbench(documentId);
  const [busy, setBusy] = useState<"comment" | "suggestion" | "task" | "event" | null>(null);

  const topLevelComments = useMemo(
    () => comments.filter((comment) => !comment.parentCommentId).slice(0, 6),
    [comments],
  );

  async function refresh() {
    await Promise.all([mutatePresence(), mutateComments(), mutateWorkbench()]);
  }

  async function addComment(body: string, commentType: "general" | "suggestion" = "general") {
    setBusy(commentType === "suggestion" ? "suggestion" : "comment");
    try {
      await createIbDocumentComment(documentId, {
        comment_type: commentType,
        visibility: "internal",
        anchor_path: scopeKey,
        body,
        metadata:
          commentType === "suggestion"
            ? { diff: { field: scopeKey, resolution_state: "pending" } }
            : { source: "live_collaboration_panel" },
      });
      await refresh();
      addToast("success", commentType === "suggestion" ? "Suggestion added." : "Comment added.");
    } catch (error) {
      addToast("error", error instanceof Error ? error.message : "Unable to add comment.");
    } finally {
      setBusy(null);
    }
  }

  async function resolveSuggestion(comment: IbComment, resolution: "accepted" | "rejected") {
    try {
      await updateIbDocumentComment(comment.id, {
        status: "resolved",
        metadata: {
          ...comment.metadata,
          resolution_state: resolution,
          resolved_scope_key: scopeKey,
        },
      });
      await refresh();
      addToast("success", `Suggestion ${resolution}.`);
    } catch (error) {
      addToast("error", error instanceof Error ? error.message : "Unable to update suggestion.");
    }
  }

  async function createTask() {
    setBusy("task");
    try {
      await saveIbCollaborationTask({
        curriculum_document_id: documentId,
        title: `Follow up on ${scopeKey}`,
        detail: "Review the latest suggestion or comment thread and hand off if needed.",
        section_key: scopeKey,
        priority: "medium",
      });
      await refresh();
      addToast("success", "Follow-up task created.");
    } catch (error) {
      addToast("error", error instanceof Error ? error.message : "Unable to create task.");
    } finally {
      setBusy(null);
    }
  }

  async function recordReplay() {
    setBusy("event");
    try {
      await saveIbCollaborationEvent({
        curriculum_document_id: documentId,
        event_name: "replay_event",
        route_id: "ib.document_studio",
        scope_key: scopeKey,
        section_key: scopeKey,
        durable: true,
        payload: { summary: `Replay marker added for ${scopeKey}` },
      });
      await refresh();
      addToast("success", "Replay marker recorded.");
    } catch (error) {
      addToast("error", error instanceof Error ? error.message : "Unable to record replay marker.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <WorkspacePanel
        title="Live collaboration"
        description="Presence, soft locks, suggestions, tasks, and replay events stay attached to the active document."
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <PresenceStack
              people={(presence?.activeSessions || []).slice(0, 6).map((session) => ({
                id: String(session.id),
                name: session.userLabel || `User #${session.userId}`,
              }))}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => void addComment(`Suggestion for ${scopeKey}`, "suggestion")}
                disabled={busy !== null}
              >
                {busy === "suggestion" ? "Saving..." : "Add suggestion"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => void createTask()}
                disabled={busy !== null}
              >
                {busy === "task" ? "Creating..." : "Create handoff"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => void recordReplay()}
                disabled={busy !== null}
              >
                {busy === "event" ? "Recording..." : "Replay marker"}
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
              <p className="font-semibold text-slate-950">Scope focus</p>
              <p className="mt-2">{scopeKey}</p>
              <p className="mt-1 text-xs text-slate-500">
                {presence?.concurrencyPolicy.merge_strategy || "Merge policy unavailable."}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
              <p className="font-semibold text-slate-950">Soft locks</p>
              {presence?.softLocks.length ? (
                presence.softLocks.slice(0, 3).map((lock) => (
                  <p key={lock.scopeKey} className="mt-2">
                    <span className="font-medium text-slate-900">{lock.scopeKey}</span>:{" "}
                    {lock.ownerLabels.join(", ")}
                    {lock.contested ? " (contested)" : ""}
                  </p>
                ))
              ) : (
                <p className="mt-2">No active soft locks.</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {(workbench?.suggestions || []).slice(0, 3).map((suggestion) => {
              const sourceComment =
                comments.find((comment) => comment.id === suggestion.id) ||
                fallbackSuggestion(suggestion);

              return (
                <div
                  key={suggestion.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {suggestion.authorLabel}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">{suggestion.body}</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-900">
                      {suggestion.status}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void resolveSuggestion(sourceComment, "accepted")}
                      className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => void resolveSuggestion(sourceComment, "rejected")}
                      className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-900"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </WorkspacePanel>

      <WorkspacePanel
        title="Discussion thread"
        description="Comments remain anchored to the live section while replay and follow-up stay visible."
      >
        <CommentThread
          comments={topLevelComments.map((comment) => ({
            id: String(comment.id),
            author: comment.authorLabel || `User #${comment.authorId}`,
            body:
              comment.replyCount > 0
                ? `${comment.body}\n${comment.replyCount} repl${comment.replyCount === 1 ? "y" : "ies"}`
                : comment.body,
            timestamp: comment.createdAt
              ? new Date(comment.createdAt).toLocaleString()
              : "Just now",
          }))}
          onSubmit={(body) => {
            void addComment(body, "general");
          }}
        />
      </WorkspacePanel>
    </div>
  );
}
