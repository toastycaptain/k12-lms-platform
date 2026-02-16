"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { GradebookSkeleton } from "@/components/skeletons/GradebookSkeleton";
import { EmptyState } from "@/components/EmptyState";

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
  due_at: string | null;
}

interface Quiz {
  id: number;
  title: string;
  course_id: number;
  status: string;
  due_at: string | null;
  updated_at: string;
}

interface Submission {
  id: number;
  assignment_id: number;
  user_id: number;
  status: string;
  submitted_at: string | null;
  created_at: string;
}

interface QuizComparisonRow {
  quiz_id: number;
  title: string;
  status: string;
  due_at: string | null;
  updated_at: string;
  attempt_count: number;
  class_average: number | null;
}

interface CourseQuizPerformance {
  course_id: number;
  total_quizzes: number;
  total_graded_attempts: number;
  class_average: number | null;
  quiz_comparison: QuizComparisonRow[];
}

interface SummaryStats {
  courses: number;
  students: number | null;
  assignments: number;
  quizzes: number;
}

interface AssessmentOverview {
  averageQuizScore: number | null;
  belowSixtyQuizzes: number;
  recentCompletedQuizzes: Array<{
    quizId: number;
    quizTitle: string;
    courseId: number;
    courseName: string;
    classAverage: number | null;
    completedAt: string | null;
  }>;
}

interface SubmissionsOverview {
  submitted: number;
  graded: number;
  returned: number;
  overdue: number;
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
      <p className="mt-1 text-2xl font-bold text-gray-900">
        {value === null ? "N/A" : value.toLocaleString()}
      </p>
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

function formatPercent(value: number | null): string {
  if (value === null) return "N/A";
  return `${value.toFixed(1)}%`;
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
    assignments.map((assignment) =>
      apiFetch<Submission[]>(`/api/v1/assignments/${assignment.id}/submissions`),
    ),
  );
  return settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
}

async function fetchCourseQuizPerformance(courses: Course[]): Promise<CourseQuizPerformance[]> {
  const settled = await Promise.allSettled(
    courses.map((course) =>
      apiFetch<CourseQuizPerformance>(`/api/v1/courses/${course.id}/quiz_performance`),
    ),
  );
  return settled
    .filter(
      (result): result is PromiseFulfilledResult<CourseQuizPerformance> =>
        result.status === "fulfilled",
    )
    .map((result) => result.value);
}

function isOverdueSubmission(
  submission: Submission,
  assignmentById: Map<number, Assignment>,
): boolean {
  const assignment = assignmentById.get(submission.assignment_id);
  if (!assignment?.due_at) return false;

  const dueAt = Date.parse(assignment.due_at);
  const submittedSource = submission.submitted_at || submission.created_at;
  const submittedAt = Date.parse(submittedSource);

  if (Number.isNaN(dueAt) || Number.isNaN(submittedAt)) return false;
  return submittedAt > dueAt;
}

export default function ReportPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SummaryStats>({
    courses: 0,
    students: 0,
    assignments: 0,
    quizzes: 0,
  });
  const [assessmentOverview, setAssessmentOverview] = useState<AssessmentOverview>({
    averageQuizScore: null,
    belowSixtyQuizzes: 0,
    recentCompletedQuizzes: [],
  });
  const [submissionsOverview, setSubmissionsOverview] = useState<SubmissionsOverview>({
    submitted: 0,
    graded: 0,
    returned: 0,
    overdue: 0,
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
      const [assignments, quizzes, courseSummaries] = await Promise.all([
        fetchAssignments(courses),
        fetchQuizzes(courses),
        fetchCourseQuizPerformance(courses),
      ]);

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
      const courseById = new Map(courses.map((course) => [course.id, course]));

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

      const statusCounts = submissions.reduce(
        (accumulator, submission) => {
          const status = submission.status.toLowerCase();
          if (status === "submitted") accumulator.submitted += 1;
          if (status === "graded") accumulator.graded += 1;
          if (status === "returned") accumulator.returned += 1;
          return accumulator;
        },
        { submitted: 0, graded: 0, returned: 0 },
      );

      const overdueCount = submissions.filter((submission) =>
        isOverdueSubmission(submission, assignmentById),
      ).length;

      let weightedScoreTotal = 0;
      let weightedAttemptTotal = 0;

      courseSummaries.forEach((summary) => {
        if (summary.class_average === null || summary.total_graded_attempts === 0) return;
        weightedScoreTotal += summary.class_average * summary.total_graded_attempts;
        weightedAttemptTotal += summary.total_graded_attempts;
      });

      const averageQuizScore =
        weightedAttemptTotal > 0
          ? Number((weightedScoreTotal / weightedAttemptTotal).toFixed(1))
          : null;

      const allQuizRows = courseSummaries.flatMap((summary) =>
        summary.quiz_comparison.map((quizRow) => ({
          ...quizRow,
          courseId: summary.course_id,
          courseName: courseById.get(summary.course_id)?.name || `Course #${summary.course_id}`,
        })),
      );

      const belowSixtyQuizzes = allQuizRows.filter(
        (quiz) => quiz.class_average !== null && quiz.class_average < 60,
      ).length;

      const recentCompletedQuizzes = allQuizRows
        .filter((quiz) => quiz.class_average !== null)
        .sort((a, b) => {
          const aTimestamp = Date.parse(a.due_at || a.updated_at || "");
          const bTimestamp = Date.parse(b.due_at || b.updated_at || "");
          return (
            (Number.isNaN(bTimestamp) ? 0 : bTimestamp) -
            (Number.isNaN(aTimestamp) ? 0 : aTimestamp)
          );
        })
        .slice(0, 5)
        .map((quiz) => ({
          quizId: quiz.quiz_id,
          quizTitle: quiz.title,
          courseId: quiz.courseId,
          courseName: quiz.courseName,
          classAverage: quiz.class_average,
          completedAt: quiz.due_at || quiz.updated_at || null,
        }));

      setStats({
        courses: courses.length,
        students: studentCount,
        assignments: assignments.length,
        quizzes: quizzes.length,
      });
      setAssessmentOverview({
        averageQuizScore,
        belowSixtyQuizzes,
        recentCompletedQuizzes,
      });
      setSubmissionsOverview({
        submitted: statusCounts.submitted,
        graded: statusCounts.graded,
        returned: statusCounts.returned,
        overdue: overdueCount,
      });
      setRecentSubmissions(recentRows);
    } catch (reportError) {
      setError(
        reportError instanceof ApiError ? reportError.message : "Failed to load reporting data.",
      );
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
            <p className="text-sm text-gray-600">
              Snapshot metrics and recent submission activity.
            </p>
          </div>

          {!canAccess && (
            <div className="rounded-md bg-gray-100 p-3 text-sm text-gray-600">
              Access restricted to admin, curriculum lead, and teacher roles.
            </div>
          )}

          {canAccess && error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          {canAccess && loading && <GradebookSkeleton />}

          {canAccess && !loading && (
            <>
              <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <SummaryCard
                  label="Total Courses"
                  value={stats.courses}
                  accentClass="bg-blue-500"
                />
                <SummaryCard
                  label="Total Students"
                  value={stats.students}
                  accentClass="bg-green-500"
                />
                <SummaryCard
                  label="Total Assignments"
                  value={stats.assignments}
                  accentClass="bg-amber-500"
                />
                <SummaryCard
                  label="Total Quizzes"
                  value={stats.quizzes}
                  accentClass="bg-rose-500"
                />
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-gray-900">Assessment Overview</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div className="rounded border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Average Quiz Score
                    </p>
                    <p className="mt-1 text-xl font-semibold text-gray-900">
                      {formatPercent(assessmentOverview.averageQuizScore)}
                    </p>
                  </div>
                  <div className="rounded border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Quizzes Below 60%
                    </p>
                    <p className="mt-1 text-xl font-semibold text-red-700">
                      {assessmentOverview.belowSixtyQuizzes}
                    </p>
                  </div>
                  <div className="rounded border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Recent Completed Quizzes
                    </p>
                    <p className="mt-1 text-xl font-semibold text-gray-900">
                      {assessmentOverview.recentCompletedQuizzes.length}
                    </p>
                  </div>
                </div>

                {assessmentOverview.recentCompletedQuizzes.length === 0 ? (
                  <div className="mt-4">
                    <EmptyState
                      title="No completed quizzes"
                      description="No completed quizzes with graded attempts yet."
                    />
                  </div>
                ) : (
                  <div className="mt-4 space-y-2">
                    {assessmentOverview.recentCompletedQuizzes.map((quiz) => (
                      <div
                        key={`recent-quiz-${quiz.courseId}-${quiz.quizId}`}
                        className="flex flex-wrap items-center justify-between gap-2 rounded border border-gray-200 bg-gray-50 px-3 py-2"
                      >
                        <div>
                          <Link
                            href={`/teach/courses/${quiz.courseId}/quizzes/${quiz.quizId}/analytics`}
                            className="text-sm font-medium text-blue-700 hover:text-blue-900"
                          >
                            {quiz.quizTitle}
                          </Link>
                          <p className="text-xs text-gray-500">
                            {quiz.courseName}
                            {quiz.completedAt
                              ? ` - ${new Date(quiz.completedAt).toLocaleDateString()}`
                              : ""}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-gray-800">
                          {formatPercent(quiz.classAverage)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-gray-900">Submissions Overview</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-4">
                  <div className="rounded border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Submitted</p>
                    <p className="mt-1 text-xl font-semibold text-amber-700">
                      {submissionsOverview.submitted}
                    </p>
                  </div>
                  <div className="rounded border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Graded</p>
                    <p className="mt-1 text-xl font-semibold text-blue-700">
                      {submissionsOverview.graded}
                    </p>
                  </div>
                  <div className="rounded border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Returned</p>
                    <p className="mt-1 text-xl font-semibold text-purple-700">
                      {submissionsOverview.returned}
                    </p>
                  </div>
                  <div className="rounded border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Overdue</p>
                    <p className="mt-1 text-xl font-semibold text-red-700">
                      {submissionsOverview.overdue}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-gray-900">Recent Submissions</h2>

                {recentSubmissions.length === 0 ? (
                  <div className="mt-3">
                    <EmptyState
                      title="No submissions yet"
                      description="Recent submissions will appear here."
                    />
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    {recentSubmissions.map((submission) => (
                      <article
                        key={submission.id}
                        className="rounded border border-gray-200 bg-gray-50 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold text-gray-900">
                            {submission.assignmentTitle}
                          </h3>
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
