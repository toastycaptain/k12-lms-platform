"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api";
import { addonApiFetch, openAddonSignInPopup, resolveAddonToken } from "@/lib/addon-api";
import { useToast } from "@k12/ui";

interface AddonMe {
  id: number;
  name: string;
  email: string;
  tenant_name: string;
}

interface Course {
  id: number;
  name: string;
  code: string;
}

interface Assignment {
  id: number;
  title: string;
  status: string;
  due_at: string | null;
}

interface SyncMapping {
  id: number;
  local_type: string;
  local_id: number;
  external_type: string;
  external_id: string;
  last_synced_at: string | null;
}

function toIsoDateTime(value: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function ClassroomAddonInner() {
  const searchParams = useSearchParams();
  const { addToast } = useToast();

  const addonToken = resolveAddonToken(searchParams);
  const externalCourseId = searchParams.get("courseId") || "";

  const [authState, setAuthState] = useState<"checking" | "authenticated" | "unauthenticated">(
    "checking",
  );
  const [loading, setLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState<AddonMe | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [courseMapping, setCourseMapping] = useState<SyncMapping | null>(null);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentMappings, setAssignmentMappings] = useState<SyncMapping[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDueAt, setNewDueAt] = useState("");

  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [gradeSyncStatus, setGradeSyncStatus] = useState<string | null>(null);
  const [lastGradeSyncAt, setLastGradeSyncAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const linkedAssignmentIds = useMemo(() => {
    return new Set(
      assignmentMappings
        .filter((mapping) => mapping.local_type === "Assignment")
        .map((mapping) => mapping.local_id),
    );
  }, [assignmentMappings]);

  const lastMappedSyncAt = useMemo(() => {
    const stamps = assignmentMappings
      .map((mapping) => mapping.last_synced_at)
      .filter((value): value is string => Boolean(value));

    if (stamps.length === 0) return null;

    return stamps
      .map((stamp) => new Date(stamp))
      .sort((a, b) => b.getTime() - a.getTime())[0]
      .toISOString();
  }, [assignmentMappings]);

  async function loadAssignments(courseId: string) {
    if (!courseId) {
      setAssignments([]);
      setAssignmentMappings([]);
      setSelectedAssignmentId("");
      return;
    }

    const [assignmentRows, mappingRows] = await Promise.all([
      apiFetch<Assignment[]>(`/api/v1/courses/${courseId}/assignments`),
      apiFetch<SyncMapping[]>("/api/v1/sync_mappings?local_type=Assignment"),
    ]);

    setAssignments(assignmentRows);
    setAssignmentMappings(
      mappingRows.filter((mapping) =>
        assignmentRows.some((assignment) => assignment.id === mapping.local_id),
      ),
    );
    setSelectedAssignmentId((prev) => {
      if (prev && assignmentRows.some((assignment) => String(assignment.id) === prev)) return prev;
      return assignmentRows[0] ? String(assignmentRows[0].id) : "";
    });
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      setAuthState("checking");

      try {
        const me = await addonApiFetch<AddonMe>("/api/v1/addon/me", addonToken);
        setCurrentUser(me);
        setAuthState("authenticated");

        const [courseRows, courseMappings] = await Promise.all([
          apiFetch<Course[]>("/api/v1/courses"),
          externalCourseId
            ? apiFetch<SyncMapping[]>(
                `/api/v1/sync_mappings?external_type=classroom_course&external_id=${encodeURIComponent(externalCourseId)}`,
              )
            : Promise.resolve([]),
        ]);

        setCourses(courseRows);
        const mappedCourse =
          courseMappings.find((mapping) => mapping.local_type === "Course") || null;
        setCourseMapping(mappedCourse);

        const initialCourseId = mappedCourse
          ? String(mappedCourse.local_id)
          : String(courseRows[0]?.id || "");
        setSelectedCourseId(initialCourseId);

        if (initialCourseId) {
          await loadAssignments(initialCourseId);
        }
      } catch (loadError) {
        if (loadError instanceof ApiError && loadError.status === 401) {
          setAuthState("unauthenticated");
          setError(
            addonToken
              ? "Your add-on session is not authorized. Sign in and reload Classroom."
              : "Missing add-on token. Open this page from the Classroom Add-on host.",
          );
        } else {
          const message =
            loadError instanceof Error ? loadError.message : "Failed to load Classroom data.";
          setAuthState("unauthenticated");
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [addonToken, externalCourseId]);

  async function handleCourseChange(nextCourseId: string) {
    setSelectedCourseId(nextCourseId);
    setGradeSyncStatus(null);
    setLastGradeSyncAt(null);
    setError(null);

    try {
      await loadAssignments(nextCourseId);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Failed to load assignments.";
      setError(message);
    }
  }

  async function publishAndPush(assignmentId: number) {
    const selected = assignments.find((assignment) => assignment.id === assignmentId);

    if (selected && selected.status !== "published") {
      await apiFetch(`/api/v1/assignments/${assignmentId}/publish`, { method: "POST" });
    }

    await apiFetch(`/api/v1/assignments/${assignmentId}/push_to_classroom`, { method: "POST" });
  }

  async function attachAssignment(assignmentId: number) {
    setBusyKey(`attach-${assignmentId}`);
    setError(null);

    try {
      await publishAndPush(assignmentId);
      addToast("success", "Assignment attached to Classroom.");
      setGradeSyncStatus("Attach successful");
      setLastGradeSyncAt(new Date().toISOString());
      await loadAssignments(selectedCourseId);
    } catch (attachError) {
      const message =
        attachError instanceof Error
          ? attachError.message
          : "Failed to attach assignment to Classroom.";
      setError(message);
      setGradeSyncStatus("Attach failed");
      addToast("error", message);
    } finally {
      setBusyKey(null);
    }
  }

  async function createAssignment() {
    if (!selectedCourseId || !newTitle.trim()) {
      setError("Course and assignment title are required.");
      return;
    }

    setBusyKey("create-assignment");
    setError(null);

    try {
      const created = await apiFetch<Assignment>("/api/v1/assignments", {
        method: "POST",
        body: JSON.stringify({
          course_id: Number(selectedCourseId),
          title: newTitle.trim(),
          description: newDescription.trim() || null,
          assignment_type: "homework",
          due_at: toIsoDateTime(newDueAt),
          submission_types: ["online_text"],
        }),
      });

      await publishAndPush(created.id);
      addToast("success", "Assignment created and pushed to Classroom.");
      setShowCreateForm(false);
      setNewTitle("");
      setNewDescription("");
      setNewDueAt("");
      setGradeSyncStatus("Assignment created and pushed");
      setLastGradeSyncAt(new Date().toISOString());
      await loadAssignments(selectedCourseId);
    } catch (createError) {
      const message =
        createError instanceof Error
          ? createError.message
          : "Failed to create and attach the assignment.";
      setError(message);
      setGradeSyncStatus("Create failed");
      addToast("error", message);
    } finally {
      setBusyKey(null);
    }
  }

  async function syncGrades() {
    if (!selectedAssignmentId) {
      setError("Choose an assignment to sync grades.");
      return;
    }

    setBusyKey("sync-grades");
    setError(null);

    try {
      await apiFetch(`/api/v1/assignments/${selectedAssignmentId}/sync_grades`, { method: "POST" });
      const now = new Date().toISOString();
      setGradeSyncStatus("Last grade sync succeeded");
      setLastGradeSyncAt(now);
      addToast("success", "Grade sync triggered.");
      await loadAssignments(selectedCourseId);
    } catch (syncError) {
      const message = syncError instanceof Error ? syncError.message : "Failed to sync grades.";
      setGradeSyncStatus("Last grade sync failed");
      setError(message);
      addToast("error", message);
    } finally {
      setBusyKey(null);
    }
  }

  if (loading || authState === "checking") {
    return <p className="p-3 text-sm text-slate-500">Loading Classroom add-on…</p>;
  }

  if (authState === "unauthenticated") {
    return (
      <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <h1 className="text-base font-semibold">Sign in to connect</h1>
        <p>Classroom add-on actions require an authenticated add-on session.</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={openAddonSignInPopup}
            className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
          >
            Sign In
          </button>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
          >
            Reload
          </button>
        </div>
        {error && <p className="text-xs text-amber-800">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <header className="rounded-xl border border-slate-200 bg-white p-3">
        <h1 className="text-sm font-semibold text-slate-900">Classroom Add-on</h1>
        <p className="mt-1 text-xs text-slate-500">
          {currentUser?.name} · {currentUser?.tenant_name}
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          Classroom Course ID: {externalCourseId || "(not provided)"}
        </p>
      </header>

      {error && <div className="rounded-md bg-rose-50 p-2 text-xs text-rose-700">{error}</div>}

      <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
        <h2 className="text-sm font-semibold text-slate-900">Course Mapping</h2>
        <select
          value={selectedCourseId}
          onChange={(event) => void handleCourseChange(event.target.value)}
          className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
        >
          <option value="">Select LMS course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name} ({course.code})
            </option>
          ))}
        </select>
        {courseMapping ? (
          <p className="text-[11px] text-emerald-700">
            Mapped to local course #{courseMapping.local_id}
          </p>
        ) : (
          <p className="text-[11px] text-slate-500">
            No existing sync mapping found for this Classroom course.
          </p>
        )}
      </section>

      <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Assignments</h2>
          <button
            onClick={() => setShowCreateForm((prev) => !prev)}
            className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
          >
            {showCreateForm ? "Close" : "Create Assignment"}
          </button>
        </div>

        {showCreateForm && (
          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
            <input
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
              placeholder="Assignment title"
            />
            <textarea
              value={newDescription}
              onChange={(event) => setNewDescription(event.target.value)}
              rows={3}
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
              placeholder="Description"
            />
            <input
              value={newDueAt}
              onChange={(event) => setNewDueAt(event.target.value)}
              type="datetime-local"
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
            />
            <button
              onClick={() => void createAssignment()}
              disabled={busyKey === "create-assignment"}
              className="rounded bg-blue-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {busyKey === "create-assignment" ? "Creating..." : "Create + Attach"}
            </button>
          </div>
        )}

        <div className="space-y-2">
          {assignments.map((assignment) => {
            const linked = linkedAssignmentIds.has(assignment.id);
            return (
              <div key={assignment.id} className="rounded-lg border border-slate-200 p-2">
                <p className="text-xs font-medium text-slate-900">{assignment.title}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {assignment.status} · {linked ? "Linked" : "Not linked"}
                </p>
                <button
                  onClick={() => void attachAssignment(assignment.id)}
                  disabled={busyKey === `attach-${assignment.id}`}
                  className="mt-2 rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {busyKey === `attach-${assignment.id}` ? "Attaching..." : "Attach"}
                </button>
              </div>
            );
          })}
          {assignments.length === 0 && (
            <p className="text-xs text-slate-500">No assignments available.</p>
          )}
        </div>
      </section>

      <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
        <h2 className="text-sm font-semibold text-slate-900">Grade Sync</h2>
        <select
          value={selectedAssignmentId}
          onChange={(event) => setSelectedAssignmentId(event.target.value)}
          className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
        >
          <option value="">Select assignment</option>
          {assignments.map((assignment) => (
            <option key={assignment.id} value={assignment.id}>
              {assignment.title}
            </option>
          ))}
        </select>

        <button
          onClick={() => void syncGrades()}
          disabled={busyKey === "sync-grades" || !selectedAssignmentId}
          className="rounded bg-blue-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {busyKey === "sync-grades" ? "Syncing..." : "Sync Grades"}
        </button>

        <div className="space-y-1 text-[11px] text-slate-600">
          <p>Status: {gradeSyncStatus || "No sync run yet"}</p>
          <p>
            Last sync:{" "}
            {lastGradeSyncAt || lastMappedSyncAt
              ? new Date(lastGradeSyncAt || lastMappedSyncAt || "").toLocaleString()
              : "n/a"}
          </p>
        </div>
      </section>
    </div>
  );
}

export default function ClassroomAddonPage() {
  return (
    <Suspense fallback={<p className="p-3 text-sm text-slate-500">Loading Classroom add-on…</p>}>
      <ClassroomAddonInner />
    </Suspense>
  );
}
