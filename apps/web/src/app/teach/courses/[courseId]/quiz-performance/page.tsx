"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch, ApiError } from "@/lib/api";

interface StudentQuizScore {
  quiz_id: number;
  quiz_title: string;
  attempts: number;
  average_score: number | null;
  latest_score: number | null;
}

interface StudentSummary {
  user_id: number;
  name: string;
  quizzes_taken: number;
  average_score: number | null;
  highest_score: number | null;
  lowest_score: number | null;
  quiz_scores: StudentQuizScore[];
}

interface QuizComparison {
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
  students: StudentSummary[];
  quiz_comparison: QuizComparison[];
}

type SortField = "name" | "average_score" | "quizzes_taken";
type SortDirection = "asc" | "desc";

const TEACHER_ROLES = ["admin", "curriculum_lead", "teacher"];

function averageColor(score: number | null): string {
  if (score === null) return "text-gray-500";
  if (score >= 80) return "text-green-700";
  if (score >= 60) return "text-yellow-700";
  return "text-red-700";
}

function displayPercent(value: number | null): string {
  if (value === null) return "--";
  return `${value.toFixed(1)}%`;
}

export default function CourseQuizPerformancePage() {
  const params = useParams();
  const courseId = String(params.courseId);

  const [performance, setPerformance] = useState<CourseQuizPerformance | null>(null);
  const [expandedStudentIds, setExpandedStudentIds] = useState<number[]>([]);
  const [sortField, setSortField] = useState<SortField>("average_score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformance = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<CourseQuizPerformance>(
        `/api/v1/courses/${courseId}/quiz_performance`,
      );
      setPerformance(data);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to load quiz performance.",
      );
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void fetchPerformance();
  }, [fetchPerformance]);

  const sortedStudents = useMemo(() => {
    if (!performance) return [];

    const students = performance.students.slice();
    students.sort((a, b) => {
      if (sortField === "name") {
        const nameComparison = a.name.localeCompare(b.name);
        return sortDirection === "asc" ? nameComparison : -nameComparison;
      }

      if (sortField === "quizzes_taken") {
        const diff = a.quizzes_taken - b.quizzes_taken;
        return sortDirection === "asc" ? diff : -diff;
      }

      const aValue = a.average_score ?? -1;
      const bValue = b.average_score ?? -1;
      const diff = aValue - bValue;
      return sortDirection === "asc" ? diff : -diff;
    });

    return students;
  }, [performance, sortDirection, sortField]);

  function toggleStudent(studentId: number): void {
    setExpandedStudentIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [studentId, ...current],
    );
  }

  function toggleSort(field: SortField): void {
    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection(field === "name" ? "asc" : "desc");
  }

  return (
    <ProtectedRoute requiredRoles={TEACHER_ROLES}>
      <AppShell>
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="space-y-1">
            <Link
              href={`/teach/courses/${courseId}`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              &larr; Back to Course Home
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Course Quiz Performance</h1>
            <p className="text-sm text-gray-600">Class summary and per-student quiz outcomes.</p>
          </header>

          {loading && <p className="text-sm text-gray-500">Loading quiz performance...</p>}

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {!loading && performance && (
            <>
              <section className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Total Quizzes</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {performance.total_quizzes}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Graded Attempts</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {performance.total_graded_attempts}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Class Average</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {displayPercent(performance.class_average)}
                  </p>
                </div>
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">Student Performance</h2>
                  <p className="text-xs text-gray-500">Click a row to expand per-quiz scores.</p>
                </div>

                {performance.students.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No graded quiz attempts found for this course.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="border-b border-gray-200 bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">
                            <button
                              type="button"
                              onClick={() => toggleSort("name")}
                              className="hover:text-blue-700"
                            >
                              Student
                            </button>
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">
                            <button
                              type="button"
                              onClick={() => toggleSort("quizzes_taken")}
                              className="hover:text-blue-700"
                            >
                              Quizzes Taken
                            </button>
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">
                            <button
                              type="button"
                              onClick={() => toggleSort("average_score")}
                              className="hover:text-blue-700"
                            >
                              Average Score
                            </button>
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Highest</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Lowest</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {sortedStudents.map((student) => {
                          const expanded = expandedStudentIds.includes(student.user_id);

                          return (
                            <Fragment key={student.user_id}>
                              <tr className="hover:bg-gray-50">
                                <td className="px-3 py-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleStudent(student.user_id)}
                                    className="text-left"
                                  >
                                    <span className="font-medium text-gray-900">
                                      {student.name}
                                    </span>
                                    <p className="text-xs text-blue-600">
                                      {expanded ? "Hide details" : "Show details"}
                                    </p>
                                  </button>
                                </td>
                                <td className="px-3 py-2 text-gray-700">{student.quizzes_taken}</td>
                                <td
                                  className={`px-3 py-2 font-semibold ${averageColor(student.average_score)}`}
                                >
                                  {displayPercent(student.average_score)}
                                </td>
                                <td className="px-3 py-2 text-gray-700">
                                  {displayPercent(student.highest_score)}
                                </td>
                                <td className="px-3 py-2 text-gray-700">
                                  {displayPercent(student.lowest_score)}
                                </td>
                              </tr>
                              {expanded && (
                                <tr className="bg-gray-50">
                                  <td colSpan={5} className="px-4 py-3">
                                    {student.quiz_scores.length === 0 ? (
                                      <p className="text-xs text-gray-500">
                                        No graded quiz attempts for this student.
                                      </p>
                                    ) : (
                                      <div className="overflow-x-auto rounded border border-gray-200 bg-white">
                                        <table className="min-w-full text-xs sm:text-sm">
                                          <thead className="border-b border-gray-200 bg-gray-50">
                                            <tr>
                                              <th className="px-3 py-2 text-left font-medium text-gray-700">
                                                Quiz
                                              </th>
                                              <th className="px-3 py-2 text-left font-medium text-gray-700">
                                                Attempts
                                              </th>
                                              <th className="px-3 py-2 text-left font-medium text-gray-700">
                                                Average
                                              </th>
                                              <th className="px-3 py-2 text-left font-medium text-gray-700">
                                                Latest
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-100">
                                            {student.quiz_scores.map((quizScore) => (
                                              <tr key={`${student.user_id}-${quizScore.quiz_id}`}>
                                                <td className="px-3 py-2 text-gray-800">
                                                  {quizScore.quiz_title}
                                                </td>
                                                <td className="px-3 py-2 text-gray-700">
                                                  {quizScore.attempts}
                                                </td>
                                                <td className="px-3 py-2 text-gray-700">
                                                  {displayPercent(quizScore.average_score)}
                                                </td>
                                                <td className="px-3 py-2 text-gray-700">
                                                  {displayPercent(quizScore.latest_score)}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-gray-900">Quiz Comparison</h2>

                {performance.quiz_comparison.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">
                    No quizzes are currently published or closed.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {performance.quiz_comparison.map((quiz) => (
                      <div
                        key={quiz.quiz_id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded border border-gray-200 bg-gray-50 px-3 py-3"
                      >
                        <div className="space-y-1">
                          <Link
                            href={`/teach/courses/${courseId}/quizzes/${quiz.quiz_id}/analytics`}
                            className="text-sm font-medium text-blue-700 hover:text-blue-900"
                          >
                            {quiz.title}
                          </Link>
                          <p className="text-xs text-gray-500">
                            {quiz.due_at
                              ? `Due ${new Date(quiz.due_at).toLocaleDateString()}`
                              : "No due date"}
                          </p>
                        </div>
                        <div className="text-sm text-gray-700">
                          <span className="font-semibold">Class Avg:</span>{" "}
                          {displayPercent(quiz.class_average)}
                        </div>
                      </div>
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
