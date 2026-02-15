"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Course {
  id: number;
  name: string;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface Assignment {
  id: number;
  title: string;
  course_id: number;
}

interface Quiz {
  id: number;
  course_id: number;
}

interface Submission {
  id: number;
  assignment_id: number;
  user_id: number;
  status: string;
  submitted_at: string | null;
  created_at: string;
}

interface SummaryStats {
  courses: number;
  students: number | null;
  assignments: number;
  quizzes: number;
}

interface RecentSubmissionRow {
  id: number;
  assignmentTitle: string;
  studentLabel: string;
  status: string;
  submittedAt: string;
}

interface SummaryCardProps {
  label: string;
  value: number | null;
  accentClass: string;
}

function SummaryCard({ label, value, accentClass }: SummaryCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className={`mb-3 h-1.5 w-14 rounded ${accentClass}`} />
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value === null ? "N/A" : value.toLocaleString()}</p>
    </div>
  );
}

function statusBadgeClass(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === "graded") return "bg-blue-100 text-blue-700";
  if (normalized === "submitted") return "bg-amber-100 text-amber-700";
  if (normalized === "returned") return "bg-purple-100 text-purple-700";
  return "bg-gray-100 text-gray-700";
}

function submittedTimeValue(row: Submission): number {
  const source = row.submitted_at || row.created_at;
  const timestamp = Date.parse(source);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatSubmittedAt(value: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return "Unknown date";
  }
  return new Date(parsed).toLocaleString();
}

async function fetchAssignments(courses: Course[]): Promise<Assignment[]> {
  try {
    return await apiFetch<Assignment[]>("/api/v1/assignments");
  } catch (error) {
    if (!(error instanceof ApiError) || (error.status !== 404 && error.status !== 405)) {
      throw error;
    }
  }

  const settled = await Promise.allSettled(
    courses.map((course) => apiFetch<Assignment[]>(`/api/v1/courses/${course.id}/assignments`)),
  );
  return settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
}

async function fetchQuizzes(courses: Course[]): Promise<Quiz[]> {
  try {
    return await apiFetch<Quiz[]>("/api/v1/quizzes");
  } catch (error) {
    if (!(error instanceof ApiError) || (error.status !== 404 && error.status !== 405)) {
      throw error;
    }
  }

  const settled = await Promise.allSettled(
    courses.map((course) => apiFetch<Quiz[]>(`/api/v1/courses/${course.id}/quizzes`)),
  );
  return settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
}

async function fetchSubmissions(assignments: Assignment[]): Promise<Submission[]> {
  try {
    return await apiFetch<Submission[]>("/api/v1/submissions");
  } catch (error) {
    if (!(error instanceof ApiError) || (error.status !== 404 && error.status !== 405)) {
      throw error;
    }
  }

  const settled = await Promise.allSettled(
    assignments.map((assignment) => apiFetch<Submission[]>(`/api/v1/assignments/${assignment.id}/submissions`)),
  );
  return settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
}

export default function ReportPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SummaryStats>({
    courses: 0,
    students: 0,
    assignments: 0,
    quizzes: 0,
  });
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canAccess = useMemo(
    () =>
      (user?.roles ?? []).some(
        (role) => role === "admin" || role === "curriculum_lead" || role === "teacher",
      ),
    [user?.roles],
  );

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const courses = await apiFetch<Course[]>("/api/v1/courses");
      const [assignments, quizzes] = await Promise.all([fetchAssignments(courses), fetchQuizzes(courses)]);

      let students: User[] = [];
      let studentCount: number | null = 0;

      try {
        students = await apiFetch<User[]>("/api/v1/users?role=student");
        studentCount = students.length;
      } catch (studentError) {
        if (studentError instanceof ApiError && studentError.status === 403) {
          studentCount = null;
        } else {
          throw studentError;
        }
      }

      const submissions = await fetchSubmissions(assignments);
      const assignmentById = new Map(assignments.map((assignment) => [assignment.id, assignment]));
      const studentById = new Map(students.map((student) => [student.id, student]));

      const recentRows = submissions
        .slice()
        .sort((a, b) => submittedTimeValue(b) - submittedTimeValue(a))
        .slice(0, 10)
        .map((submission) => {
          const assignment = assignmentById.get(submission.assignment_id);
          const student = studentById.get(submission.user_id);
          const source = submission.submitted_at || submission.created_at;

          return {
            id: submission.id,
            assignmentTitle: assignment?.title || `Assignment #${submission.assignment_id}`,
            studentLabel: student
              ? `${student.first_name} ${student.last_name} (${student.email})`
              : `Student #${submission.user_id}`,
            status: submission.status,
            submittedAt: formatSubmittedAt(source),
          };
        });

      setStats({
        courses: courses.length,
        students: studentCount,
        assignments: assignments.length,
        quizzes: quizzes.length,
      });
      setRecentSubmissions(recentRows);
    } catch (reportError) {
      setError(reportError instanceof ApiError ? reportError.message : "Failed to load reporting data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canAccess) {
      setLoading(false);
      return;
    }
    void loadReport();
  }, [canAccess, loadReport]);

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-6xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Report</h1>
            <p className="text-sm text-gray-600">Snapshot metrics and recent submission activity.</p>
          </div>

          {!canAccess && (
            <div className="rounded-md bg-gray-100 p-3 text-sm text-gray-600">
              Access restricted to admin, curriculum lead, and teacher roles.
            </div>
          )}

          {canAccess && error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {canAccess && loading && <div className="text-sm text-gray-500">Loading report...</div>}

          {canAccess && !loading && (
            <>
              <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <SummaryCard label="Total Courses" value={stats.courses} accentClass="bg-blue-500" />
                <SummaryCard label="Total Students" value={stats.students} accentClass="bg-green-500" />
                <SummaryCard label="Total Assignments" value={stats.assignments} accentClass="bg-amber-500" />
                <SummaryCard label="Total Quizzes" value={stats.quizzes} accentClass="bg-rose-500" />
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-gray-900">Recent Submissions</h2>

                {recentSubmissions.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">No submissions yet.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {recentSubmissions.map((submission) => (
                      <article key={submission.id} className="rounded border border-gray-200 bg-gray-50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold text-gray-900">{submission.assignmentTitle}</h3>
                          <span className="text-xs text-gray-500">{submission.submittedAt}</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-700">{submission.studentLabel}</p>
                        <span
                          className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(submission.status)}`}
                        >
                          {submission.status}
                        </span>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
