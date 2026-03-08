import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LiveCollaborationPanel } from "@/features/ib/collaboration/LiveCollaborationPanel";

const {
  addToast,
  mutatePresence,
  mutateComments,
  mutateWorkbench,
  createComment,
  updateComment,
  saveTask,
  saveEvent,
} = vi.hoisted(() => ({
  addToast: vi.fn(),
  mutatePresence: vi.fn(async () => undefined),
  mutateComments: vi.fn(async () => undefined),
  mutateWorkbench: vi.fn(async () => undefined),
  createComment: vi.fn(async () => ({})),
  updateComment: vi.fn(async () => ({})),
  saveTask: vi.fn(async () => ({})),
  saveEvent: vi.fn(async () => ({})),
}));

vi.mock("@k12/ui", async () => {
  const actual = await vi.importActual<typeof import("@k12/ui")>("@k12/ui");
  return {
    ...actual,
    useToast: () => ({ addToast }),
  };
});

vi.mock("@/features/ib/data", () => ({
  useIbCollaborationSessions: () => ({
    data: {
      activeSessions: [
        {
          id: 1,
          userId: 9,
          userLabel: "Casey Reviewer",
          role: "editor",
          scopeType: "section",
          scopeKey: "central_idea",
          status: "active",
          deviceLabel: "web",
          lastSeenAt: new Date().toISOString(),
          expiresAt: null,
          editingSameScope: true,
          heartbeatAgeSeconds: 3,
          metadata: {},
        },
      ],
      channelTopology: [{ key: "presence", scope: "document", transport: "polling", auth: "show" }],
      concurrencyPolicy: { merge_strategy: "Show conflicts, then replay." },
      softLocks: [
        {
          scopeKey: "central_idea",
          ownerUserIds: [9],
          ownerLabels: ["Casey Reviewer"],
          contested: false,
          sessionIds: [1],
        },
      ],
      conflictRisk: false,
      updatedAt: new Date().toISOString(),
    },
    mutate: mutatePresence,
  }),
  useIbDocumentComments: () => ({
    data: [
      {
        id: 11,
        authorId: 3,
        authorLabel: "Taylor Teacher",
        commentType: "suggestion",
        status: "open",
        visibility: "internal",
        anchorPath: "central_idea",
        body: "Tighten the central idea wording.",
        parentCommentId: null,
        resolvedAt: null,
        metadata: { diff: { field: "central_idea" } },
        replyCount: 1,
        replies: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    mutate: mutateComments,
  }),
  createIbDocumentComment: createComment,
  updateIbDocumentComment: updateComment,
}));

vi.mock("@/features/ib/phase9/data", () => ({
  useIbCollaborationWorkbench: () => ({
    data: {
      suggestions: [
        {
          id: 11,
          body: "Tighten the central idea wording.",
          status: "open",
          anchorPath: "central_idea",
          authorLabel: "Taylor Teacher",
          replyCount: 1,
          metadata: { diff: { field: "central_idea" } },
          updatedAt: new Date().toISOString(),
        },
      ],
    },
    mutate: mutateWorkbench,
  }),
  saveIbCollaborationTask: saveTask,
  saveIbCollaborationEvent: saveEvent,
}));

describe("LiveCollaborationPanel", () => {
  beforeEach(() => {
    addToast.mockReset();
    mutatePresence.mockClear();
    mutateComments.mockClear();
    mutateWorkbench.mockClear();
    createComment.mockClear();
    updateComment.mockClear();
    saveTask.mockClear();
    saveEvent.mockClear();
  });

  it("creates comments, handoffs, and replay events", async () => {
    render(<LiveCollaborationPanel documentId={42} scopeKey="central_idea" />);

    fireEvent.change(screen.getByPlaceholderText("Add a note or reflection"), {
      target: { value: "Please refine this section." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Comment" }));

    await waitFor(() => {
      expect(createComment).toHaveBeenCalledWith(
        42,
        expect.objectContaining({
          comment_type: "general",
          anchor_path: "central_idea",
          body: "Please refine this section.",
        }),
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Create handoff" }));
    await waitFor(() => {
      expect(saveTask).toHaveBeenCalledWith(
        expect.objectContaining({
          curriculum_document_id: 42,
          section_key: "central_idea",
        }),
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Replay marker" }));
    await waitFor(() => {
      expect(saveEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          curriculum_document_id: 42,
          scope_key: "central_idea",
          event_name: "replay_event",
        }),
      );
    });
  });

  it("resolves suggestions from the panel", async () => {
    render(<LiveCollaborationPanel documentId={42} scopeKey="central_idea" />);

    fireEvent.click(screen.getByRole("button", { name: "Accept" }));

    await waitFor(() => {
      expect(updateComment).toHaveBeenCalledWith(
        11,
        expect.objectContaining({
          status: "resolved",
          metadata: expect.objectContaining({ resolution_state: "accepted" }),
        }),
      );
    });
  });
});
