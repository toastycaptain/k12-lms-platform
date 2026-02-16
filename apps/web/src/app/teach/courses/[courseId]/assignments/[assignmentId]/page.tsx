"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import GoogleDrivePicker from "@/components/GoogleDrivePicker";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface Assignment {
  id: number;
  title: string;
  description: string | null;
  instructions: string | null;
  assignment_type: string;
  points_possible: string | null;
  due_at: string | null;
  unlock_at: string | null;
  lock_at: string | null;
  submission_types: string[];
  status: string;
  rubric_id: number | null;
  standard_ids: number[];
}

interface RubricSummary {
  id: number;
  title: string;
  points_possible: string;
}

interface ResourceLink {
  id: number;
  title: string | null;
  url: string;
  provider: string;
}

interface UnitPlan {
  id: number;
  current_version_id: number | null;
}

interface UnitVersion {
  id: number;
  standards: Standard[];
}

interface Standard {
  id: number;
  code: string;
  description: string;
}

interface SyncMapping {
  local_type: string;
  local_id: number;
}

interface IntegrationConfig {
  id: number;
  status: string;
}

const TEACHER_ROLES = ["admin", "curriculum_lead", "teacher"];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-yellow-200 text-yellow-900",
    published: "bg-green-100 text-green-800",
    closed: "bg-red-100 text-red-800",
    archived: "bg-gray-100 text-gray-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
}

function toDatetimeLocal(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function deriveSubmissionType(
  value: string[],
): "online_text" | "file_upload" | "google_drive_link" | "none" {
  const [first] = value;
  if (first === "file_upload") return "file_upload";
  if (first === "google_drive_link") return "google_drive_link";
  if (first === "none") return "none";
  return "online_text";
}

function inferAssignmentType(
  submissionType: "online_text" | "file_upload" | "google_drive_link" | "none",
) {
  if (submissionType === "file_upload") return "file_upload";
  if (submissionType === "google_drive_link") return "url";
  return "written";
}

export default function AssignmentEditorPage() {
  const params = useParams();
  const { user } = useAuth();
  const courseId = String(params.courseId);
  const assignmentId = String(params.assignmentId);

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [resources, setResources] = useState<ResourceLink[]>([]);
  const [rubrics, setRubrics] = useState<RubricSummary[]>([]);
  const [selectedRubric, setSelectedRubric] = useState<RubricSummary | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pointsPossible, setPointsPossible] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableUntil, setAvailableUntil] = useState("");
  const [submissionType, setSubmissionType] = useState<
    "online_text" | "file_upload" | "google_drive_link" | "none"
  >("online_text");

  const [allStandards, setAllStandards] = useState<Standard[]>([]);
  const [alignedStandards, setAlignedStandards] = useState<Standard[]>([]);
  const [standardSearch, setStandardSearch] = useState("");

  const [manualResourceUrl, setManualResourceUrl] = useState("");
  const [manualResourceTitle, setManualResourceTitle] = useState("");

  const [showRubricPicker, setShowRubricPicker] = useState(false);
  const [newRubricTitle, setNewRubricTitle] = useState("");
  const [newRubricPoints, setNewRubricPoints] = useState("");

  const [hasCourseMapping, setHasCourseMapping] = useState(false);
  const [hasAssignmentMapping, setHasAssignmentMapping] = useState(false);
  const [classroomSyncMessage, setClassroomSyncMessage] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const descriptionRef = useRef<HTMLDivElement>(null);

  function execFormat(command: string, value?: string) {
    document.execCommand(command, false, value);
    if (descriptionRef.current) {
      setDescription(descriptionRef.current.innerHTML);
    }
  }

  const filteredStandards = useMemo(() => {
    const needle = standardSearch.trim().toLowerCase();
    if (!needle) return [];

    return allStandards
      .filter((standard) => {
        return (
          standard.code.toLowerCase().includes(needle) ||
          standard.description.toLowerCase().includes(needle)
        );
      })
      .filter((standard) => !alignedStandards.some((existing) => existing.id === standard.id))
      .slice(0, 8);
  }, [allStandards, alignedStandards, standardSearch]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [assignmentData, rubricList, standardsList, resourceList] = await Promise.all([
        apiFetch<Assignment>(`/api/v1/assignments/${assignmentId}`),
        apiFetch<RubricSummary[]>("/api/v1/rubrics"),
        apiFetch<Standard[]>("/api/v1/standards"),
        apiFetch<ResourceLink[]>(`/api/v1/assignments/${assignmentId}/resource_links`),
      ]);

      setAssignment(assignmentData);
      setRubrics(rubricList);
      setAllStandards(standardsList);
      setResources(resourceList);

      setTitle(assignmentData.title);
      setDescription(assignmentData.description || assignmentData.instructions || "");
      setPointsPossible(assignmentData.points_possible || "");
      setDueDate(toDatetimeLocal(assignmentData.due_at));
      setAvailableFrom(toDatetimeLocal(assignmentData.unlock_at));
      setAvailableUntil(toDatetimeLocal(assignmentData.lock_at));
      setSubmissionType(deriveSubmissionType(assignmentData.submission_types || []));

      if (assignmentData.rubric_id) {
        setSelectedRubric(
          rubricList.find((rubric) => rubric.id === assignmentData.rubric_id) || null,
        );
      } else {
        setSelectedRubric(null);
      }

      // Load persisted assignment standards
      const savedStandardIds = assignmentData.standard_ids || [];
      if (savedStandardIds.length > 0) {
        const savedStandards = standardsList.filter((s) => savedStandardIds.includes(s.id));
        setAlignedStandards(savedStandards);
      } else {
        // Fall back to unit plan standards for initial population
        const unitPlans = await apiFetch<UnitPlan[]>(`/api/v1/unit_plans?course_id=${courseId}`);
        const standardsFromUnits: Standard[] = [];

        await Promise.all(
          unitPlans.map(async (unitPlan) => {
            try {
              const versions = await apiFetch<UnitVersion[]>(
                `/api/v1/unit_plans/${unitPlan.id}/versions`,
              );
              const currentVersion =
                versions.find((version) => version.id === unitPlan.current_version_id) ||
                versions[0];
              if (currentVersion?.standards) {
                standardsFromUnits.push(...currentVersion.standards);
              }
            } catch {
              // Ignore missing versions per unit.
            }
          }),
        );

        const unique = new Map<number, Standard>();
        standardsFromUnits.forEach((standard) => unique.set(standard.id, standard));
        setAlignedStandards(Array.from(unique.values()));
      }

      try {
        const integrationConfigs = await apiFetch<IntegrationConfig[]>(
          "/api/v1/integration_configs",
        );
        if (integrationConfigs.length > 0 && integrationConfigs[0].status === "active") {
          const mappings = await apiFetch<SyncMapping[]>(
            `/api/v1/integration_configs/${integrationConfigs[0].id}/sync_mappings`,
          );
          setHasCourseMapping(
            mappings.some(
              (mapping) => mapping.local_type === "Course" && mapping.local_id === Number(courseId),
            ),
          );
          setHasAssignmentMapping(
            mappings.some(
              (mapping) =>
                mapping.local_type === "Assignment" && mapping.local_id === Number(assignmentId),
            ),
          );
        }
      } catch {
        setHasCourseMapping(false);
        setHasAssignmentMapping(false);
      }
    } catch {
      setError("Unable to load assignment editor data.");
    } finally {
      setLoading(false);
    }
  }, [assignmentId, courseId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Sync loaded description into the contentEditable div
  useEffect(() => {
    if (assignment && descriptionRef.current && descriptionRef.current.innerHTML !== description) {
      descriptionRef.current.innerHTML = description;
    }
    // Only run when assignment loads, not on every keystroke
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment]);

  async function saveDraft() {
    if (!assignment) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const updated = await apiFetch<Assignment>(`/api/v1/assignments/${assignment.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          description,
          instructions: description,
          points_possible: pointsPossible ? Number(pointsPossible) : null,
          due_at: dueDate || null,
          unlock_at: availableFrom || null,
          lock_at: availableUntil || null,
          assignment_type: inferAssignmentType(submissionType),
          submission_types: [submissionType],
        }),
      });

      // Sync aligned standards
      const currentIds = updated.standard_ids || [];
      const desiredIds = alignedStandards.map((s) => s.id);
      const toAdd = desiredIds.filter((id) => !currentIds.includes(id));
      const toRemove = currentIds.filter((id) => !desiredIds.includes(id));

      if (toRemove.length > 0) {
        await apiFetch(`/api/v1/assignments/${assignment.id}/standards/bulk_destroy`, {
          method: "DELETE",
          body: JSON.stringify({ standard_ids: toRemove }),
        });
      }
      if (toAdd.length > 0) {
        await apiFetch(`/api/v1/assignments/${assignment.id}/standards`, {
          method: "POST",
          body: JSON.stringify({ standard_ids: toAdd }),
        });
      }

      setAssignment({ ...updated, standard_ids: desiredIds });
      setMessage("Draft saved.");
    } catch {
      setError("Unable to save assignment draft.");
    } finally {
      setSaving(false);
    }
  }

  async function publishAssignment() {
    if (!assignment) return;

    setPublishing(true);
    setError(null);

    try {
      const updated = await apiFetch<Assignment>(`/api/v1/assignments/${assignment.id}/publish`, {
        method: "POST",
      });
      setAssignment(updated);
      setMessage("Assignment published.");
    } catch {
      setError("Unable to publish assignment.");
    } finally {
      setPublishing(false);
    }
  }

  async function closeSubmissions() {
    if (!assignment) return;

    setClosing(true);
    setError(null);

    try {
      const updated = await apiFetch<Assignment>(`/api/v1/assignments/${assignment.id}/close`, {
        method: "POST",
      });
      setAssignment(updated);
      setMessage("Submissions are now closed.");
    } catch {
      setError("Unable to close submissions.");
    } finally {
      setClosing(false);
    }
  }

  async function attachRubric(rubricId: number) {
    if (!assignment) return;

    try {
      const updated = await apiFetch<Assignment>(`/api/v1/assignments/${assignment.id}`, {
        method: "PATCH",
        body: JSON.stringify({ rubric_id: rubricId }),
      });
      setAssignment(updated);
      setSelectedRubric(rubrics.find((rubric) => rubric.id === rubricId) || null);
      setShowRubricPicker(false);
    } catch {
      setError("Unable to attach rubric.");
    }
  }

  async function createAndAttachRubric() {
    if (!newRubricTitle.trim() || !assignment) return;

    try {
      const created = await apiFetch<RubricSummary>("/api/v1/rubrics", {
        method: "POST",
        body: JSON.stringify({
          title: newRubricTitle.trim(),
          points_possible: newRubricPoints ? Number(newRubricPoints) : null,
        }),
      });

      setRubrics((previous) => [created, ...previous]);
      setNewRubricTitle("");
      setNewRubricPoints("");
      await attachRubric(created.id);
    } catch {
      setError("Unable to create rubric.");
    }
  }

  async function attachManualResource() {
    if (!manualResourceUrl.trim() || !assignment) return;

    try {
      const created = await apiFetch<ResourceLink>(
        `/api/v1/assignments/${assignment.id}/resource_links`,
        {
          method: "POST",
          body: JSON.stringify({
            resource_link: {
              title: manualResourceTitle || manualResourceUrl,
              url: manualResourceUrl,
              provider: "url",
            },
          }),
        },
      );
      setResources((previous) => [...previous, created]);
      setManualResourceTitle("");
      setManualResourceUrl("");
    } catch {
      setError("Unable to attach resource URL.");
    }
  }

  async function attachDriveResource(file: {
    id: string;
    name: string;
    url: string;
    mimeType: string;
  }) {
    if (!assignment) return;

    try {
      const created = await apiFetch<ResourceLink>(
        `/api/v1/assignments/${assignment.id}/resource_links`,
        {
          method: "POST",
          body: JSON.stringify({
            resource_link: {
              title: file.name,
              url: file.url,
              provider: "google_drive",
              drive_file_id: file.id,
              mime_type: file.mimeType,
            },
          }),
        },
      );
      setResources((previous) => [...previous, created]);
    } catch {
      setError("Unable to attach Drive resource.");
    }
  }

  async function removeResource(resourceId: number) {
    if (!assignment) return;

    try {
      await apiFetch(`/api/v1/assignments/${assignment.id}/resource_links/${resourceId}`, {
        method: "DELETE",
      });
      setResources((previous) => previous.filter((resource) => resource.id !== resourceId));
    } catch {
      setError("Unable to remove resource.");
    }
  }

  async function pushToClassroom() {
    if (!assignment) return;

    setClassroomSyncMessage(null);

    try {
      await apiFetch(`/api/v1/assignments/${assignment.id}/push_to_classroom`, { method: "POST" });
      setHasAssignmentMapping(true);
      setClassroomSyncMessage("Assignment pushed to Classroom.");
    } catch {
      setClassroomSyncMessage("Unable to push assignment to Classroom.");
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={TEACHER_ROLES}>
        <AppShell>
          <p className="text-sm text-gray-500">Loading assignment...</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (!assignment) {
    return (
      <ProtectedRoute requiredRoles={TEACHER_ROLES}>
        <AppShell>
          <p className="text-sm text-gray-500">Assignment not found.</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={TEACHER_ROLES}>
      <AppShell>
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link
                href={`/teach/courses/${courseId}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                &larr; Back to Course
              </Link>
              <div className="mt-1 flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">Assignment Editor</h1>
                <StatusBadge status={assignment.status} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={saveDraft}
                disabled={saving}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Draft"}
              </button>
              <button
                onClick={publishAssignment}
                disabled={publishing || assignment.status !== "draft"}
                className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {publishing ? "Publishing..." : "Publish"}
              </button>
              <button
                onClick={closeSubmissions}
                disabled={closing || assignment.status !== "published"}
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {closing ? "Closing..." : "Close Submissions"}
              </button>
            </div>
          </div>

          {error && <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {message && (
            <div role="status" aria-live="polite" className="rounded-md bg-green-50 p-3 text-sm text-green-700">{message}</div>
          )}

          <section className="grid gap-4 rounded-lg border border-gray-200 bg-white p-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="assignment-title" className="block text-sm font-medium text-gray-700">Title</label>
              <input
                id="assignment-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                aria-required="true"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <p id="assignment-description-label" className="block text-sm font-medium text-gray-700">Description</p>
              <div className="mt-1 flex flex-wrap gap-1 rounded-t-md border border-b-0 border-gray-300 bg-gray-50 px-2 py-1">
                <button
                  type="button"
                  onClick={() => execFormat("bold")}
                  className="rounded px-2 py-1 text-xs font-bold text-gray-700 hover:bg-gray-200"
                  title="Bold"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => execFormat("italic")}
                  className="rounded px-2 py-1 text-xs italic text-gray-700 hover:bg-gray-200"
                  title="Italic"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => execFormat("underline")}
                  className="rounded px-2 py-1 text-xs underline text-gray-700 hover:bg-gray-200"
                  title="Underline"
                >
                  U
                </button>
                <span className="mx-1 border-l border-gray-300" />
                <button
                  type="button"
                  onClick={() => execFormat("insertUnorderedList")}
                  className="rounded px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
                  title="Bullet list"
                >
                  &bull; List
                </button>
                <button
                  type="button"
                  onClick={() => execFormat("insertOrderedList")}
                  className="rounded px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
                  title="Numbered list"
                >
                  1. List
                </button>
                <span className="mx-1 border-l border-gray-300" />
                <button
                  type="button"
                  onClick={() => execFormat("formatBlock", "h3")}
                  className="rounded px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                  title="Heading"
                >
                  H
                </button>
                <button
                  type="button"
                  onClick={() => execFormat("removeFormat")}
                  className="rounded px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
                  title="Clear formatting"
                >
                  &times; Clear
                </button>
              </div>
              <div
                ref={descriptionRef}
                id="assignment-description"
                contentEditable
                aria-labelledby="assignment-description-label"
                onInput={() => {
                  if (descriptionRef.current) {
                    setDescription(descriptionRef.current.innerHTML);
                  }
                }}
                className="block min-h-[9rem] w-full rounded-b-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                suppressContentEditableWarning
              />
            </div>

            <div>
              <label htmlFor="assignment-points-possible" className="block text-sm font-medium text-gray-700">Points Possible</label>
              <input
                id="assignment-points-possible"
                type="number"
                min={0}
                value={pointsPossible}
                onChange={(event) => setPointsPossible(event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="assignment-submission-type" className="block text-sm font-medium text-gray-700">Submission Type</label>
              <select
                id="assignment-submission-type"
                value={submissionType}
                onChange={(event) =>
                  setSubmissionType(
                    event.target.value as
                      | "online_text"
                      | "file_upload"
                      | "google_drive_link"
                      | "none",
                  )
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="online_text">Online Text</option>
                <option value="file_upload">File Upload</option>
                <option value="google_drive_link">Google Drive Link</option>
                <option value="none">No Submission</option>
              </select>
            </div>

            <div>
              <label htmlFor="assignment-due-date" className="block text-sm font-medium text-gray-700">Due Date</label>
              <input
                id="assignment-due-date"
                type="datetime-local"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="assignment-available-from" className="block text-sm font-medium text-gray-700">Available From</label>
              <input
                id="assignment-available-from"
                type="datetime-local"
                value={availableFrom}
                onChange={(event) => setAvailableFrom(event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="assignment-available-until" className="block text-sm font-medium text-gray-700">Available Until</label>
              <input
                id="assignment-available-until"
                type="datetime-local"
                value={availableUntil}
                onChange={(event) => setAvailableUntil(event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </section>

          <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-gray-900">Rubric</h2>
              <button
                onClick={() => setShowRubricPicker((previous) => !previous)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Attach Rubric
              </button>
            </div>

            {selectedRubric ? (
              <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                Attached: <span className="font-medium">{selectedRubric.title}</span>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No rubric attached.</p>
            )}

            {showRubricPicker && (
              <div className="space-y-4 rounded-md border border-blue-200 bg-blue-50 p-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-800">Select existing rubric</p>
                  <div className="grid gap-2">
                    {rubrics.map((rubric) => (
                      <button
                        key={rubric.id}
                        onClick={() => attachRubric(rubric.id)}
                        className="rounded-md border border-gray-200 bg-white px-3 py-2 text-left text-sm hover:bg-gray-50"
                      >
                        {rubric.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 border-t border-blue-200 pt-4">
                  <p className="text-sm font-medium text-gray-800">Create New Rubric</p>
                  <div className="grid gap-2 md:grid-cols-[1fr_200px_auto]">
                    <input
                      value={newRubricTitle}
                      onChange={(event) => setNewRubricTitle(event.target.value)}
                      placeholder="Rubric title"
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      min={0}
                      value={newRubricPoints}
                      onChange={(event) => setNewRubricPoints(event.target.value)}
                      placeholder="Points"
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                    <button
                      onClick={createAndAttachRubric}
                      className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Create
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Resources</h2>
            <div className="flex flex-wrap items-center gap-2">
              {user?.google_connected && (
                <GoogleDrivePicker onSelect={attachDriveResource}>
                  <span className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Attach from Google Drive
                  </span>
                </GoogleDrivePicker>
              )}
              <input
                value={manualResourceTitle}
                onChange={(event) => setManualResourceTitle(event.target.value)}
                placeholder="Resource title"
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                value={manualResourceUrl}
                onChange={(event) => setManualResourceUrl(event.target.value)}
                placeholder="https://example.com/resource"
                className="min-w-72 rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <button
                onClick={attachManualResource}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Attach URL
              </button>
            </div>

            {resources.length === 0 ? (
              <p className="text-sm text-gray-500">No resources attached.</p>
            ) : (
              <div className="space-y-2">
                {resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2"
                  >
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {resource.title || resource.url}
                    </a>
                    <button
                      onClick={() => removeResource(resource.id)}
                      className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Standards Alignment</h2>
            <div className="flex flex-wrap gap-2">
              {alignedStandards.map((standard) => (
                <span
                  key={standard.id}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-800"
                >
                  {standard.code}
                  <button
                    onClick={() =>
                      setAlignedStandards((previous) =>
                        previous.filter((entry) => entry.id !== standard.id),
                      )
                    }
                    className="text-blue-700"
                  >
                    x
                  </button>
                </span>
              ))}
              {alignedStandards.length === 0 && (
                <p className="text-sm text-gray-500">No standards selected.</p>
              )}
            </div>

            <input
              value={standardSearch}
              onChange={(event) => setStandardSearch(event.target.value)}
              placeholder="Search standards to add..."
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            {filteredStandards.length > 0 && (
              <div className="space-y-1 rounded-md border border-gray-200 bg-white p-2">
                {filteredStandards.map((standard) => (
                  <button
                    key={standard.id}
                    onClick={() => {
                      setAlignedStandards((previous) => [...previous, standard]);
                      setStandardSearch("");
                    }}
                    className="block w-full rounded-md px-2 py-1 text-left text-sm hover:bg-gray-50"
                  >
                    <span className="font-medium">{standard.code}</span> - {standard.description}
                  </button>
                ))}
              </div>
            )}
          </section>

          {hasCourseMapping && assignment.status === "published" && (
            <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">Google Classroom Sync</h2>
              <p className="text-sm text-gray-600">
                Sync status: {hasAssignmentMapping ? "Linked to Classroom" : "Not yet pushed"}
              </p>
              {classroomSyncMessage && (
                <div className="rounded-md bg-blue-50 p-2 text-sm text-blue-700">
                  {classroomSyncMessage}
                </div>
              )}
              <button
                onClick={pushToClassroom}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Push to Classroom
              </button>
            </section>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
