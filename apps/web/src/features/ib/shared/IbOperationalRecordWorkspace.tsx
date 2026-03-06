"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button, useToast } from "@k12/ui";
import { useCurriculumDocument } from "@/curriculum/documents/hooks";
import {
  useIbOperationalRecord,
  updateIbOperationalRecord,
  type IbOperationalCheckpoint,
} from "@/features/ib/data";
import { IbSurfaceState } from "@/features/ib/core/IbSurfaceState";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";
import { reportInteractionMetric } from "@/lib/performance";

interface IbOperationalRecordWorkspaceProps {
  recordId: string;
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
}

function formatDate(value?: string | null): string {
  if (!value) {
    return "No due date";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function prettyLabel(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function checkpointTone(checkpoint: IbOperationalCheckpoint): "accent" | "warning" | "success" {
  if (checkpoint.status === "completed") return "success";
  if (checkpoint.status === "blocked") return "warning";
  if (checkpoint.status === "in_progress") return "accent";
  return "warning";
}

function nextCheckpointStatus(checkpoint: IbOperationalCheckpoint): string {
  if (checkpoint.status === "pending") return "in_progress";
  if (checkpoint.status === "in_progress") return "completed";
  if (checkpoint.status === "blocked") return "in_progress";
  return "pending";
}

function recordStatusFor(checkpoints: IbOperationalCheckpoint[]): string {
  if (checkpoints.length === 0) return "open";
  if (checkpoints.every((checkpoint) => checkpoint.status === "completed")) return "completed";
  if (checkpoints.some((checkpoint) => checkpoint.status === "blocked")) return "blocked";
  if (
    checkpoints.some(
      (checkpoint) => checkpoint.status === "in_progress" || checkpoint.status === "completed",
    )
  ) {
    return "in_progress";
  }
  return "open";
}

function riskTone(riskLevel: string): "default" | "accent" | "warm" | "risk" {
  if (riskLevel === "risk") return "risk";
  if (riskLevel === "watch") return "warm";
  return "accent";
}

export function IbOperationalRecordWorkspace({
  recordId,
  title,
  description,
  backHref,
  backLabel = "Back",
}: IbOperationalRecordWorkspaceProps) {
  const { addToast } = useToast();
  const { data: record, isLoading, mutate } = useIbOperationalRecord(recordId);
  const { data: linkedDocument } = useCurriculumDocument(record?.curriculumDocumentId || null);
  const [nextAction, setNextAction] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNextAction(record?.nextAction || "");
  }, [record?.id, record?.nextAction]);

  const completedCount = useMemo(
    () => record?.checkpoints.filter((checkpoint) => checkpoint.status === "completed").length || 0,
    [record?.checkpoints],
  );

  if (isLoading || !record) {
    return <IbSurfaceState status="loading" ready={null} />;
  }

  const activeRecord = record;

  async function patchRecord(
    payload: Record<string, unknown>,
    telemetryEvent: string,
  ): Promise<void> {
    setSaving(true);
    try {
      await updateIbOperationalRecord(activeRecord.id, payload);
      reportInteractionMetric(telemetryEvent, 1, {
        programme: activeRecord.programme,
        family: activeRecord.recordFamily,
      });
      await mutate();
      addToast("success", "Record updated.");
    } catch {
      addToast("error", "Unable to update the record.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCheckpointAdvance(checkpointId: number): Promise<void> {
    const checkpoints = activeRecord.checkpoints.map((checkpoint) =>
      checkpoint.id === checkpointId
        ? { ...checkpoint, status: nextCheckpointStatus(checkpoint) }
        : checkpoint,
    );

    await patchRecord(
      {
        status: recordStatusFor(checkpoints),
        checkpoints: checkpoints.map((checkpoint) => ({
          id: checkpoint.id,
          title: checkpoint.title,
          status: checkpoint.status,
          due_on: checkpoint.due_on,
          summary: checkpoint.summary,
        })),
      },
      "ib_phase4_checkpoint_update",
    );
  }

  async function handleSaveNextAction(): Promise<void> {
    await patchRecord({ next_action: nextAction }, "ib_phase4_next_action_update");
  }

  const timeline = activeRecord.checkpoints.map((checkpoint) => ({
    id: String(checkpoint.id),
    title: checkpoint.title,
    description: checkpoint.summary || prettyLabel(checkpoint.status),
    meta: formatDate(checkpoint.due_on),
    tone: checkpointTone(checkpoint),
  }));

  return (
    <IbWorkspaceScaffold
      title={`${title} • ${record.title}`}
      description={description}
      badges={
        <>
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
            {record.programme}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {prettyLabel(record.recordFamily)}
          </span>
        </>
      }
      actions={
        backHref ? (
          <Link
            href={backHref}
            className="text-sm font-semibold text-slate-900 underline-offset-4 hover:underline"
          >
            {backLabel}
          </Link>
        ) : undefined
      }
      metrics={[
        {
          label: "Status",
          value: prettyLabel(record.status),
          detail: "Current workflow state",
          tone: riskTone(record.riskLevel),
        },
        {
          label: "Risk",
          value: prettyLabel(record.riskLevel),
          detail: "Coordinator triage signal",
          tone: riskTone(record.riskLevel),
        },
        {
          label: "Checkpoints",
          value: `${completedCount}/${record.checkpoints.length}`,
          detail: "Completed milestones",
          tone: completedCount === record.checkpoints.length ? "success" : "accent",
        },
        { label: "Due", value: formatDate(record.dueOn), detail: "Current due date" },
      ]}
      timeline={timeline}
      main={
        <div className="space-y-5">
          <WorkspacePanel
            title="Current state"
            description="Keep the summary, next action, and reason for urgency visible on the same route as milestone updates."
          >
            <div className="space-y-4">
              <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-950">Summary</p>
                <p className="mt-2">{record.summary || "No summary has been added yet."}</p>
              </div>
              <div>
                <label
                  htmlFor="ib-operational-next-action"
                  className="text-sm font-medium text-slate-700"
                >
                  Next action
                </label>
                <textarea
                  id="ib-operational-next-action"
                  value={nextAction}
                  onChange={(event) => setNextAction(event.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => void handleSaveNextAction()}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save next action"}
                  </Button>
                </div>
              </div>
            </div>
          </WorkspacePanel>

          <WorkspacePanel
            title="Milestone checkpoints"
            description="Move the workflow forward without bouncing through a separate admin queue."
          >
            <div className="space-y-3">
              {record.checkpoints.length > 0 ? (
                record.checkpoints.map((checkpoint) => (
                  <div
                    key={checkpoint.id}
                    className="rounded-3xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{checkpoint.title}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {checkpoint.summary || prettyLabel(checkpoint.status)}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
                          {formatDate(checkpoint.due_on)}
                        </p>
                      </div>
                      <Button
                        variant={checkpoint.status === "completed" ? "secondary" : "primary"}
                        onClick={() => void handleCheckpointAdvance(checkpoint.id)}
                        disabled={saving}
                      >
                        {checkpoint.status === "pending"
                          ? "Start"
                          : checkpoint.status === "completed"
                            ? "Reopen"
                            : "Advance"}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-600">
                  No checkpoints are attached to this record yet.
                </p>
              )}
            </div>
          </WorkspacePanel>
        </div>
      }
      aside={
        <div className="space-y-5">
          <WorkspacePanel
            title="Linked context"
            description="Record detail stays connected to the relevant unit or course map instead of becoming an orphaned tracker."
          >
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="rounded-3xl bg-slate-50 p-4">
                <span className="font-semibold text-slate-950">Student</span>
                <p className="mt-1">
                  {record.studentName ||
                    (record.studentId ? `User #${record.studentId}` : "Not assigned")}
                </p>
              </li>
              <li className="rounded-3xl bg-slate-50 p-4">
                <span className="font-semibold text-slate-950">Owner</span>
                <p className="mt-1">
                  {record.ownerName ||
                    (record.ownerId ? `User #${record.ownerId}` : "Not assigned")}
                </p>
              </li>
              <li className="rounded-3xl bg-slate-50 p-4">
                <span className="font-semibold text-slate-950">Advisor</span>
                <p className="mt-1">
                  {record.advisorName ||
                    (record.advisorId ? `User #${record.advisorId}` : "Not assigned")}
                </p>
              </li>
              <li className="rounded-3xl bg-slate-50 p-4">
                <span className="font-semibold text-slate-950">Linked document</span>
                <p className="mt-1">
                  {linkedDocument ? (
                    <Link
                      href={record.routeHint || "/ib/planning"}
                      className="font-semibold text-slate-900 underline-offset-4 hover:underline"
                    >
                      {linkedDocument.title}
                    </Link>
                  ) : (
                    record.curriculumDocumentTitle || "No linked document"
                  )}
                </p>
              </li>
            </ul>
          </WorkspacePanel>

          <WorkspacePanel
            title="Workflow signals"
            description="Risk, subtype, and slice-specific metadata remain explicit for advisor and coordinator follow-up."
          >
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="rounded-3xl bg-slate-50 p-4">
                Subtype: {prettyLabel(record.subtype)}
              </li>
              <li className="rounded-3xl bg-slate-50 p-4">
                Priority: {prettyLabel(record.priority)}
              </li>
              {Object.entries(record.metadata)
                .slice(0, 4)
                .map(([key, value]) => (
                  <li key={key} className="rounded-3xl bg-slate-50 p-4">
                    {prettyLabel(key)}: {Array.isArray(value) ? value.join(", ") : String(value)}
                  </li>
                ))}
            </ul>
          </WorkspacePanel>
        </div>
      }
    />
  );
}
