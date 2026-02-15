"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch } from "@/lib/api";

interface Course {
  id: number;
  name: string;
  code: string;
  sections?: Section[];
}

interface Section {
  id: number;
  name: string;
  term_id: number;
}

interface Term {
  id: number;
  name: string;
}

interface Assignment {
  id: number;
  course_id: number;
  title: string;
  due_at: string | null;
  points_possible: string | null;
}

interface Submission {
  id: number;
  assignment_id: number;
  status: string;
  grade: string | null;
}

interface AssignmentGradeRow {
  assignmentId: number;
  assignmentTitle: string;
  courseId: number;
  dueAt: string | null;
  pointsPossible: number | null;
  status: string;
  pointsEarned: number | null;
}

interface CourseGradeSummary {
  courseId: number;
  courseName: string;
  courseCode: string;
  sectionLabel: string;
  termLabel: string;
  averagePercent: number | null;
  letterGrade: string;
  assignmentRows: AssignmentGradeRow[];
  distribution: Record<string, number>;
}

const LEARN_ROLES = ["admin", "teacher", "student"];

function toNumber(value: string | null): number | null {
  if (value === null) return null;
  const converted = Number(value);
  return Number.isFinite(converted) ? converted : null;
}

function letterGrade(percent: number | null): string {
  if (percent === null) return "N/A";
  if (percent >= 90) return "A";
  if (percent >= 80) return "B";
  if (percent >= 70) return "C";
  if (percent >= 60) return "D";
  return "F";
}

function distributionBand(percent: number): "A" | "B" | "C" | "D" | "F" {
  if (percent >= 90) return "A";
  if (percent >= 80) return "B";
  if (percent >= 70) return "C";
  if (percent >= 60) return "D";
  return "F";
}

function statusStyle(status: string): string {
  if (status === "graded" || status === "returned") return "bg-green-100 text-green-800";
  if (status === "submitted") return "bg-blue-100 text-blue-800";
  return "bg-gray-100 text-gray-700";
}

export default function LearnGradesPage() {
  const [summaries, setSummaries] = useState<CourseGradeSummary[]>([]);
  const [expandedCourseIds, setExpandedCourseIds] = useState<Set<number>>(new Set());
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("all");
  const [selectedTermFilter, setSelectedTermFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [courses, terms, assignments, submissions] = await Promise.all([
        apiFetch<Course[]>("/api/v1/courses"),
        apiFetch<Term[]>("/api/v1/terms"),
        apiFetch<Assignment[]>("/api/v1/assignments"),
        apiFetch<Submission[]>("/api/v1/submissions"),
      ]);

      const termsById = terms.reduce<Record<number, Term>>((acc, term) => {
        acc[term.id] = term;
        return acc;
      }, {});

      const submissionsByAssignmentId = submissions.reduce<Record<number, Submission>>(
        (acc, submission) => {
          acc[submission.assignment_id] = submission;
          return acc;
        },
        {},
      );

      const nextSummaries = courses.map((course) => {
        const sectionNames = Array.from(
          new Set((course.sections || []).map((section) => section.name)),
        );
        const termNames = Array.from(
          new Set(
            (course.sections || [])
              .map((section) => termsById[section.term_id]?.name)
              .filter((termName): termName is string => Boolean(termName)),
          ),
        );

        const assignmentRows = assignments
          .filter((assignment) => assignment.course_id === course.id)
          .map((assignment) => {
            const submission = submissionsByAssignmentId[assignment.id];
            return {
              assignmentId: assignment.id,
              assignmentTitle: assignment.title,
              courseId: assignment.course_id,
              dueAt: assignment.due_at,
              pointsPossible: toNumber(assignment.points_possible),
              status: submission?.status || "not submitted",
              pointsEarned: toNumber(submission?.grade || null),
            } satisfies AssignmentGradeRow;
          })
          .sort((a, b) => {
            if (!a.dueAt && !b.dueAt) return a.assignmentTitle.localeCompare(b.assignmentTitle);
            if (!a.dueAt) return 1;
            if (!b.dueAt) return -1;
            return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
          });

        const gradedRows = assignmentRows.filter(
          (row) =>
            row.pointsEarned !== null && row.pointsPossible !== null && row.pointsPossible > 0,
        );

        const earnedPoints = gradedRows.reduce((sum, row) => sum + (row.pointsEarned || 0), 0);
        const possiblePoints = gradedRows.reduce((sum, row) => sum + (row.pointsPossible || 0), 0);
        const averagePercent =
          possiblePoints > 0 ? Number(((earnedPoints / possiblePoints) * 100).toFixed(1)) : null;

        const distribution = gradedRows.reduce<Record<string, number>>(
          (acc, row) => {
            const rowPercent = ((row.pointsEarned || 0) / (row.pointsPossible || 1)) * 100;
            const band = distributionBand(rowPercent);
            acc[band] = (acc[band] || 0) + 1;
            return acc;
          },
          { A: 0, B: 0, C: 0, D: 0, F: 0 },
        );

        return {
          courseId: course.id,
          courseName: course.name,
          courseCode: course.code,
          sectionLabel: sectionNames.join(", ") || "No section",
          termLabel: termNames.join(", ") || "No term",
          averagePercent,
          letterGrade: letterGrade(averagePercent),
          assignmentRows,
          distribution,
        } satisfies CourseGradeSummary;
      });

      setSummaries(nextSummaries);
      setExpandedCourseIds(new Set(nextSummaries.map((summary) => summary.courseId)));
    } catch {
      setError("Unable to load grades.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const termFilterOptions = useMemo(() => {
    const terms = new Set<string>();
    summaries.forEach((summary) => {
      if (summary.termLabel !== "No term") terms.add(summary.termLabel);
    });
    return Array.from(terms).sort();
  }, [summaries]);

  const filteredSummaries = useMemo(() => {
    return summaries.filter((summary) => {
      if (selectedCourseFilter !== "all" && String(summary.courseId) !== selectedCourseFilter)
        return false;
      if (selectedTermFilter !== "all" && summary.termLabel !== selectedTermFilter) return false;
      return true;
    });
  }, [selectedCourseFilter, selectedTermFilter, summaries]);

  return (
    <ProtectedRoute requiredRoles={LEARN_ROLES}>
      <AppShell>
        <div className="mx-auto max-w-5xl space-y-6">
          <header>
            <h1 className="text-2xl font-bold text-gray-900">Grades</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track your performance across all enrolled courses.
            </p>
          </header>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-gray-700">
                Course
                <select
                  value={selectedCourseFilter}
                  onChange={(event) => setSelectedCourseFilter(event.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="all">All Courses</option>
                  {summaries.map((summary) => (
                    <option key={summary.courseId} value={String(summary.courseId)}>
                      {summary.courseName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-gray-700">
                Term
                <select
                  value={selectedTermFilter}
                  onChange={(event) => setSelectedTermFilter(event.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="all">All Terms</option>
                  {termFilterOptions.map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {loading ? (
            <p className="text-sm text-gray-500">Loading grades...</p>
          ) : filteredSummaries.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
              No grade data available for this filter.
            </div>
          ) : (
            <section className="space-y-3">
              {filteredSummaries.map((summary) => {
                const isExpanded = expandedCourseIds.has(summary.courseId);
                const gradedCount = Object.values(summary.distribution).reduce(
                  (sum, value) => sum + value,
                  0,
                );
                return (
                  <article
                    key={summary.courseId}
                    className="rounded-lg border border-gray-200 bg-white"
                  >
                    <button
                      className="flex w-full items-center justify-between gap-3 p-4 text-left"
                      onClick={() => {
                        setExpandedCourseIds((previous) => {
                          const next = new Set(previous);
                          if (next.has(summary.courseId)) {
                            next.delete(summary.courseId);
                          } else {
                            next.add(summary.courseId);
                          }
                          return next;
                        });
                      }}
                    >
                      <div>
                        <h2 className="text-sm font-semibold text-gray-900">
                          {summary.courseName}
                        </h2>
                        <p className="text-xs text-gray-500">
                          {summary.courseCode} • {summary.sectionLabel} • {summary.termLabel}
                        </p>
                        <p className="mt-1 text-xs text-gray-600">
                          Current Average:{" "}
                          {summary.averagePercent !== null ? `${summary.averagePercent}%` : "N/A"} (
                          {summary.letterGrade})
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">{isExpanded ? "Hide" : "Show"}</span>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-200 p-4 space-y-4">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Grade Distribution
                          </p>
                          {gradedCount === 0 ? (
                            <p className="mt-1 text-sm text-gray-500">No graded assignments yet.</p>
                          ) : (
                            <div className="mt-2 flex h-3 w-full overflow-hidden rounded-full border border-gray-200">
                              {(["A", "B", "C", "D", "F"] as const).map((band) => {
                                const count = summary.distribution[band] || 0;
                                const width = (count / gradedCount) * 100;
                                const colors: Record<string, string> = {
                                  A: "bg-green-500",
                                  B: "bg-lime-500",
                                  C: "bg-amber-500",
                                  D: "bg-orange-500",
                                  F: "bg-red-500",
                                };
                                return (
                                  <div
                                    key={band}
                                    style={{ width: `${width}%` }}
                                    className={colors[band]}
                                    title={`${band}: ${count}`}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          {summary.assignmentRows.length === 0 ? (
                            <p className="text-sm text-gray-500">No assignments yet.</p>
                          ) : (
                            summary.assignmentRows.map((row) => (
                              <Link
                                key={row.assignmentId}
                                href={`/learn/courses/${row.courseId}/assignments/${row.assignmentId}`}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-2 hover:bg-gray-50"
                              >
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {row.assignmentTitle}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Due:{" "}
                                    {row.dueAt
                                      ? new Date(row.dueAt).toLocaleString()
                                      : "No due date"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle(row.status)}`}
                                  >
                                    {row.status}
                                  </span>
                                  <span className="text-sm text-gray-700">
                                    {row.pointsEarned !== null ? row.pointsEarned : "-"} /{" "}
                                    {row.pointsPossible ?? "-"}
                                  </span>
                                </div>
                              </Link>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </section>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
