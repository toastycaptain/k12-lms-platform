"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface SyncMapping {
  id: number;
  local_type: string;
  local_id: number;
  external_type: string;
  external_id: string;
}

interface Assignment {
  id: number;
  title: string;
  status: string;
  due_at: string | null;
}

function ClassroomAddonInner() {
  const searchParams = useSearchParams();
  const externalCourseId = searchParams.get("courseId") || "";

  const [courseMapping, setCourseMapping] = useState<SyncMapping | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentMappings, setAssignmentMappings] = useState<SyncMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [pushing, setPushing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const mappedAssignmentIds = useMemo(() => {
    return new Set(
      assignmentMappings
        .filter((mapping) => mapping.local_type === "Assignment")
        .map((mapping) => mapping.local_id),
    );
  }, [assignmentMappings]);

  useEffect(() => {
    async function load() {
      if (!externalCourseId) {
        setError("Missing classroom courseId query parameter.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const mappings = await apiFetch<SyncMapping[]>(
          `/api/v1/sync_mappings?external_id=${encodeURIComponent(externalCourseId)}&external_type=classroom_course`,
        );
        const course = mappings.find((row) => row.local_type === "Course");
        if (!course) {
          setError("No local course mapping found for this Classroom course.");
          setCourseMapping(null);
          setAssignments([]);
          setAssignmentMappings([]);
          return;
        }

        setCourseMapping(course);

        const [courseAssignments, assignmentMapRows] = await Promise.all([
          apiFetch<Assignment[]>(`/api/v1/courses/${course.local_id}/assignments`),
          apiFetch<SyncMapping[]>(`/api/v1/sync_mappings?local_type=Assignment`),
        ]);
        setAssignments(courseAssignments);
        setAssignmentMappings(assignmentMapRows);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to load Classroom add-on data.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [externalCourseId]);

  async function pushAllAssignments() {
    if (!courseMapping) return;
    setPushing(true);
    setError(null);
    setSuccess(null);

    try {
      for (const assignment of assignments) {
        await apiFetch(`/api/v1/assignments/${assignment.id}/push_to_classroom`, { method: "POST" });
      }
      setSuccess("Push triggered for all listed assignments.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to push assignments.";
      setError(message);
    } finally {
      setPushing(false);
    }
  }

  async function syncGrades(assignmentId: number) {
    setError(null);
    setSuccess(null);
    try {
      await apiFetch(`/api/v1/assignments/${assignmentId}/sync_grades`, { method: "POST" });
      setSuccess(`Grade sync triggered for assignment ${assignmentId}.`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to trigger grade sync.";
      setError(message);
    }
  }

  if (loading) {
    return <p className="p-3 text-sm text-slate-500">Loading Classroom add-on panel...</p>;
  }

  return (
    <div className="space-y-4">
      <header className="rounded-lg border border-slate-200 bg-white p-3">
        <h1 className="text-base font-semibold text-slate-900">Classroom Add-on</h1>
        <p className="mt-1 text-xs text-slate-500">External Course ID: {externalCourseId || "-"}</p>
      </header>

      {error && <div className="rounded-md bg-rose-50 p-2 text-xs text-rose-700">{error}</div>}
      {success && <div className="rounded-md bg-emerald-50 p-2 text-xs text-emerald-700">{success}</div>}

      <section className="rounded-lg border border-slate-200 bg-white p-3">
        <h2 className="text-sm font-semibold text-slate-900">Linked Course</h2>
        {courseMapping ? (
          <div className="mt-2 text-xs text-slate-600">
            <p>Local Course ID: {courseMapping.local_id}</p>
            <p>Sync Mapping ID: {courseMapping.id}</p>
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-500">No course linked yet.</p>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Assignments</h2>
          <button
            onClick={() => void pushAllAssignments()}
            disabled={!courseMapping || assignments.length === 0 || pushing}
            className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {pushing ? "Pushing..." : "Push All Assignments"}
          </button>
        </div>

        <div className="mt-2 space-y-2">
          {assignments.map((assignment) => {
            const linked = mappedAssignmentIds.has(assignment.id);
            return (
              <div key={assignment.id} className="rounded border border-slate-200 p-2">
                <p className="text-xs font-medium text-slate-900">{assignment.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Status: {assignment.status} · Classroom Link: {linked ? "Linked" : "Unlinked"}
                </p>
                <div className="mt-1">
                  <button
                    onClick={() => void syncGrades(assignment.id)}
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    Sync Grades
                  </button>
                </div>
              </div>
            );
          })}
          {assignments.length === 0 && <p className="text-xs text-slate-500">No assignments found.</p>}
        </div>
      </section>
    </div>
  );
}

export default function ClassroomAddonPage() {
  return (
    <Suspense fallback={<p className="p-3 text-sm text-slate-500">Loading Classroom add-on panel...</p>}>
      <ClassroomAddonInner />
    </Suspense>
  );
}
