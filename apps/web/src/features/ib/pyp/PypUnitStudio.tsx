"use client";

import { VirtualDataGrid } from "@k12/ui";
import {
  useIbEvidenceItems,
  useIbLearningStories,
  useIbOperationalRecords,
} from "@/features/ib/data";
import { IbSurfaceState } from "@/features/ib/core/IbSurfaceState";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";
import { IbDocumentStudio } from "@/features/ib/shared/IbDocumentStudio";

export function FamilyWindowCard({ documentId }: { documentId?: string }) {
  const { data } = useIbLearningStories(documentId ? { curriculum_document_id: documentId } : {});
  const story = data?.[0] || null;

  return (
    <WorkspacePanel
      title="Family window"
      description="Family-facing narrative and support prompts are backed by live story records."
    >
      {story ? (
        <div className="space-y-3 text-sm text-slate-600">
          <div className="rounded-3xl bg-slate-50 p-4">{story.summary}</div>
          <div className="rounded-3xl bg-slate-50 p-4">Home prompt: {story.supportPrompt}</div>
          <div className="rounded-3xl bg-slate-50 p-4">Cadence: {story.cadence}</div>
        </div>
      ) : (
        <p className="text-sm text-slate-600">No family window story is linked yet.</p>
      )}
    </WorkspacePanel>
  );
}

export function PypWeeklyFlow({ documentId }: { documentId?: string }) {
  const { data } = useIbOperationalRecords({ record_family: "pyp_weekly_flow" });
  const rows = (data || []).filter(
    (record) => !documentId || record.routeHint?.includes(documentId),
  );

  if (!data) {
    return <IbSurfaceState status="loading" ready={null} />;
  }

  return (
    <VirtualDataGrid
      columns={[
        { key: "title", header: "Week" },
        { key: "summary", header: "Focus" },
        { key: "nextAction", header: "Next action" },
      ]}
      rows={rows.map((row) => ({
        title: row.title,
        summary: row.summary || "No focus captured yet.",
        nextAction: row.nextAction || "Add the next evidence or family signal.",
      }))}
    />
  );
}

export function PypActionPanel({ documentId }: { documentId?: string }) {
  const { data } = useIbEvidenceItems(documentId ? { curriculum_document_id: documentId } : {});
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[
        ["Evidence items", String(data?.length || 0)],
        ["Validated", String((data || []).filter((item) => item.status === "validated").length)],
        [
          "Family-ready",
          String((data || []).filter((item) => item.visibility === "family_ready").length),
        ],
      ].map(([title, detail]) => (
        <div
          key={title}
          className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm"
        >
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-2 text-sm text-slate-600">{detail}</p>
        </div>
      ))}
    </div>
  );
}

export function PypExhibitionWorkspace() {
  const { data } = useIbOperationalRecords({ record_family: "pyp_exhibition" });

  if (!data) {
    return <IbSurfaceState status="loading" ready={null} />;
  }

  return (
    <IbWorkspaceScaffold
      title="PYP exhibition workspace"
      description="Exhibition checkpoints and mentor pairings are backed by live operational records."
      metrics={[
        {
          label: "Exhibition records",
          value: String(data.length),
          detail: "Tracked as operational records",
          tone: "accent",
        },
        {
          label: "At risk",
          value: String(data.filter((record) => record.riskLevel === "risk").length),
          detail: "Need follow-up",
          tone: "warm",
        },
      ]}
      main={
        <VirtualDataGrid
          columns={[
            { key: "title", header: "Group" },
            { key: "status", header: "Status" },
            { key: "nextAction", header: "Next action" },
          ]}
          rows={data.map((record) => ({
            title: record.title,
            status: record.status,
            nextAction: record.nextAction || record.summary || "Review exhibition milestone.",
          }))}
        />
      }
      aside={<FamilyWindowCard />}
    />
  );
}

export function PypUnitStudio({ unitId }: { unitId?: string }) {
  if (!unitId) {
    return (
      <IbSurfaceState
        status="empty"
        ready={null}
        emptyTitle="No unit selected"
        emptyDescription="Open or create a PYP unit to begin."
      />
    );
  }

  return (
    <IbDocumentStudio
      documentId={unitId}
      programme="PYP"
      title="PYP unit studio"
      description="Live PYP planning, workflow, comments, versions, and related records in one studio."
    />
  );
}
