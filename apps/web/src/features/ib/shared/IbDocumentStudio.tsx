"use client";

import { PresenceStack } from "@k12/ui";
import { useCurriculumDocument } from "@/curriculum/documents/hooks";
import DocumentEditor from "@/curriculum/documents/DocumentEditor";
import {
  useIbCollaborationSessions,
  useIbDocumentCollaborators,
  useIbDocumentComments,
} from "@/features/ib/data";
import { LiveCollaborationPanel } from "@/features/ib/collaboration/LiveCollaborationPanel";
import { IbSurfaceState } from "@/features/ib/core/IbSurfaceState";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

interface IbDocumentStudioProps {
  documentId: string;
  programme: "PYP" | "MYP" | "DP";
  title: string;
  description: string;
}

export function IbDocumentStudio({
  documentId,
  programme,
  title,
  description,
}: IbDocumentStudioProps) {
  const numericId = Number(documentId);
  const { data: document, isLoading } = useCurriculumDocument(
    Number.isNaN(numericId) ? null : numericId,
  );
  const { data: comments = [] } = useIbDocumentComments(Number.isNaN(numericId) ? null : numericId);
  const { data: collaborators = [] } = useIbDocumentCollaborators(
    Number.isNaN(numericId) ? null : numericId,
  );
  const { data: collaboration } = useIbCollaborationSessions(
    Number.isNaN(numericId) ? null : numericId,
  );

  if (isLoading || !document) {
    return <IbSurfaceState status="loading" ready={null} />;
  }

  const content =
    document.current_version?.content && typeof document.current_version.content === "object"
      ? (document.current_version.content as Record<string, unknown>)
      : {};
  const nonEmptyFields = Object.values(content).filter((value) => {
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === "object")
      return Object.keys(value as Record<string, unknown>).length > 0;
    return value !== null && value !== undefined;
  }).length;

  return (
    <IbWorkspaceScaffold
      title={`${title} • ${document.title}`}
      description={description}
      badges={
        <>
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
            {programme}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {document.status}
          </span>
        </>
      }
      actions={
        <PresenceStack
          people={
            collaboration?.activeSessions.length
              ? collaboration.activeSessions.slice(0, 5).map((session) => ({
                  id: String(session.id),
                  name: session.userLabel || `User #${session.userId}`,
                }))
              : collaborators.slice(0, 5).map((collaborator) => ({
                  id: String(collaborator.id),
                  name: `${collaborator.role.replace(/_/g, " ")} #${collaborator.userId}`,
                }))
          }
        />
      }
      metrics={[
        {
          label: "Schema",
          value: document.schema_key,
          detail: "Pack-driven field layout",
          tone: "accent",
        },
        {
          label: "Filled fields",
          value: String(nonEmptyFields),
          detail: "Current version content density",
          tone: "success",
        },
        {
          label: "Comments",
          value: String(comments.length),
          detail: "Anchored review and collaboration notes",
          tone: "warm",
        },
        {
          label: "Live editors",
          value: String(collaboration?.activeSessions.length || 0),
          detail: collaboration?.conflictRisk ? "Conflict watch is active" : "Presence is healthy",
          tone: collaboration?.conflictRisk ? "warm" : "success",
        },
        {
          label: "Collaborators",
          value: String(collaborators.length),
          detail: "Shared ownership is visible in-context",
        },
      ]}
      main={<DocumentEditor documentId={document.id} />}
      aside={
        <div className="space-y-5">
          <LiveCollaborationPanel documentId={document.id} scopeKey="root" />
          <WorkspacePanel
            title="Contributor roles"
            description="Ownership, specialist input, review, and advisor roles remain explicit."
          >
            <ul className="space-y-2 text-sm text-slate-600">
              {collaborators.length > 0 ? (
                collaborators.map((collaborator) => (
                  <li key={collaborator.id} className="rounded-2xl bg-slate-50 px-3 py-2">
                    User #{collaborator.userId} • {collaborator.role.replace(/_/g, " ")} •{" "}
                    {collaborator.contributionMode}
                  </li>
                ))
              ) : (
                <li className="rounded-2xl bg-slate-50 px-3 py-2">
                  No collaborators assigned yet.
                </li>
              )}
            </ul>
          </WorkspacePanel>
        </div>
      }
    />
  );
}
