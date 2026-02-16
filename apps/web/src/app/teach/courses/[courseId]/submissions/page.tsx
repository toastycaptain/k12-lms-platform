"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ResponsiveTable } from "@/components/ResponsiveTable";
import { apiFetch } from "@/lib/api";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";

interface Assignment {
  id: number;
  title: string;
}

interface Submission {
  id: number;
  assignment_id: number;
  user_id: number;
  submitted_at: string | null;
  status: string;
  grade: string | null;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
}

interface SubmissionRow {
  id: number;
  assignmentId: number;
  assignmentTitle: string;
  userId: number;
  studentName: string;
  submittedAt: string | null;
  status: string;
  grade: number | null;
}

const TEACHER_ROLES = ["admin", "curriculum_lead", "teacher"];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    submitted: "bg-blue-100 text-blue-800",
    graded: "bg-purple-100 text-purple-800",
    returned: "bg-green-100 text-green-800",
    draft: "bg-yellow-200 text-yellow-900",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
}

export default function CourseSubmissionsInboxPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = String(params.courseId);

  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [sortBy, setSortBy] = useState<"submitted_at" | "student_name" | "grade">("submitted_at");

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [runningBulkAction, setRunningBulkAction] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [assignmentData, users] = await Promise.all([
        apiFetch<Assignment[]>(`/api/v1/courses/${courseId}/assignments`),
        apiFetch<User[]>("/api/v1/users"),
      ]);

      setAssignments(assignmentData);
      const usersById = users.reduce<Record<number, User>>((accumulator, user) => {
        accumulator[user.id] = user;
        return accumulator;
      }, {});

      const submissionLists = await Promise.all(
        assignmentData.map((assignment) =>
          apiFetch<Submission[]>(`/api/v1/assignments/${assignment.id}/submissions`),
        ),
      );

      const nextRows = submissionLists.flatMap((submissions, assignmentIndex) => {
        const assignment = assignmentData[assignmentIndex];
        return submissions.map((submission) => {
          const user = usersById[submission.user_id];
          const studentName = user
            ? `${user.first_name} ${user.last_name}`.trim() || `Student #${submission.user_id}`
            : `Student #${submission.user_id}`;

          return {
            id: submission.id,
            assignmentId: assignment.id,
            assignmentTitle: assignment.title,
            userId: submission.user_id,
            studentName,
            submittedAt: submission.submitted_at,
            status: submission.status,
            grade: submission.grade != null ? Number(submission.grade) : null,
          } satisfies SubmissionRow;
        });
      });

      setRows(nextRows);
      setSelectedIds(new Set());
    } catch {
      setError("Unable to load submissions for this course.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const filteredRows = useMemo(() => {
    let result = [...rows];

    if (assignmentFilter !== "all") {
      result = result.filter((row) => row.assignmentId === Number(assignmentFilter));
    }

    if (statusFilter !== "all") {
      result = result.filter((row) => row.status === statusFilter);
    }

    if (startDateFilter) {
      const start = new Date(startDateFilter);
      result = result.filter((row) => {
        if (!row.submittedAt) return false;
        return new Date(row.submittedAt) >= start;
      });
    }

    if (endDateFilter) {
      const end = new Date(endDateFilter);
      end.setHours(23, 59, 59, 999);
      result = result.filter((row) => {
        if (!row.submittedAt) return false;
        return new Date(row.submittedAt) <= end;
      });
    }

    if (sortBy === "submitted_at") {
      result.sort((a, b) => {
        const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      });
    } else if (sortBy === "student_name") {
      result.sort((a, b) => a.studentName.localeCompare(b.studentName));
    } else if (sortBy === "grade") {
      result.sort((a, b) => {
        const aGrade = a.grade ?? -1;
        const bGrade = b.grade ?? -1;
        return bGrade - aGrade;
      });
    }

    return result;
  }, [rows, assignmentFilter, statusFilter, startDateFilter, endDateFilter, sortBy]);

  const submittedCount = rows.filter((row) => row.status === "submitted").length;
  const gradedCount = rows.filter(
    (row) => row.status === "graded" || row.status === "returned",
  ).length;
  const pendingCount = rows.filter((row) => row.status === "submitted").length;

  const allVisibleSelected =
    filteredRows.length > 0 && filteredRows.every((row) => selectedIds.has(row.id));

  function toggleSelect(id: number) {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAllVisible() {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (allVisibleSelected) {
        filteredRows.forEach((row) => next.delete(row.id));
      } else {
        filteredRows.forEach((row) => next.add(row.id));
      }
      return next;
    });
  }

  async function handleGradeAll() {
    const selectedRows = filteredRows.filter((row) => selectedIds.has(row.id));
    if (selectedRows.length === 0) return;

    const first = selectedRows[0];
    router.push(`/teach/courses/${courseId}/assignments/${first.assignmentId}/grade/${first.id}`);
  }

  async function handleReturnAll() {
    const selectedRows = filteredRows.filter((row) => selectedIds.has(row.id));
    if (selectedRows.length === 0) return;

    setRunningBulkAction(true);
    setActionMessage(null);

    try {
      await Promise.all(
        selectedRows.map((row) =>
          apiFetch(`/api/v1/submissions/${row.id}`, {
            method: "PATCH",
            body: JSON.stringify({ status: "returned" }),
          }),
        ),
      );

      setActionMessage(`Marked ${selectedRows.length} submission(s) as returned.`);
      await fetchData();
    } catch {
      setActionMessage("Some submissions could not be returned. Ensure they are graded first.");
    } finally {
      setRunningBulkAction(false);
    }
  }

  return (
    <ProtectedRoute requiredRoles={TEACHER_ROLES}>
      <AppShell>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link
                href={`/teach/courses/${courseId}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                &larr; Back to Course
              </Link>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">Submissions Inbox</h1>
            </div>
          </div>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {actionMessage && (
            <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">{actionMessage}</div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-2xl font-bold text-blue-600">{submittedCount}</p>
              <p className="text-sm text-gray-500">Submitted</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-2xl font-bold text-emerald-600">{gradedCount}</p>
              <p className="text-sm text-gray-500">Graded</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm text-gray-700">
                Assignment
                <select
                  value={assignmentFilter}
                  onChange={(event) => setAssignmentFilter(event.target.value)}
                  className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="all">All</option>
                  {assignments.map((assignment) => (
                    <option key={assignment.id} value={assignment.id}>
                      {assignment.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-gray-700">
                Status
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="all">All</option>
                  <option value="submitted">Submitted</option>
                  <option value="graded">Graded</option>
                  <option value="returned">Returned</option>
                </select>
              </label>

              <label className="text-sm text-gray-700">
                From
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(event) => setStartDateFilter(event.target.value)}
                  className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </label>

              <label className="text-sm text-gray-700">
                To
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(event) => setEndDateFilter(event.target.value)}
                  className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </label>

              <label className="text-sm text-gray-700">
                Sort By
                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value as "submitted_at" | "student_name" | "grade")
                  }
                  className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="submitted_at">Submission Date</option>
                  <option value="student_name">Student Name</option>
                  <option value="grade">Grade</option>
                </select>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={handleGradeAll}
                disabled={selectedIds.size === 0}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Grade All
              </button>
              <button
                onClick={handleReturnAll}
                disabled={selectedIds.size === 0 || runningBulkAction}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {runningBulkAction ? "Returning..." : "Return All"}
              </button>
              <button
                onClick={toggleSelectAllVisible}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {allVisibleSelected ? "Clear Visible" : "Select Visible"}
              </button>
              <span className="text-sm text-gray-500">{selectedIds.size} selected</span>
            </div>
          </div>

          {loading ? (
            <ListSkeleton />
          ) : filteredRows.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-10 text-center">
              <p className="text-sm text-gray-500">No submissions match the current filters.</p>
            </div>
          ) : (
            <ResponsiveTable
              caption="Course submissions"
              data={filteredRows}
              keyExtractor={(row) => row.id}
              onRowClick={(row) =>
                router.push(
                  `/teach/courses/${courseId}/assignments/${row.assignmentId}/grade/${row.id}`,
                )
              }
              columns={[
                {
                  key: "selected",
                  header: "Selected",
                  render: (row) => (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(row.id)}
                      onClick={(event) => event.stopPropagation()}
                      onChange={() => toggleSelect(row.id)}
                    />
                  ),
                },
                {
                  key: "student",
                  header: "Student",
                  primary: true,
                  render: (row) => row.studentName,
                },
                {
                  key: "assignment",
                  header: "Assignment",
                  render: (row) => row.assignmentTitle,
                },
                {
                  key: "submitted_at",
                  header: "Submitted",
                  render: (row) =>
                    row.submittedAt ? new Date(row.submittedAt).toLocaleString() : "-",
                },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => <StatusBadge status={row.status} />,
                },
                {
                  key: "grade",
                  header: "Grade",
                  render: (row) => row.grade ?? "-",
                },
              ]}
            />
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
