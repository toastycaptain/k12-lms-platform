"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, VirtualDataGrid, useToast } from "@k12/ui";
import DocumentEditor from "@/curriculum/documents/DocumentEditor";
import { useCurriculumDocument } from "@/curriculum/documents/hooks";
import {
  createIbOperationalRecord,
  useIbOperationalRecords,
  type IbOperationalRecord,
} from "@/features/ib/data";
import { IbSurfaceState } from "@/features/ib/core/IbSurfaceState";
import { IB_CANONICAL_ROUTES } from "@/features/ib/core/route-registry";
import { IbOperationalRecordWorkspace } from "@/features/ib/shared/IbOperationalRecordWorkspace";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";
import { reportInteractionMetric } from "@/lib/performance";

function stringList(content: Record<string, unknown>, key: string): string[] {
  return Array.isArray(content[key]) ? (content[key] as unknown[]).map(String).filter(Boolean) : [];
}

function recordHref(record: IbOperationalRecord): string {
  if (record.routeHint) return record.routeHint;
  if (record.recordFamily === "dp_ia") return IB_CANONICAL_ROUTES.dpInternalAssessment(record.id);
  if (record.recordFamily === "dp_ee") return IB_CANONICAL_ROUTES.dpEe(record.id);
  if (record.recordFamily === "dp_tok") return IB_CANONICAL_ROUTES.dpTok(record.id);
  if (record.recordFamily === "dp_cas") return IB_CANONICAL_ROUTES.dpCasRecord(record.id);
  return IB_CANONICAL_ROUTES.dpCoordinator;
}

function checkpointsFor(family: "dp_ia" | "dp_ee" | "dp_tok" | "dp_cas") {
  switch (family) {
    case "dp_ia":
      return [
        { title: "Proposal", status: "pending", summary: "Define the IA scope and question." },
        { title: "Draft", status: "pending", summary: "Review the current draft and evidence." },
        {
          title: "Authenticity review",
          status: "pending",
          summary: "Confirm authenticity and citation checks.",
        },
        { title: "Submission", status: "pending", summary: "Prepare final submission." },
      ];
    case "dp_ee":
      return [
        {
          title: "Research question",
          status: "pending",
          summary: "Confirm the research question.",
        },
        {
          title: "Supervisor meeting",
          status: "pending",
          summary: "Log the next supervision meeting.",
        },
        { title: "Draft review", status: "pending", summary: "Review the draft and feedback." },
        {
          title: "Reflection and viva",
          status: "pending",
          summary: "Complete the final reflection checkpoint.",
        },
      ];
    case "dp_tok":
      return [
        {
          title: "Prompt and objects",
          status: "pending",
          summary: "Confirm the exhibition or essay prompt.",
        },
        {
          title: "Teacher feedback",
          status: "pending",
          summary: "Respond to the next TOK feedback cycle.",
        },
        { title: "Submission", status: "pending", summary: "Prepare the final TOK submission." },
      ];
    default:
      return [
        {
          title: "Plan experience",
          status: "pending",
          summary: "Create the CAS experience or project plan.",
        },
        { title: "Reflection", status: "pending", summary: "Complete the next reflection." },
        {
          title: "Advisor review",
          status: "pending",
          summary: "Move the record through advisor review.",
        },
      ];
  }
}

async function createDpRecord({
  planningContextId,
  curriculumDocumentId,
  family,
  title,
}: {
  planningContextId: number;
  curriculumDocumentId?: number;
  family: "dp_ia" | "dp_ee" | "dp_tok" | "dp_cas";
  title: string;
}) {
  const response = await createIbOperationalRecord({
    programme: "DP",
    planning_context_id: planningContextId,
    curriculum_document_id: curriculumDocumentId,
    record_family: family,
    subtype: family === "dp_cas" ? "cas_experience" : family.replace(/^dp_/, ""),
    title,
    status: "open",
    priority: family === "dp_ia" ? "high" : "normal",
    risk_level: "healthy",
    summary:
      family === "dp_ia"
        ? "Track teacher, student, and authenticity checkpoints in one live IA record."
        : family === "dp_ee"
          ? "Supervisor notes and milestone state stay on the same EE record."
          : family === "dp_tok"
            ? "TOK checkpoints, feedback, and next actions stay visible on one route."
            : "CAS experience, reflection, and advisor review stay attached to one record.",
    next_action:
      family === "dp_ia"
        ? "Define the next IA checkpoint."
        : family === "dp_ee"
          ? "Schedule the next supervision step."
          : family === "dp_tok"
            ? "Capture the next TOK feedback loop."
            : "Capture the next reflection or advisor review.",
    metadata: {
      guardian_visible: family === "dp_cas",
      guardian_prompt:
        family === "dp_cas"
          ? "Ask what growth the CAS experience is building right now."
          : undefined,
    },
    checkpoints: checkpointsFor(family),
  });

  reportInteractionMetric(`ib_${family}_created`, 1, {
    context: curriculumDocumentId ? "course_map" : "overview",
  });

  return response;
}

function DpRecordOverview({
  title,
  description,
  family,
}: {
  title: string;
  description: string;
  family: "dp_ee" | "dp_tok" | "dp_cas";
}) {
  const router = useRouter();
  const { addToast } = useToast();
  const { data: records = [] } = useIbOperationalRecords({
    programme: "DP",
    record_family: family,
  });
  const [creating, setCreating] = useState(false);

  async function handleCreate(): Promise<void> {
    const planningContextId = records[0]?.planningContextId;
    if (!planningContextId) {
      addToast(
        "error",
        "Create or open a DP course map first so this record has planning context.",
      );
      return;
    }

    setCreating(true);
    try {
      const created = await createDpRecord({
        planningContextId,
        family,
        title:
          family === "dp_ee"
            ? "New Extended Essay"
            : family === "dp_tok"
              ? "New TOK record"
              : "New CAS record",
      });
      router.push(
        recordHref({
          id: Number(created.id),
          programme: "DP",
          planningContextId,
          curriculumDocumentId: null,
          studentId: null,
          ownerId: null,
          advisorId: null,
          recordFamily: family,
          subtype: family.replace(/^dp_/, ""),
          status: "open",
          priority: "normal",
          riskLevel: "healthy",
          dueOn: null,
          title: String(created.title || title),
          summary: null,
          nextAction: null,
          routeHint: null,
          href:
            family === "dp_ee"
              ? IB_CANONICAL_ROUTES.dpEe(created.id as string | number)
              : family === "dp_tok"
                ? IB_CANONICAL_ROUTES.dpTok(created.id as string | number)
                : IB_CANONICAL_ROUTES.dpCasRecord(created.id as string | number),
          metadata: {},
          curriculumDocumentTitle: null,
          studentName: null,
          ownerName: null,
          advisorName: null,
          checkpoints: [],
        }),
      );
    } catch {
      addToast("error", "Unable to create the DP record.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <WorkspacePanel title={title} description={description}>
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => void handleCreate()} disabled={creating}>
            {creating ? "Creating..." : `New ${title}`}
          </Button>
        </div>
        <div className="space-y-3">
          {records.length > 0 ? (
            records.map((record) => (
              <Link
                key={record.id}
                href={recordHref(record)}
                className="block rounded-3xl bg-slate-50 p-4 text-sm text-slate-700"
              >
                <p className="font-semibold text-slate-950">{record.title}</p>
                <p className="mt-2">
                  {record.nextAction || record.summary || "Review the next checkpoint."}
                </p>
              </Link>
            ))
          ) : (
            <p className="text-sm text-slate-600">No live records yet.</p>
          )}
        </div>
      </div>
    </WorkspacePanel>
  );
}

export function DpCourseMap({ courseId }: { courseId?: string }) {
  const router = useRouter();
  const { addToast } = useToast();
  const numericId = Number(courseId);
  const { data: document, isLoading } = useCurriculumDocument(
    Number.isNaN(numericId) ? null : numericId,
  );
  const { data: linkedRecords = [] } = useIbOperationalRecords(
    document ? { programme: "DP", planning_context_id: document.planning_context_id } : {},
  );
  const [creating, setCreating] = useState<"dp_ia" | "dp_ee" | "dp_tok" | "dp_cas" | null>(null);

  const content =
    document?.current_version?.content && typeof document.current_version.content === "object"
      ? (document.current_version.content as Record<string, unknown>)
      : {};
  const sequenceOverview = stringList(content, "sequence_overview");
  const assessmentWindows = stringList(content, "assessment_windows");
  const coreTouchpoints = stringList(content, "core_touchpoints");

  async function handleCreate(family: "dp_ia" | "dp_ee" | "dp_tok" | "dp_cas"): Promise<void> {
    if (!document) {
      addToast("error", "Create the course map first.");
      return;
    }

    setCreating(family);
    try {
      const created = await createDpRecord({
        planningContextId: document.planning_context_id,
        curriculumDocumentId: document.id,
        family,
        title:
          family === "dp_ia"
            ? `${document.title} IA`
            : family === "dp_ee"
              ? `${document.title} Extended Essay`
              : family === "dp_tok"
                ? `${document.title} TOK`
                : `${document.title} CAS`,
      });
      router.push(
        family === "dp_ia"
          ? IB_CANONICAL_ROUTES.dpInternalAssessment(Number(created.id))
          : family === "dp_ee"
            ? IB_CANONICAL_ROUTES.dpEe(Number(created.id))
            : family === "dp_tok"
              ? IB_CANONICAL_ROUTES.dpTok(Number(created.id))
              : IB_CANONICAL_ROUTES.dpCasRecord(Number(created.id)),
      );
    } catch {
      addToast("error", "Unable to create the DP record.");
    } finally {
      setCreating(null);
    }
  }

  if (!courseId || courseId === "new") {
    return (
      <IbWorkspaceScaffold
        title="DP course map"
        description="Create or open a DP course record to begin managing live sequencing and assessment windows."
        main={
          <WorkspacePanel
            title="Next step"
            description="Use the DP course creation flow from IB planning to create the first live course map."
          >
            <Link
              href="/ib/dp/course-maps/new"
              className="text-sm font-semibold text-slate-900 underline-offset-4 hover:underline"
            >
              Create a DP course map
            </Link>
          </WorkspacePanel>
        }
      />
    );
  }

  if (isLoading || !document) {
    return <IbSurfaceState status="loading" ready={null} />;
  }

  return (
    <IbWorkspaceScaffold
      title={`DP course map • ${document.title}`}
      description="Two-year sequencing, IA windows, and core touchpoints stay in one versioned teaching workspace."
      badges={
        <>
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
            DP
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {document.status}
          </span>
        </>
      }
      actions={
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void handleCreate("dp_ia")} disabled={creating !== null}>
            {creating === "dp_ia" ? "Creating..." : "New IA"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => void handleCreate("dp_ee")}
            disabled={creating !== null}
          >
            {creating === "dp_ee" ? "Creating..." : "New EE"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => void handleCreate("dp_tok")}
            disabled={creating !== null}
          >
            {creating === "dp_tok" ? "Creating..." : "New TOK"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => void handleCreate("dp_cas")}
            disabled={creating !== null}
          >
            {creating === "dp_cas" ? "Creating..." : "New CAS"}
          </Button>
        </div>
      }
      metrics={[
        {
          label: "Sequence items",
          value: String(sequenceOverview.length),
          detail: "Mapped teaching progression",
          tone: sequenceOverview.length > 0 ? "accent" : "warm",
        },
        {
          label: "Assessment windows",
          value: String(assessmentWindows.length),
          detail: "IA and major assessment planning",
          tone: assessmentWindows.length > 0 ? "accent" : "warm",
        },
        {
          label: "Core touchpoints",
          value: String(coreTouchpoints.length),
          detail: "CAS, EE, and TOK linkage",
          tone: coreTouchpoints.length > 0 ? "success" : "warm",
        },
        {
          label: "Linked records",
          value: String(linkedRecords.length),
          detail: "IA, EE, TOK, and CAS workflows",
        },
      ]}
      main={
        <div className="space-y-5">
          <WorkspacePanel
            title="Teaching workspace"
            description="Keep the course sequence and upcoming obligations visible above the full editor."
          >
            <div className="grid gap-4 xl:grid-cols-3">
              <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-950">Sequence overview</p>
                <p className="mt-2">
                  {sequenceOverview.length > 0
                    ? sequenceOverview.join(" • ")
                    : "Add sequence planning."}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-950">Assessment windows</p>
                <p className="mt-2">
                  {assessmentWindows.length > 0
                    ? assessmentWindows.join(" • ")
                    : "Add assessment windows."}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-950">Core touchpoints</p>
                <p className="mt-2">
                  {coreTouchpoints.length > 0
                    ? coreTouchpoints.join(" • ")
                    : "Add core touchpoints."}
                </p>
              </div>
            </div>
          </WorkspacePanel>

          <WorkspacePanel
            title="Live course map"
            description="Versioned document editing stays on the same route as IA and core launches."
          >
            <DocumentEditor documentId={document.id} />
          </WorkspacePanel>
        </div>
      }
      aside={
        <div className="space-y-5">
          <WorkspacePanel
            title="Linked DP operations"
            description="Open the exact IA or core record from the course map instead of a separate tracker."
          >
            <div className="space-y-3">
              {linkedRecords.length > 0 ? (
                linkedRecords.map((record) => (
                  <Link
                    key={record.id}
                    href={recordHref(record)}
                    className="block rounded-3xl bg-slate-50 p-4 text-sm text-slate-700"
                  >
                    <p className="font-semibold text-slate-950">{record.title}</p>
                    <p className="mt-1">
                      {record.nextAction || record.summary || "Open the live record."}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-600">No linked IA or core records yet.</p>
              )}
            </div>
          </WorkspacePanel>
        </div>
      }
    />
  );
}

export function DpAssessmentDashboard() {
  const { data } = useIbOperationalRecords({ programme: "DP", record_family: "dp_ia" });

  return (
    <VirtualDataGrid
      columns={[
        {
          key: "subject",
          header: "Subject",
          render: (row) => (
            <Link
              href={row.href}
              className="font-semibold text-slate-900 underline-offset-4 hover:underline"
            >
              {row.subject}
            </Link>
          ),
        },
        { key: "readiness", header: "Readiness" },
        { key: "nextAction", header: "Next action" },
      ]}
      rows={(data || []).map((record) => ({
        subject: record.title,
        readiness: record.riskLevel === "risk" ? "Needs follow-up" : record.status,
        nextAction: record.nextAction || record.summary || "Review IA milestone health.",
        href: recordHref(record),
      }))}
    />
  );
}

export function InternalAssessmentTracker() {
  const { data } = useIbOperationalRecords({ programme: "DP", record_family: "dp_ia" });

  return (
    <VirtualDataGrid
      columns={[
        {
          key: "student",
          header: "Record",
          render: (row) => (
            <Link
              href={row.href}
              className="font-semibold text-slate-900 underline-offset-4 hover:underline"
            >
              {row.student}
            </Link>
          ),
        },
        { key: "milestone", header: "Current milestone" },
        { key: "feedback", header: "Supervisor signal" },
      ]}
      rows={(data || []).map((record) => ({
        student: record.title,
        milestone: record.checkpoints[0]?.title || record.status,
        feedback: record.nextAction || record.summary || "Supervisor follow-up is still needed.",
        href: recordHref(record),
      }))}
    />
  );
}

export function CasWorkspace() {
  return (
    <DpRecordOverview
      title="CAS workspace"
      description="Experiences, projects, reflections, and advisor review stay in one operational route family."
      family="dp_cas"
    />
  );
}

export function EeSupervisionWorkspace() {
  return (
    <DpRecordOverview
      title="EE supervision"
      description="Supervisor milestones and student progress remain on the same EE record."
      family="dp_ee"
    />
  );
}

export function TokWorkspace() {
  return (
    <DpRecordOverview
      title="TOK workspace"
      description="Exhibition or essay checkpoints stay coherent across teacher and student views."
      family="dp_tok"
    />
  );
}

export function DpCoreOverview() {
  const { data } = useIbOperationalRecords({ programme: "DP" });

  if (!data) {
    return <IbSurfaceState status="loading" ready={null} />;
  }

  return (
    <IbWorkspaceScaffold
      title="DP core overview"
      description="CAS, EE, TOK, and IA risk surfaces are fed by live operational records."
      metrics={[
        {
          label: "DP records",
          value: String(data.length),
          detail: "Active operational items",
          tone: "accent",
        },
        {
          label: "At risk",
          value: String(data.filter((record) => record.riskLevel === "risk").length),
          detail: "Need coordinator follow-up",
          tone: "warm",
        },
      ]}
      main={
        <div className="grid gap-4 xl:grid-cols-2">
          <CasWorkspace />
          <div className="space-y-4">
            <EeSupervisionWorkspace />
            <TokWorkspace />
          </div>
        </div>
      }
    />
  );
}

export function DpInternalAssessmentWorkspace({ recordId }: { recordId: string }) {
  return (
    <IbOperationalRecordWorkspace
      recordId={recordId}
      title="Internal assessment"
      description="Checkpoint state, authenticity follow-up, and teacher/student actions stay on the same IA record."
      backHref={IB_CANONICAL_ROUTES.dpIaRisk}
      backLabel="Back to IA risk"
    />
  );
}

export function DpEeRecordWorkspace({ recordId }: { recordId: string }) {
  return (
    <IbOperationalRecordWorkspace
      recordId={recordId}
      title="Extended Essay"
      description="Supervisor notes, due dates, and student next steps stay on one live EE record."
      backHref={IB_CANONICAL_ROUTES.dpCoreEe}
      backLabel="Back to EE overview"
    />
  );
}

export function DpTokRecordWorkspace({ recordId }: { recordId: string }) {
  return (
    <IbOperationalRecordWorkspace
      recordId={recordId}
      title="TOK"
      description="Teacher feedback, checkpoint state, and student follow-up stay on one TOK record."
      backHref={IB_CANONICAL_ROUTES.dpCoreTok}
      backLabel="Back to TOK overview"
    />
  );
}

export function DpCasRecordWorkspace({ recordId }: { recordId: string }) {
  return (
    <IbOperationalRecordWorkspace
      recordId={recordId}
      title="CAS"
      description="Experience, reflection, and advisor review remain attached to one CAS record."
      backHref={IB_CANONICAL_ROUTES.dpCas}
      backLabel="Back to CAS overview"
    />
  );
}

export function DpCoordinatorWorkspace() {
  const { data: records = [] } = useIbOperationalRecords({ programme: "DP" });

  const riskRecords = records.filter((record) => record.riskLevel === "risk");
  const watchRecords = records.filter((record) => record.riskLevel === "watch");

  return (
    <IbWorkspaceScaffold
      title="DP coordinator"
      description="IA, EE, TOK, and CAS risk stay in one exception-first coordinator route with student-centric drilldowns."
      metrics={[
        {
          label: "DP risk",
          value: String(riskRecords.length),
          detail: "Immediate coordinator follow-up",
          tone: riskRecords.length > 0 ? "risk" : "success",
        },
        {
          label: "Watch list",
          value: String(watchRecords.length),
          detail: "Records drifting toward risk",
          tone: watchRecords.length > 0 ? "warm" : "success",
        },
        {
          label: "IA queue",
          value: String(records.filter((record) => record.recordFamily === "dp_ia").length),
          detail: "Internal assessment records",
          tone: "accent",
        },
        {
          label: "CAS backlog",
          value: String(
            records.filter(
              (record) => record.recordFamily === "dp_cas" && record.status !== "completed",
            ).length,
          ),
          detail: "CAS work still active",
          tone: "accent",
        },
      ]}
      main={
        <div className="space-y-5">
          <WorkspacePanel
            title="Coordinator risk console"
            description="Every row deep-links to the exact live record or student overview."
          >
            <VirtualDataGrid
              columns={[
                {
                  key: "title",
                  header: "Record",
                  render: (row) => (
                    <Link
                      href={row.href}
                      className="font-semibold text-slate-900 underline-offset-4 hover:underline"
                    >
                      {row.title}
                    </Link>
                  ),
                },
                { key: "family", header: "Type" },
                { key: "risk", header: "Risk" },
                { key: "nextAction", header: "Next action" },
                {
                  key: "studentHref",
                  header: "Student overview",
                  render: (row) =>
                    row.studentHref ? (
                      <Link
                        href={row.studentHref}
                        className="font-semibold text-slate-900 underline-offset-4 hover:underline"
                      >
                        Open student
                      </Link>
                    ) : (
                      <span className="text-sm text-slate-500">No student linked</span>
                    ),
                },
              ]}
              rows={records.map((record) => ({
                title: record.title,
                family: record.recordFamily.replace(/^dp_/, "").replace(/_/g, " "),
                risk: record.riskLevel,
                nextAction: record.nextAction || record.summary || "Open the live record.",
                href: recordHref(record),
                studentHref: record.studentId
                  ? IB_CANONICAL_ROUTES.dpStudentOverview(record.studentId)
                  : null,
              }))}
            />
          </WorkspacePanel>
        </div>
      }
    />
  );
}

export function DpStudentOverview({ studentId }: { studentId: string }) {
  const { data: records = [] } = useIbOperationalRecords({
    programme: "DP",
    student_id: studentId,
  });

  return (
    <IbWorkspaceScaffold
      title={`DP student overview • ${studentId}`}
      description="A student-centric DP route that shows IA, EE, TOK, and CAS next actions without making staff open four separate queues."
      metrics={[
        {
          label: "DP actions",
          value: String(records.length),
          detail: "Linked DP records for this student",
          tone: "accent",
        },
        {
          label: "At risk",
          value: String(records.filter((record) => record.riskLevel === "risk").length),
          detail: "Immediate attention needed",
          tone: records.some((record) => record.riskLevel === "risk") ? "risk" : "success",
        },
      ]}
      main={
        <WorkspacePanel
          title="Student-linked records"
          description="Open the exact record the student, advisor, or coordinator needs next."
        >
          <VirtualDataGrid
            columns={[
              {
                key: "title",
                header: "Record",
                render: (row) => (
                  <Link
                    href={row.href}
                    className="font-semibold text-slate-900 underline-offset-4 hover:underline"
                  >
                    {row.title}
                  </Link>
                ),
              },
              { key: "family", header: "Type" },
              { key: "due", header: "Due" },
              { key: "nextAction", header: "Next action" },
            ]}
            rows={records.map((record) => ({
              title: record.title,
              family: record.recordFamily.replace(/^dp_/, "").replace(/_/g, " "),
              due: record.dueOn || "No due date",
              nextAction: record.nextAction || record.summary || "Open the live record.",
              href: recordHref(record),
            }))}
          />
        </WorkspacePanel>
      }
    />
  );
}
