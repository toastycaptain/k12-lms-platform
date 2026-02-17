"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { EmptyState } from "@k12/ui";

interface StudentSummary {
  id: number;
  first_name: string | null;
  last_name: string | null;
  name: string;
}

interface CourseProgress {
  id: number;
  name: string;
  code: string | null;
  average: number | null;
  completed_assignments: number;
  total_assignments: number;
  completion_rate: number;
}

interface StandardMastery {
  id: number;
  code: string;
  description: string | null;
  framework: string | null;
  average_score: number | null;
  mastered: boolean;
  attempt_count: number;
}

interface OverallSummary {
  courses_count: number;
  overall_average: number | null;
  total_assignments: number;
  completed_assignments: number;
  completion_rate: number;
  mastered_standards: number;
  total_standards: number;
  mastery_rate: number;
  at_risk_courses: number;
}

interface StudentProgressResponse {
  student: StudentSummary;
  courses: CourseProgress[];
  standards_mastery: StandardMastery[];
  overall: OverallSummary;
}

interface AssignmentProgress {
  id: number;
  title: string;
  due_at: string | null;
  status: string;
  grade: number | null;
  points_possible: number | null;
  percentage: number | null;
}

interface QuizProgress {
  id: number;
  title: string;
  due_at: string | null;
  status: string;
  score: number | null;
  points_possible: number | null;
  percentage: number | null;
}

interface ModuleProgress {
  total_modules: number;
  total_items: number;
  completed_items: number;
  completion_rate: number;
  modules: Array<{
    id: number;
    title: string;
    total_items: number;
    completed_items: number;
    completion_rate: number;
  }>;
}

interface GradeTrendEntry {
  date: string;
  source_type: "assignment" | "quiz";
  source_id: number;
  source_title: string;
  score: number | null;
  points_possible: number | null;
  percentage: number | null;
}

interface CourseDetailResponse {
  course: {
    id: number;
    name: string;
    code: string | null;
  };
  assignments: AssignmentProgress[];
  quizzes: QuizProgress[];
  module_completion: ModuleProgress;
  standards: StandardMastery[];
  grade_trend: GradeTrendEntry[];
}

interface StudentProgressViewProps {
  studentId: number;
  heading: string;
  description: string;
}

function formatPercent(value: number | null): string {
  if (value === null) return "N/A";
  return `${value.toFixed(1)}%`;
}

function formatDate(value: string | null): string {
  if (!value) return "No due date";
  return new Date(value).toLocaleDateString();
}

function scoreLabel(score: number | null, points: number | null): string {
  if (score === null || points === null) return "N/A";
  return `${score.toFixed(1)} / ${points.toFixed(1)}`;
}

export default function StudentProgressView({
  studentId,
  heading,
  description,
}: StudentProgressViewProps) {
  const [progress, setProgress] = useState<StudentProgressResponse | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [courseDetail, setCourseDetail] = useState<CourseDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const summary = await apiFetch<StudentProgressResponse>(
        `/api/v1/students/${studentId}/progress`,
      );
      setProgress(summary);
      setSelectedCourseId(summary.courses[0]?.id ?? null);
    } catch {
      setError("Unable to load progress data.");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    async function fetchCourseDetail() {
      if (!selectedCourseId) {
        setCourseDetail(null);
        return;
      }

      setDetailLoading(true);

      try {
        const detail = await apiFetch<CourseDetailResponse>(
          `/api/v1/students/${studentId}/progress/course/${selectedCourseId}`,
        );
        setCourseDetail(detail);
      } catch {
        setCourseDetail(null);
      } finally {
        setDetailLoading(false);
      }
    }

    void fetchCourseDetail();
  }, [selectedCourseId, studentId]);

  const masteredCount = useMemo(
    () => progress?.standards_mastery.filter((standard) => standard.mastered).length ?? 0,
    [progress?.standards_mastery],
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-7 w-56 animate-pulse rounded bg-gray-200" />
        <div className="grid gap-3 md:grid-cols-3">
          <div className="h-20 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-20 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-20 animate-pulse rounded-lg bg-gray-200" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!progress) {
    return (
      <EmptyState title="No progress data" description="No student progress data is available." />
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">{heading}</h1>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
        <p className="mt-2 text-sm text-gray-700">Student: {progress.student.name || "Student"}</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Overall Average
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {formatPercent(progress.overall.overall_average)}
          </p>
        </article>
        <article className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Assignments Done
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {progress.overall.completed_assignments} / {progress.overall.total_assignments}
          </p>
          <p className="text-xs text-gray-500">{formatPercent(progress.overall.completion_rate)}</p>
        </article>
        <article className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Standards Mastered
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {progress.overall.mastered_standards} / {progress.overall.total_standards}
          </p>
          <p className="text-xs text-gray-500">{formatPercent(progress.overall.mastery_rate)}</p>
        </article>
        <article className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            At-Risk Courses
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {progress.overall.at_risk_courses}
          </p>
        </article>
      </section>

      <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-gray-900">Course Summary</h2>
        {progress.courses.length === 0 ? (
          <EmptyState
            title="No courses"
            description="The student is not enrolled in any courses."
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {progress.courses.map((course) => (
              <article
                key={course.id}
                className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700"
              >
                <p className="font-semibold text-gray-900">{course.name}</p>
                <p className="text-xs text-gray-500">
                  {course.code || "Course"} • Avg {formatPercent(course.average)}
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  Assignments {course.completed_assignments}/{course.total_assignments} (
                  {formatPercent(course.completion_rate)})
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Standards Mastery</h2>
          <p className="text-xs text-gray-500">
            {masteredCount} mastered, {progress.standards_mastery.length - masteredCount} in
            progress
          </p>
        </div>
        {progress.standards_mastery.length === 0 ? (
          <p className="text-sm text-gray-500">No standards-aligned submissions yet.</p>
        ) : (
          <ul className="space-y-2">
            {progress.standards_mastery.map((standard) => (
              <li
                key={standard.id}
                className="flex items-center justify-between gap-3 rounded-md border border-gray-200 p-2 text-sm"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {standard.code} {standard.framework ? `(${standard.framework})` : ""}
                  </p>
                  <p className="text-xs text-gray-500">
                    {standard.description || "No description"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600">{formatPercent(standard.average_score)}</p>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      standard.mastered
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {standard.mastered ? "Mastered" : "Developing"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Course Detail</h2>
          <label className="text-sm text-gray-700">
            Course
            <select
              className="ml-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              value={selectedCourseId ?? ""}
              onChange={(event) => setSelectedCourseId(Number(event.target.value))}
            >
              {progress.courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {detailLoading ? (
          <div className="h-28 animate-pulse rounded bg-gray-200" />
        ) : !courseDetail ? (
          <p className="text-sm text-gray-500">
            Select a course to view assignment and trend detail.
          </p>
        ) : (
          <div className="space-y-5">
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900">Assignment History</h3>
              {courseDetail.assignments.length === 0 ? (
                <p className="text-sm text-gray-500">No assignments available.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                        <th className="px-2 py-2">Assignment</th>
                        <th className="px-2 py-2">Due</th>
                        <th className="px-2 py-2">Status</th>
                        <th className="px-2 py-2">Score</th>
                        <th className="px-2 py-2">Percent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {courseDetail.assignments.map((assignment) => (
                        <tr key={assignment.id}>
                          <td className="px-2 py-2 text-gray-900">{assignment.title}</td>
                          <td className="px-2 py-2 text-gray-600">
                            {formatDate(assignment.due_at)}
                          </td>
                          <td className="px-2 py-2 text-gray-600">{assignment.status}</td>
                          <td className="px-2 py-2 text-gray-600">
                            {scoreLabel(assignment.grade, assignment.points_possible)}
                          </td>
                          <td className="px-2 py-2 text-gray-600">
                            {formatPercent(assignment.percentage)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900">Quiz Results</h3>
              {courseDetail.quizzes.length === 0 ? (
                <p className="text-sm text-gray-500">No quizzes available.</p>
              ) : (
                <ul className="space-y-2">
                  {courseDetail.quizzes.map((quiz) => (
                    <li
                      key={quiz.id}
                      className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700"
                    >
                      <p className="font-medium text-gray-900">{quiz.title}</p>
                      <p className="text-xs text-gray-500">Due {formatDate(quiz.due_at)}</p>
                      <p className="mt-1 text-xs text-gray-600">
                        {quiz.status} • {scoreLabel(quiz.score, quiz.points_possible)} •{" "}
                        {formatPercent(quiz.percentage)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900">Module Completion</h3>
              <p className="text-sm text-gray-600">
                {courseDetail.module_completion.completed_items}/
                {courseDetail.module_completion.total_items} items complete (
                {formatPercent(courseDetail.module_completion.completion_rate)})
              </p>
              {courseDetail.module_completion.modules.length > 0 && (
                <ul className="space-y-2">
                  {courseDetail.module_completion.modules.map((courseModule) => (
                    <li
                      key={courseModule.id}
                      className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700"
                    >
                      <p className="font-medium text-gray-900">{courseModule.title}</p>
                      <p className="text-xs text-gray-600">
                        {courseModule.completed_items}/{courseModule.total_items} items (
                        {formatPercent(courseModule.completion_rate)})
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900">Grade Trend</h3>
              {courseDetail.grade_trend.length === 0 ? (
                <p className="text-sm text-gray-500">No graded work yet.</p>
              ) : (
                <div className="space-y-2">
                  {courseDetail.grade_trend.map((entry) => (
                    <div
                      key={`${entry.source_type}-${entry.source_id}-${entry.date}`}
                      className="space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>
                          {entry.source_title} ({entry.source_type})
                        </span>
                        <span>{formatDate(entry.date)}</span>
                      </div>
                      <div className="h-2 w-full rounded bg-gray-200">
                        <div
                          className="h-2 rounded bg-blue-600"
                          style={{ width: `${Math.max(entry.percentage || 0, 2)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">{formatPercent(entry.percentage)}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </section>
    </div>
  );
}
