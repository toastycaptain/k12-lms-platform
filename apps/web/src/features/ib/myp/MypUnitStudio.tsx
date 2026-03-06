"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, VirtualDataGrid, useToast } from "@k12/ui";
import DocumentEditor from "@/curriculum/documents/DocumentEditor";
import {
  useCurriculumDocument,
  useCurriculumDocumentLinks,
  useCurriculumDocuments,
} from "@/curriculum/documents/hooks";
import {
  createIbOperationalRecord,
  useIbDocumentCollaborators,
  useIbDocumentComments,
  useIbOperationalRecords,
  type IbOperationalRecord,
} from "@/features/ib/data";
import { IbSurfaceState } from "@/features/ib/core/IbSurfaceState";
import { IB_CANONICAL_ROUTES } from "@/features/ib/core/route-registry";
import { IbOperationalRecordWorkspace } from "@/features/ib/shared/IbOperationalRecordWorkspace";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";
import { usePlanningContexts } from "@/curriculum/contexts/hooks";
import { apiFetch } from "@/lib/api";
import { reportInteractionMetric } from "@/lib/performance";

function stringValue(content: Record<string, unknown>, key: string): string {
  return typeof content[key] === "string" ? String(content[key]) : "";
}

function stringList(content: Record<string, unknown>, key: string): string[] {
  return Array.isArray(content[key]) ? (content[key] as unknown[]).map(String).filter(Boolean) : [];
}

function criteriaPlanRows(content: Record<string, unknown>) {
  return Array.isArray(content.criteria_plan)
    ? (content.criteria_plan as Array<Record<string, unknown>>).map((row) => ({
        criterion: String(row.criterion || "Criterion"),
        task: String(row.task || "Task not yet defined"),
        evidence: typeof row.evidence === "string" ? row.evidence : "",
      }))
    : [];
}

function readyLabel(present: boolean, success: string, blocked: string): string {
  return present ? success : blocked;
}

function RecordLinksPanel({
  title,
  description,
  records,
}: {
  title: string;
  description: string;
  records: IbOperationalRecord[];
}) {
  return (
    <WorkspacePanel title={title} description={description}>
      <div className="space-y-3">
        {records.length > 0 ? (
          records.map((record) => (
            <Link
              key={record.id}
              href={record.routeHint || IB_CANONICAL_ROUTES.mypProjects}
              className="block rounded-3xl bg-slate-50 p-4 text-sm text-slate-700"
            >
              <p className="font-semibold text-slate-950">{record.title}</p>
              <p className="mt-1">
                {record.nextAction || record.summary || "Open the current milestone."}
              </p>
            </Link>
          ))
        ) : (
          <p className="text-sm text-slate-600">No linked records yet.</p>
        )}
      </div>
    </WorkspacePanel>
  );
}

export function ContextConceptBuilder() {
  const { data: documents = [] } = useCurriculumDocuments({
    document_type: "ib_myp_unit",
    per_page: 200,
  });
  const readyUnits = documents.filter((document) => {
    const content =
      document.current_version?.content && typeof document.current_version.content === "object"
        ? (document.current_version.content as Record<string, unknown>)
        : {};
    return Boolean(stringValue(content, "key_concept") && stringValue(content, "global_context"));
  }).length;

  return (
    <WorkspacePanel
      title="Concept and context"
      description="Key concept and global context stay queryable and visible across live MYP units."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-950">Units with a live concept backbone</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{readyUnits}</p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-950">Open MYP coverage</p>
          <Link
            href={IB_CANONICAL_ROUTES.mypCoverage}
            className="mt-2 inline-block font-semibold text-slate-900 underline-offset-4 hover:underline"
          >
            Review MYP coverage
          </Link>
        </div>
      </div>
    </WorkspacePanel>
  );
}

export function InquiryQuestionBuilder() {
  const { data = [] } = useCurriculumDocuments({ document_type: "ib_myp_unit", per_page: 200 });
  const totalQuestions = data.reduce((count, document) => {
    const content =
      document.current_version?.content && typeof document.current_version.content === "object"
        ? (document.current_version.content as Record<string, unknown>)
        : {};
    return count + stringList(content, "inquiry_questions").length;
  }, 0);

  return (
    <WorkspacePanel
      title="Inquiry questions"
      description="Factual, conceptual, and debatable prompts remain live and visible for review."
    >
      <p className="text-sm text-slate-600">
        {totalQuestions} inquiry questions are currently attached to live MYP units.
      </p>
    </WorkspacePanel>
  );
}

export function CriteriaPlannerPanel() {
  const { data = [] } = useCurriculumDocuments({ document_type: "ib_myp_unit", per_page: 200 });
  const rows = data.flatMap((document) => {
    const content =
      document.current_version?.content && typeof document.current_version.content === "object"
        ? (document.current_version.content as Record<string, unknown>)
        : {};
    return criteriaPlanRows(content).map((row) => ({
      unit: document.title,
      criterion: row.criterion,
      task: row.task,
    }));
  });

  return (
    <VirtualDataGrid
      columns={[
        { key: "unit", header: "Unit" },
        { key: "criterion", header: "Criterion" },
        { key: "task", header: "Task" },
      ]}
      rows={rows}
    />
  );
}

export function ATLProgressionPanel() {
  const { data = [] } = useCurriculumDocuments({ document_type: "ib_myp_unit", per_page: 200 });
  const focusAreas = Array.from(
    new Set(
      data.flatMap((document) => {
        const content =
          document.current_version?.content && typeof document.current_version.content === "object"
            ? (document.current_version.content as Record<string, unknown>)
            : {};
        return stringList(content, "atl_focus");
      }),
    ),
  );

  return (
    <WorkspacePanel
      title="ATL progression"
      description="ATL focus areas remain visible for teachers and coordinators without another spreadsheet."
    >
      <div className="flex flex-wrap gap-2">
        {focusAreas.length > 0 ? (
          focusAreas.map((area) => (
            <span
              key={area}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
            >
              {area}
            </span>
          ))
        ) : (
          <p className="text-sm text-slate-600">No ATL focus areas have been mapped yet.</p>
        )}
      </div>
    </WorkspacePanel>
  );
}

export function ProjectsHub({
  studentId,
  families = ["myp_project", "myp_service"],
}: {
  studentId?: string;
  families?: Array<"myp_project" | "myp_service">;
}) {
  const router = useRouter();
  const { addToast } = useToast();
  const { data: contexts = [] } = usePlanningContexts({ per_page: 200 });
  const { data } = useIbOperationalRecords({
    programme: "MYP",
    record_family: families.join(","),
    ...(studentId ? { student_id: studentId } : {}),
  });
  const [creating, setCreating] = useState<"project" | "service" | null>(null);

  async function handleCreate(kind: "project" | "service"): Promise<void> {
    if (!contexts[0]) {
      addToast("error", "Create a planning context before launching an MYP record.");
      return;
    }

    setCreating(kind);
    try {
      const response = await createIbOperationalRecord({
        programme: "MYP",
        record_family: kind === "project" ? "myp_project" : "myp_service",
        subtype: kind === "project" ? "personal_project" : "service_cycle",
        title: kind === "project" ? "New MYP project" : "New service entry",
        status: "open",
        priority: "normal",
        risk_level: "healthy",
        planning_context_id: contexts[0].id,
        summary:
          kind === "project"
            ? "Capture milestones, advisor review, and student progress in one record."
            : "Track service planning, evidence, reflection, and validation in one record.",
        next_action:
          kind === "project"
            ? "Define the next milestone and assign advisor support."
            : "Add evidence or reflection, then request validation.",
        metadata:
          kind === "project"
            ? { variant: "personal_project", launch_source: "myp_projects_hub" }
            : {
                guardian_visible: true,
                guardian_prompt: "Ask how the service action connects to current learning.",
              },
        checkpoints:
          kind === "project"
            ? [
                { title: "Proposal", status: "pending", summary: "Approve the project proposal." },
                {
                  title: "Investigation",
                  status: "pending",
                  summary: "Log research and mentor support.",
                },
                {
                  title: "Outcome",
                  status: "pending",
                  summary: "Review product or community outcome.",
                },
                {
                  title: "Reflection",
                  status: "pending",
                  summary: "Complete the concluding reflection.",
                },
              ]
            : [
                {
                  title: "Plan service",
                  status: "pending",
                  summary: "Define the service goal and context.",
                },
                {
                  title: "Collect evidence",
                  status: "pending",
                  summary: "Attach evidence or notes from the action.",
                },
                {
                  title: "Reflection",
                  status: "pending",
                  summary: "Write the service reflection.",
                },
                {
                  title: "Validation",
                  status: "pending",
                  summary: "Teacher or advisor validation.",
                },
              ],
      });
      reportInteractionMetric(
        kind === "project" ? "ib_myp_project_created" : "ib_myp_service_created",
        1,
        {
          source: "projects_hub",
        },
      );
      router.push(
        kind === "project"
          ? IB_CANONICAL_ROUTES.mypProject(Number(response.id))
          : IB_CANONICAL_ROUTES.mypServiceEntry(Number(response.id)),
      );
    } catch {
      addToast("error", "Unable to create the MYP record.");
    } finally {
      setCreating(null);
    }
  }

  if (!data) {
    return <IbSurfaceState status="loading" ready={null} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {families.includes("myp_project") ? (
          <Button onClick={() => void handleCreate("project")} disabled={creating !== null}>
            {creating === "project" ? "Creating..." : "New project"}
          </Button>
        ) : null}
        {families.includes("myp_service") ? (
          <Button
            variant="secondary"
            onClick={() => void handleCreate("service")}
            disabled={creating !== null}
          >
            {creating === "service" ? "Creating..." : "New service entry"}
          </Button>
        ) : null}
      </div>
      <VirtualDataGrid
        columns={[
          {
            key: "title",
            header: "Project or service item",
            render: (row) => (
              <Link
                href={row.href}
                className="font-semibold text-slate-900 underline-offset-4 hover:underline"
              >
                {row.title}
              </Link>
            ),
          },
          { key: "kind", header: "Type" },
          { key: "status", header: "Status" },
          { key: "nextAction", header: "Next action" },
        ]}
        rows={data.map((record) => ({
          title: record.title,
          kind: record.recordFamily === "myp_service" ? "Service as Action" : "Project",
          status: record.riskLevel === "risk" ? "At risk" : record.status,
          nextAction: record.nextAction || record.summary || "Review milestone health.",
          href:
            record.routeHint ||
            (record.recordFamily === "myp_service"
              ? IB_CANONICAL_ROUTES.mypServiceEntry(record.id)
              : IB_CANONICAL_ROUTES.mypProject(record.id)),
        }))}
      />
    </div>
  );
}

function MypDocumentWorkspace({
  documentId,
  title,
  description,
  launchSource,
}: {
  documentId: string;
  title: string;
  description: string;
  launchSource: "unit" | "interdisciplinary";
}) {
  const router = useRouter();
  const { addToast } = useToast();
  const numericId = Number(documentId);
  const { data: document, isLoading } = useCurriculumDocument(
    Number.isNaN(numericId) ? null : numericId,
  );
  const { data: comments = [] } = useIbDocumentComments(Number.isNaN(numericId) ? null : numericId);
  const { data: collaborators = [] } = useIbDocumentCollaborators(
    Number.isNaN(numericId) ? null : numericId,
  );
  const { data: links = [] } = useCurriculumDocumentLinks(
    Number.isNaN(numericId) ? null : numericId,
  );
  const { data: linkedRecords = [] } = useIbOperationalRecords({
    curriculum_document_id: numericId,
    programme: "MYP",
  });
  const [creating, setCreating] = useState<"interdisciplinary" | "project" | "service" | null>(
    null,
  );

  const content =
    document?.current_version?.content && typeof document.current_version.content === "object"
      ? (document.current_version.content as Record<string, unknown>)
      : {};
  const relatedConcepts = stringList(content, "related_concepts");
  const inquiryQuestions = stringList(content, "inquiry_questions");
  const atlFocus = stringList(content, "atl_focus");
  const criteriaRows = criteriaPlanRows(content);

  async function createLinkedProject(kind: "project" | "service"): Promise<void> {
    if (!document) return;

    setCreating(kind);
    try {
      const response = await createIbOperationalRecord({
        programme: "MYP",
        record_family: kind === "project" ? "myp_project" : "myp_service",
        subtype: kind === "project" ? "personal_project" : "service_cycle",
        title: kind === "project" ? `${document.title} project` : `${document.title} service`,
        status: "open",
        priority: "normal",
        risk_level: "healthy",
        planning_context_id: document.planning_context_id,
        curriculum_document_id: document.id,
        summary:
          kind === "project"
            ? "Linked to the unit so teachers, advisors, and students can follow the same milestones."
            : "Linked to the unit so service evidence and reflection stay close to learning context.",
        next_action:
          kind === "project"
            ? "Add the next milestone and assign support."
            : "Capture evidence and write the reflection.",
        metadata:
          kind === "project"
            ? { linked_unit_id: document.id, launch_source: launchSource }
            : {
                linked_unit_id: document.id,
                guardian_visible: true,
                guardian_prompt: "Ask how the service action connects to this unit.",
              },
        checkpoints:
          kind === "project"
            ? [
                { title: "Proposal", status: "pending", summary: "Define the project proposal." },
                {
                  title: "Investigation",
                  status: "pending",
                  summary: "Capture inquiry and advisor follow-up.",
                },
                {
                  title: "Outcome",
                  status: "pending",
                  summary: "Track the final product or action.",
                },
                { title: "Reflection", status: "pending", summary: "Complete student reflection." },
              ]
            : [
                { title: "Plan service", status: "pending", summary: "Define the service goal." },
                {
                  title: "Evidence",
                  status: "pending",
                  summary: "Attach evidence to the service action.",
                },
                {
                  title: "Reflection",
                  status: "pending",
                  summary: "Complete the service reflection.",
                },
                { title: "Validation", status: "pending", summary: "Teacher validation." },
              ],
      });
      reportInteractionMetric(
        kind === "project" ? "ib_myp_project_created" : "ib_myp_service_created",
        1,
        {
          source: launchSource,
        },
      );
      router.push(
        kind === "project"
          ? IB_CANONICAL_ROUTES.mypProject(Number(response.id))
          : IB_CANONICAL_ROUTES.mypServiceEntry(Number(response.id)),
      );
    } catch {
      addToast("error", "Unable to create the linked record.");
    } finally {
      setCreating(null);
    }
  }

  async function createInterdisciplinaryRecord(): Promise<void> {
    if (!document) return;

    setCreating("interdisciplinary");
    try {
      const created = await apiFetch<{ id: number }>("/api/v1/curriculum_documents", {
        method: "POST",
        body: JSON.stringify({
          curriculum_document: {
            planning_context_id: document.planning_context_id,
            document_type: "ib_myp_interdisciplinary_unit",
            title: `${document.title} interdisciplinary`,
            schema_key: "ib.myp.interdisciplinary@v2",
            content: { title: `${document.title} interdisciplinary` },
          },
        }),
      });

      await apiFetch(`/api/v1/curriculum_documents/${document.id}/links`, {
        method: "POST",
        body: JSON.stringify({
          link: {
            target_document_id: created.id,
            relationship_type: "contains",
            metadata: { launch_source: launchSource },
          },
        }),
      }).catch(() => undefined);

      reportInteractionMetric("ib_myp_interdisciplinary_created", 1, { source: launchSource });
      router.push(IB_CANONICAL_ROUTES.mypInterdisciplinary(created.id));
    } catch {
      addToast("error", "Unable to create the interdisciplinary record.");
    } finally {
      setCreating(null);
    }
  }

  if (isLoading || !document) {
    return <IbSurfaceState status="loading" ready={null} />;
  }

  return (
    <IbWorkspaceScaffold
      title={`${title} • ${document.title}`}
      description={description}
      badges={
        <>
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
            MYP
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {document.status}
          </span>
        </>
      }
      actions={
        <div className="flex flex-wrap gap-2">
          {launchSource === "unit" ? (
            <Button
              variant="secondary"
              onClick={() => void createInterdisciplinaryRecord()}
              disabled={creating !== null}
            >
              {creating === "interdisciplinary" ? "Creating..." : "New interdisciplinary"}
            </Button>
          ) : null}
          <Button onClick={() => void createLinkedProject("project")} disabled={creating !== null}>
            {creating === "project" ? "Creating..." : "New project"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => void createLinkedProject("service")}
            disabled={creating !== null}
          >
            {creating === "service" ? "Creating..." : "New service"}
          </Button>
        </div>
      }
      metrics={[
        {
          label: "Concept backbone",
          value: readyLabel(
            Boolean(stringValue(content, "key_concept") && stringValue(content, "global_context")),
            "Ready",
            "Blocked",
          ),
          detail: "Key concept and global context",
          tone:
            stringValue(content, "key_concept") && stringValue(content, "global_context")
              ? "success"
              : "warm",
        },
        {
          label: "Inquiry questions",
          value: String(inquiryQuestions.length),
          detail: "Typed prompts across the unit",
          tone: inquiryQuestions.length > 0 ? "accent" : "warm",
        },
        {
          label: "Criteria rows",
          value: String(criteriaRows.length),
          detail: "Assessment planning is persisted",
          tone: criteriaRows.length > 0 ? "accent" : "warm",
        },
        {
          label: "Linked workflows",
          value: String(links.length + linkedRecords.length),
          detail: "Projects, service, and interdisciplinary links",
        },
      ]}
      main={
        <div className="space-y-5">
          <WorkspacePanel
            title="MYP planning spine"
            description="Concept, context, statement of inquiry, questions, ATL, and criteria remain visible above the full document editor."
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-950">Statement of inquiry</p>
                <p className="mt-2">
                  {stringValue(content, "statement_of_inquiry") || "Add the statement of inquiry."}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-950">Key concept and global context</p>
                <p className="mt-2">
                  {stringValue(content, "key_concept") || "No key concept"} •{" "}
                  {stringValue(content, "global_context") || "No global context"}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-950">Related concepts</p>
                <p className="mt-2">
                  {relatedConcepts.length > 0
                    ? relatedConcepts.join(", ")
                    : "Add related concepts."}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-950">ATL focus</p>
                <p className="mt-2">
                  {atlFocus.length > 0 ? atlFocus.join(", ") : "Add ATL focus areas."}
                </p>
              </div>
            </div>
          </WorkspacePanel>

          <WorkspacePanel
            title="Live unit document"
            description="Versioned, commentable, and saved through the curriculum document system."
          >
            <DocumentEditor documentId={document.id} />
          </WorkspacePanel>
        </div>
      }
      aside={
        <div className="space-y-5">
          <WorkspacePanel
            title="Inquiry and assessment"
            description="Teachers and coordinators can review the pedagogical spine without leaving the route."
          >
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="rounded-3xl bg-slate-50 p-4">
                <span className="font-semibold text-slate-950">Inquiry questions</span>
                <p className="mt-2">
                  {inquiryQuestions.length > 0
                    ? inquiryQuestions.join(" • ")
                    : "No inquiry questions yet."}
                </p>
              </li>
              <li className="rounded-3xl bg-slate-50 p-4">
                <span className="font-semibold text-slate-950">Criteria planning</span>
                <p className="mt-2">
                  {criteriaRows.length > 0
                    ? `${criteriaRows.length} planned tasks`
                    : "No criteria rows yet."}
                </p>
              </li>
              <li className="rounded-3xl bg-slate-50 p-4">
                <span className="font-semibold text-slate-950">Comments and collaborators</span>
                <p className="mt-2">
                  {comments.length} comments • {collaborators.length} collaborators
                </p>
              </li>
            </ul>
          </WorkspacePanel>

          <WorkspacePanel
            title="Linked documents"
            description="Shared planning records stay attached to the unit instead of hiding in generic lists."
          >
            <div className="space-y-3">
              {links.length > 0 ? (
                links.map((link) => (
                  <Link
                    key={link.id}
                    href={
                      link.target_document?.document_type === "ib_myp_interdisciplinary_unit"
                        ? IB_CANONICAL_ROUTES.mypInterdisciplinary(link.target_document.id)
                        : link.target_document?.document_type === "ib_myp_unit"
                          ? IB_CANONICAL_ROUTES.mypUnit(link.target_document.id)
                          : link.target_document?.document_type === "ib_dp_course_map"
                            ? IB_CANONICAL_ROUTES.dpCourse(link.target_document.id)
                            : link.target_document?.document_type?.startsWith("ib_pyp")
                              ? IB_CANONICAL_ROUTES.pypUnit(
                                  link.target_document?.id || link.target_document_id,
                                )
                              : IB_CANONICAL_ROUTES.planning
                    }
                    className="block rounded-3xl bg-slate-50 p-4 text-sm text-slate-700"
                  >
                    <p className="font-semibold text-slate-950">
                      {link.target_document?.title || `Linked document ${link.target_document_id}`}
                    </p>
                    <p className="mt-1">{link.relationship_type.replace(/_/g, " ")}</p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-600">No linked interdisciplinary documents yet.</p>
              )}
            </div>
          </WorkspacePanel>

          <RecordLinksPanel
            title="Projects and service"
            description="Project milestones and service reflection stay one click from the unit studio."
            records={linkedRecords.filter(
              (record) =>
                record.recordFamily === "myp_project" || record.recordFamily === "myp_service",
            )}
          />
        </div>
      }
    />
  );
}

export function InterdisciplinaryUnitStudio({ unitId = "new" }: { unitId?: string }) {
  if (unitId === "new") {
    return (
      <IbSurfaceState
        status="empty"
        ready={null}
        emptyTitle="No interdisciplinary record yet"
        emptyDescription="Create an interdisciplinary planning record to begin."
      />
    );
  }

  return (
    <MypDocumentWorkspace
      documentId={unitId}
      title="MYP interdisciplinary studio"
      description="Shared goals, milestones, and linked subject-unit context remain live and versioned."
      launchSource="interdisciplinary"
    />
  );
}

export function MypUnitStudio({ unitId }: { unitId?: string }) {
  if (!unitId) {
    return (
      <IbSurfaceState
        status="empty"
        ready={null}
        emptyTitle="No unit selected"
        emptyDescription="Open or create an MYP unit to begin."
      />
    );
  }

  return (
    <MypDocumentWorkspace
      documentId={unitId}
      title="MYP unit studio"
      description="Live concept/context planning, inquiry, criteria, ATL, comments, and linked project/service work in one route."
      launchSource="unit"
    />
  );
}

export function MypProjectWorkspace({
  projectId,
  studentId,
}: {
  projectId: string;
  studentId?: string;
}) {
  return (
    <IbOperationalRecordWorkspace
      recordId={projectId}
      title={studentId ? `Student ${studentId} project` : "MYP project"}
      description="Advisor milestones, reflections, and coordinator follow-up stay on the same live project record."
      backHref={studentId ? IB_CANONICAL_ROUTES.studentProjects : IB_CANONICAL_ROUTES.mypProjects}
      backLabel={studentId ? "Back to student projects" : "Back to MYP projects"}
    />
  );
}

export function MypServiceWorkspace({ serviceEntryId }: { serviceEntryId: string }) {
  return (
    <IbOperationalRecordWorkspace
      recordId={serviceEntryId}
      title="Service as action"
      description="Evidence, reflection, and validation remain visible without turning service into a paperwork detour."
      backHref={IB_CANONICAL_ROUTES.mypService}
      backLabel="Back to service"
    />
  );
}

export function MypCoverageOverview() {
  const { data: units = [] } = useCurriculumDocuments({
    document_type: "ib_myp_unit",
    per_page: 200,
  });
  const { data: records = [] } = useIbOperationalRecords({
    programme: "MYP",
    record_family: "myp_project,myp_service",
  });

  const metrics = useMemo(() => {
    const conceptReady = units.filter((unit) => {
      const content =
        unit.current_version?.content && typeof unit.current_version.content === "object"
          ? (unit.current_version.content as Record<string, unknown>)
          : {};
      return Boolean(
        stringValue(content, "key_concept") &&
        stringValue(content, "global_context") &&
        stringValue(content, "statement_of_inquiry"),
      );
    }).length;
    const atlMapped = units.filter((unit) => {
      const content =
        unit.current_version?.content && typeof unit.current_version.content === "object"
          ? (unit.current_version.content as Record<string, unknown>)
          : {};
      return stringList(content, "atl_focus").length > 0;
    }).length;

    return {
      conceptReady,
      atlMapped,
      projectRisk: records.filter(
        (record) => record.recordFamily === "myp_project" && record.riskLevel === "risk",
      ).length,
      serviceWaiting: records.filter(
        (record) => record.recordFamily === "myp_service" && record.status !== "completed",
      ).length,
    };
  }, [records, units]);

  return (
    <IbWorkspaceScaffold
      title="MYP coverage"
      description="Criteria, ATL, concept/context, and linked project/service risk stay visible in one coordinator-facing route."
      metrics={[
        {
          label: "Units live",
          value: String(units.length),
          detail: "Active MYP subject-unit records",
          tone: "accent",
        },
        {
          label: "Concept ready",
          value: String(metrics.conceptReady),
          detail: "Concept, context, and inquiry spine complete",
          tone: "success",
        },
        {
          label: "ATL mapped",
          value: String(metrics.atlMapped),
          detail: "Units with ATL focus persisted",
          tone: "accent",
        },
        {
          label: "Project risk",
          value: String(metrics.projectRisk),
          detail: "Projects needing coordinator follow-up",
          tone: metrics.projectRisk > 0 ? "warm" : "success",
        },
      ]}
      main={
        <div className="space-y-5">
          <WorkspacePanel
            title="Subject-unit coverage"
            description="Review which units are missing core MYP fields before moderation or delivery slips."
          >
            <VirtualDataGrid
              columns={[
                {
                  key: "title",
                  header: "Unit",
                  render: (row) => (
                    <Link
                      href={row.href}
                      className="font-semibold text-slate-900 underline-offset-4 hover:underline"
                    >
                      {row.title}
                    </Link>
                  ),
                },
                { key: "concept", header: "Concept/context" },
                { key: "inquiry", header: "Inquiry" },
                { key: "assessment", header: "Criteria/ATL" },
              ]}
              rows={units.map((unit) => {
                const content =
                  unit.current_version?.content && typeof unit.current_version.content === "object"
                    ? (unit.current_version.content as Record<string, unknown>)
                    : {};
                return {
                  title: unit.title,
                  href: IB_CANONICAL_ROUTES.mypUnit(unit.id),
                  concept: readyLabel(
                    Boolean(
                      stringValue(content, "key_concept") && stringValue(content, "global_context"),
                    ),
                    "Ready",
                    "Needs work",
                  ),
                  inquiry: readyLabel(
                    stringList(content, "inquiry_questions").length > 0,
                    "Ready",
                    "Needs questions",
                  ),
                  assessment: readyLabel(
                    criteriaPlanRows(content).length > 0 &&
                      stringList(content, "atl_focus").length > 0,
                    "Ready",
                    "Needs mapping",
                  ),
                };
              })}
            />
          </WorkspacePanel>

          <WorkspacePanel
            title="Project and service risk"
            description="Go straight to the record carrying the next coordinator action."
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
                { key: "kind", header: "Type" },
                { key: "risk", header: "Risk" },
                { key: "nextAction", header: "Next action" },
              ]}
              rows={records.map((record) => ({
                title: record.title,
                kind: record.recordFamily === "myp_service" ? "Service" : "Project",
                risk: record.riskLevel,
                nextAction: record.nextAction || record.summary || "Open the live record.",
                href:
                  record.routeHint ||
                  (record.recordFamily === "myp_service"
                    ? IB_CANONICAL_ROUTES.mypServiceEntry(record.id)
                    : IB_CANONICAL_ROUTES.mypProject(record.id)),
              }))}
            />
          </WorkspacePanel>
        </div>
      }
      aside={
        <WorkspacePanel
          title="Coordinator shortcuts"
          description="Keep MYP decision support route-consistent with the wider IB operations shell."
        >
          <ul className="space-y-3 text-sm text-slate-600">
            <li>
              <Link
                href={IB_CANONICAL_ROUTES.mypReview}
                className="font-semibold text-slate-900 underline-offset-4 hover:underline"
              >
                Open MYP review queue
              </Link>
            </li>
            <li>
              <Link
                href={IB_CANONICAL_ROUTES.operations}
                className="font-semibold text-slate-900 underline-offset-4 hover:underline"
              >
                Return to operations center
              </Link>
            </li>
            <li>
              {metrics.serviceWaiting} service entries are still active or awaiting validation.
            </li>
          </ul>
        </WorkspacePanel>
      }
    />
  );
}

export function MypReviewWorkspace() {
  const { data: units = [] } = useCurriculumDocuments({
    document_type: "ib_myp_unit",
    per_page: 200,
  });
  const { data: interdisciplinary = [] } = useCurriculumDocuments({
    document_type: "ib_myp_interdisciplinary_unit",
    per_page: 200,
  });
  const { data: records = [] } = useIbOperationalRecords({
    programme: "MYP",
    risk_level: "risk",
    record_family: "myp_project,myp_service",
  });

  const pendingDocs = [...units, ...interdisciplinary].filter(
    (document) => document.status === "pending_approval",
  );

  return (
    <IbWorkspaceScaffold
      title="MYP review"
      description="Returned units, interdisciplinary records, projects, and service items remain in one exception-first review route."
      metrics={[
        {
          label: "Pending unit review",
          value: String(pendingDocs.length),
          detail: "Documents awaiting coordinator decision",
          tone: pendingDocs.length > 0 ? "warm" : "success",
        },
        {
          label: "Risk records",
          value: String(records.length),
          detail: "Projects or service items needing support",
          tone: records.length > 0 ? "risk" : "success",
        },
      ]}
      main={
        <div className="space-y-5">
          <WorkspacePanel
            title="Document review"
            description="Returned units and interdisciplinary records stay one click from their live editor."
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
                { key: "type", header: "Type" },
                { key: "status", header: "Status" },
              ]}
              rows={pendingDocs.map((document) => ({
                title: document.title,
                type: document.document_type,
                status: document.status,
                href:
                  document.document_type === "ib_myp_interdisciplinary_unit"
                    ? IB_CANONICAL_ROUTES.mypInterdisciplinary(document.id)
                    : IB_CANONICAL_ROUTES.mypUnit(document.id),
              }))}
            />
          </WorkspacePanel>

          <WorkspacePanel
            title="Projects and service"
            description="Coordinator review and risk triage stays route-linked to the exact record."
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
                { key: "risk", header: "Risk" },
                { key: "nextAction", header: "Next action" },
              ]}
              rows={records.map((record) => ({
                title: record.title,
                risk: record.riskLevel,
                nextAction: record.nextAction || record.summary || "Open the record.",
                href:
                  record.routeHint ||
                  (record.recordFamily === "myp_service"
                    ? IB_CANONICAL_ROUTES.mypServiceEntry(record.id)
                    : IB_CANONICAL_ROUTES.mypProject(record.id)),
              }))}
            />
          </WorkspacePanel>
        </div>
      }
    />
  );
}

export function MypStudentProjectWorkspace({
  studentId,
  projectId,
}: {
  studentId: string;
  projectId: string;
}) {
  return <MypProjectWorkspace projectId={projectId} studentId={studentId} />;
}
