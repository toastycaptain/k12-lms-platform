"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { EmptyState } from "@/components/EmptyState";
import { GradebookSkeleton } from "@/components/skeletons/GradebookSkeleton";
import { apiFetch, buildApiUrl } from "@/lib/api";

interface GradeCell {
  assignment_id: number;
  assignment_title: string;
  assignment_type: string;
  submission_id: number | null;
  grade: number | null;
  points_possible: number | null;
  percentage: number | null;
  status: string;
  submitted: boolean;
  late: boolean;
  missing: boolean;
  due_at: string | null;
  submitted_at: string | null;
}

interface QuizGradeCell {
  quiz_id: number;
  title: string;
  attempt_id: number | null;
  score: number | null;
  points_possible: number | null;
  percentage: number | null;
  status: string;
  submitted_at: string | null;
}

interface MasterySummary {
  threshold: number;
  mastered_standards: number;
  total_standards: number;
  percentage: number | null;
}

interface StudentRow {
  id: number;
  name: string;
  email: string;
  grades: GradeCell[];
  quiz_grades: QuizGradeCell[];
  course_average: number | null;
  missing_count: number;
  late_count: number;
  mastery: MasterySummary | null;
}

interface AssignmentSummary {
  id: number;
  title: string;
  due_at: string | null;
  points_possible: number | null;
  submission_count: number;
  graded_count: number;
  average: number | null;
  median: number | null;
}

interface QuizSummary {
  id: number;
  title: string;
  points_possible: number | null;
}

interface CourseSummary {
  student_count: number;
  assignment_count: number;
  quiz_count: number;
  overall_average: number | null;
  grade_distribution: Record<string, number>;
  assignment_completion_rate: number;
  students_with_missing_work: number;
  category_averages: Record<string, number | null>;
}

interface GradebookResponse {
  students: StudentRow[];
  assignments: AssignmentSummary[];
  quizzes: QuizSummary[];
  course_summary: CourseSummary;
  mastery_threshold: number;
}

const TEACHER_ROLES = ["admin", "curriculum_lead", "teacher"];

function formatScore(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  return value.toFixed(1);
}

function averagePercent(values: Array<number | null>): number | null {
  const present = values.filter((value): value is number => value !== null);
  if (present.length === 0) {
    return null;
  }

  return present.reduce((sum, value) => sum + value, 0) / present.length;
}

function gradeTone(cell: GradeCell): string {
  if (cell.missing) {
    return "border-slate-200 bg-slate-100 text-slate-500";
  }

  if (cell.percentage === null) {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }

  if (cell.percentage >= 90) {
    return "border-green-200 bg-green-50 text-green-800";
  }

  if (cell.percentage >= 70) {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  if (cell.percentage >= 60) {
    return "border-orange-200 bg-orange-50 text-orange-900";
  }

  return "border-red-200 bg-red-50 text-red-900";
}

function statusLabel(cell: GradeCell): string {
  if (cell.missing) {
    return "MISS";
  }

  if (cell.late) {
    return "LATE";
  }

  if (cell.submitted) {
    return "OK";
  }

  return "-";
}

export default function GradebookPage() {
  const params = useParams();
  const courseId = String(params.courseId);

  const [gradebook, setGradebook] = useState<GradebookResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState<string>("name");
  const [minimumAverage, setMinimumAverage] = useState<string>("all");
  const [missingOnly, setMissingOnly] = useState(false);
  const [lateOnly, setLateOnly] = useState(false);
  const [showQuizGrades, setShowQuizGrades] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = await apiFetch<GradebookResponse>(`/api/v1/courses/${courseId}/gradebook`);
      setGradebook(payload);
    } catch {
      setError("Unable to load gradebook data.");
      setGradebook(null);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const assignmentById = useMemo(() => {
    const map = new Map<number, AssignmentSummary>();
    gradebook?.assignments.forEach((assignment) => {
      map.set(assignment.id, assignment);
    });
    return map;
  }, [gradebook]);

  const filteredStudents = useMemo(() => {
    if (!gradebook) {
      return [];
    }

    const minimum = minimumAverage === "all" ? null : Number(minimumAverage);

    const students = gradebook.students.filter((student) => {
      if (minimum !== null) {
        const average = student.course_average ?? -1;
        if (average < minimum) {
          return false;
        }
      }

      if (missingOnly && student.missing_count === 0) {
        return false;
      }

      if (lateOnly && student.late_count === 0) {
        return false;
      }

      return true;
    });

    return [...students].sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }

      if (sortBy === "course_average") {
        return (b.course_average ?? -1) - (a.course_average ?? -1);
      }

      if (sortBy.startsWith("assignment:")) {
        const assignmentId = Number(sortBy.replace("assignment:", ""));
        const aScore =
          a.grades.find((cell) => cell.assignment_id === assignmentId)?.percentage ?? -1;
        const bScore =
          b.grades.find((cell) => cell.assignment_id === assignmentId)?.percentage ?? -1;
        return bScore - aScore;
      }

      return 0;
    });
  }, [gradebook, lateOnly, minimumAverage, missingOnly, sortBy]);

  const classQuizAverage = gradebook?.course_summary.category_averages.quiz ?? null;

  const handleExport = useCallback(() => {
    const exportPath = `/api/v1/courses/${courseId}/gradebook/export`;
    window.open(buildApiUrl(exportPath), "_blank", "noopener,noreferrer");
  }, [courseId]);

  return (
    <ProtectedRoute requiredRoles={TEACHER_ROLES}>
      <AppShell>
        <div className="mx-auto max-w-[95vw] space-y-6 xl:max-w-[1500px]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Link
                href={`/teach/courses/${courseId}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                &larr; Back to Course
              </Link>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">Gradebook</h1>
              <p className="text-sm text-gray-600">
                Track grades, missing work, and standards mastery in one grid.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExport}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Export CSV
            </button>
          </div>

          {loading ? (
            <GradebookSkeleton />
          ) : !gradebook ? (
            <EmptyState
              title="Unable to load gradebook"
              description={error ?? "Try again from the course page."}
            />
          ) : gradebook.students.length === 0 ? (
            <EmptyState
              title="No gradebook records yet"
              description="Grades will appear here as students submit assignments and quizzes."
            />
          ) : (
            <>
              <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-1">
                  <label
                    htmlFor="sort-by"
                    className="text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    Sort By
                  </label>
                  <select
                    id="sort-by"
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
                  >
                    <option value="name">Student Name</option>
                    <option value="course_average">Course Average</option>
                    {gradebook.assignments.map((assignment) => (
                      <option key={assignment.id} value={`assignment:${assignment.id}`}>
                        {assignment.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="average-filter"
                    className="text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    Grade Range
                  </label>
                  <select
                    id="average-filter"
                    value={minimumAverage}
                    onChange={(event) => setMinimumAverage(event.target.value)}
                    className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
                  >
                    <option value="all">All averages</option>
                    <option value="90">90% and up</option>
                    <option value="80">80% and up</option>
                    <option value="70">70% and up</option>
                    <option value="60">60% and up</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={missingOnly}
                    onChange={(event) => setMissingOnly(event.target.checked)}
                  />
                  Missing Work Only
                </label>

                <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={lateOnly}
                    onChange={(event) => setLateOnly(event.target.checked)}
                  />
                  Late Submissions Only
                </label>

                <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={showQuizGrades}
                    onChange={(event) => setShowQuizGrades(event.target.checked)}
                  />
                  Show Quiz Grades
                </label>
              </div>

              <details className="overflow-hidden rounded-lg border border-slate-200 bg-white" open>
                <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-800">
                  Class Summary
                </summary>
                <div className="grid gap-4 border-t border-slate-200 p-4 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Class Average</p>
                    <p className="text-xl font-semibold text-slate-900">
                      {formatScore(gradebook.course_summary.overall_average)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Grade Distribution
                    </p>
                    <p className="text-sm text-slate-700">
                      {Object.entries(gradebook.course_summary.grade_distribution)
                        .map(([bucket, count]) => `${bucket}:${count}`)
                        .join(" | ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Completion Rate
                    </p>
                    <p className="text-xl font-semibold text-slate-900">
                      {formatScore(gradebook.course_summary.assignment_completion_rate)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Missing Work Students
                    </p>
                    <p className="text-xl font-semibold text-slate-900">
                      {gradebook.course_summary.students_with_missing_work}
                    </p>
                  </div>
                </div>
              </details>

              <div className="overflow-auto rounded-lg border border-slate-200 bg-white">
                <table className="min-w-full border-collapse text-sm" aria-label="Gradebook grid">
                  <thead>
                    <tr>
                      <th className="sticky left-0 top-0 z-30 border-b border-r border-slate-200 bg-slate-50 p-2 text-left font-semibold text-slate-700">
                        Student
                      </th>
                      {gradebook.assignments.map((assignment) => (
                        <th
                          key={assignment.id}
                          className="sticky top-0 z-20 h-20 min-w-28 border-b border-r border-slate-200 bg-slate-50 p-2 text-left font-semibold text-slate-700"
                        >
                          <span className="inline-block origin-bottom-left -rotate-12 whitespace-nowrap text-xs">
                            {assignment.title}
                          </span>
                        </th>
                      ))}
                      {showQuizGrades && (
                        <th className="sticky top-0 z-20 min-w-28 border-b border-r border-slate-200 bg-slate-50 p-2 text-left font-semibold text-slate-700">
                          Quiz Avg
                        </th>
                      )}
                      <th className="sticky top-0 z-20 min-w-24 border-b border-r border-slate-200 bg-slate-50 p-2 text-left font-semibold text-slate-700">
                        Course Avg
                      </th>
                      <th className="sticky top-0 z-20 min-w-20 border-b border-r border-slate-200 bg-slate-50 p-2 text-left font-semibold text-slate-700">
                        Missing
                      </th>
                      <th className="sticky top-0 z-20 min-w-16 border-b border-r border-slate-200 bg-slate-50 p-2 text-left font-semibold text-slate-700">
                        Late
                      </th>
                      <th className="sticky top-0 z-20 min-w-36 border-b border-slate-200 bg-slate-50 p-2 text-left font-semibold text-slate-700">
                        Mastery
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr
                        key={student.id}
                        data-testid={`student-row-${student.id}`}
                        className="border-b border-slate-100"
                      >
                        <th className="sticky left-0 z-10 min-w-52 border-r border-slate-200 bg-white p-2 text-left align-top">
                          <div className="font-medium text-slate-900">{student.name}</div>
                          <div className="text-xs text-slate-500">{student.email}</div>
                        </th>

                        {gradebook.assignments.map((assignment) => {
                          const cell = student.grades.find(
                            (item) => item.assignment_id === assignment.id,
                          );
                          if (!cell) {
                            return (
                              <td
                                key={assignment.id}
                                className="border-r border-slate-100 p-2 text-slate-400"
                              >
                                -
                              </td>
                            );
                          }

                          const cellContent = (
                            <div
                              className={`rounded border px-2 py-1 text-xs font-semibold ${gradeTone(cell)}`}
                              title={`${cell.assignment_title} | ${statusLabel(cell)}`}
                            >
                              <div>{cell.grade === null ? "-" : formatScore(cell.grade)}</div>
                              <div className="text-[10px] uppercase tracking-wide">
                                {statusLabel(cell)}
                              </div>
                            </div>
                          );

                          return (
                            <td key={assignment.id} className="border-r border-slate-100 p-2">
                              {cell.submission_id ? (
                                <Link
                                  href={`/teach/submissions/${cell.submission_id}/grade`}
                                  className="block"
                                >
                                  {cellContent}
                                </Link>
                              ) : (
                                cellContent
                              )}
                            </td>
                          );
                        })}

                        {showQuizGrades && (
                          <td className="border-r border-slate-100 p-2 font-medium text-slate-700">
                            {formatScore(
                              averagePercent(
                                student.quiz_grades.map((quizGrade) => quizGrade.percentage),
                              ),
                            )}
                            %
                          </td>
                        )}

                        <td className="border-r border-slate-100 p-2 font-semibold text-slate-900">
                          {formatScore(student.course_average)}%
                        </td>
                        <td className="border-r border-slate-100 p-2 text-center font-semibold text-slate-800">
                          {student.missing_count}
                        </td>
                        <td className="border-r border-slate-100 p-2 text-center font-semibold text-slate-800">
                          {student.late_count}
                        </td>
                        <td className="p-2">
                          {student.mastery ? (
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                (student.mastery.percentage ?? 0) >= gradebook.mastery_threshold
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {formatScore(student.mastery.percentage)}%
                              {` (${student.mastery.mastered_standards}/${student.mastery.total_standards})`}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-300 bg-slate-50">
                      <th className="sticky bottom-0 left-0 z-10 border-r border-slate-200 p-2 text-left text-xs uppercase tracking-wide text-slate-600">
                        Class Avg
                      </th>
                      {gradebook.assignments.map((assignment) => (
                        <td
                          key={assignment.id}
                          className="border-r border-slate-200 p-2 text-xs font-semibold text-slate-700"
                        >
                          {formatScore(assignmentById.get(assignment.id)?.average ?? null)}%
                        </td>
                      ))}
                      {showQuizGrades && (
                        <td className="border-r border-slate-200 p-2 text-xs font-semibold text-slate-700">
                          {formatScore(classQuizAverage)}%
                        </td>
                      )}
                      <td className="border-r border-slate-200 p-2 text-xs font-semibold text-slate-900">
                        {formatScore(gradebook.course_summary.overall_average)}%
                      </td>
                      <td className="border-r border-slate-200 p-2 text-center text-xs font-semibold text-slate-700">
                        {gradebook.course_summary.students_with_missing_work}
                      </td>
                      <td className="border-r border-slate-200 p-2 text-center text-xs font-semibold text-slate-700">
                        -
                      </td>
                      <td className="p-2 text-xs text-slate-600">
                        Threshold: {formatScore(gradebook.mastery_threshold)}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
