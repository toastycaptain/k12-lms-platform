"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Fragment, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type DistributionBucket = "0-59" | "60-69" | "70-79" | "80-89" | "90-100";

interface ScoreStats {
  mean: number;
  median: number;
  min: number;
  max: number;
  std_dev: number;
}

interface TimeStats {
  mean: number;
  min: number;
  max: number;
}

interface ItemAnalysisRow {
  question_id: number;
  question_number: number;
  prompt: string;
  full_prompt: string;
  question_type: string;
  points: number | string | null;
  total_responses: number;
  correct_count: number;
  difficulty: number | null;
  avg_points: number | null;
  choice_distribution: Record<string, number> | null;
  choice_labels: Record<string, string> | null;
}

interface QuizAnalytics {
  quiz_id: number;
  quiz_title: string;
  total_attempts: number;
  unique_students: number;
  score_stats: ScoreStats;
  score_distribution: Record<DistributionBucket, number>;
  time_stats: TimeStats;
  item_analysis: ItemAnalysisRow[];
}

const TEACHER_ROLES = ["admin", "curriculum_lead", "teacher"];

const SCORE_BUCKETS: Array<{ key: DistributionBucket; colorClass: string; barClass: string }> = [
  { key: "0-59", colorClass: "text-red-700", barClass: "bg-red-500" },
  { key: "60-69", colorClass: "text-orange-700", barClass: "bg-orange-500" },
  { key: "70-79", colorClass: "text-yellow-700", barClass: "bg-yellow-500" },
  { key: "80-89", colorClass: "text-green-700", barClass: "bg-green-500" },
  { key: "90-100", colorClass: "text-blue-700", barClass: "bg-blue-500" },
];

function formatSeconds(seconds: number): string {
  if (!seconds || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function difficultyColor(difficulty: number | null): string {
  if (difficulty === null) return "bg-gray-100 text-gray-700";
  if (difficulty > 0.7) return "bg-green-100 text-green-700";
  if (difficulty >= 0.4) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
}

function questionTypeLabel(questionType: string): string {
  return questionType.replaceAll("_", " ");
}

function questionTypeClass(questionType: string): string {
  const normalized = questionType.toLowerCase();
  if (normalized.includes("multiple")) return "bg-sky-100 text-sky-700";
  if (normalized.includes("true")) return "bg-purple-100 text-purple-700";
  if (normalized.includes("short") || normalized.includes("essay"))
    return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-700";
}

function difficultyPercent(difficulty: number | null): string {
  if (difficulty === null) return "--";
  return `${Math.round(difficulty * 100)}%`;
}

export default function QuizAnalyticsPage() {
  const { user } = useAuth();
  const params = useParams();
  const courseId = String(params.courseId);
  const quizId = String(params.quizId);

  const [analytics, setAnalytics] = useState<QuizAnalytics | null>(null);
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canAccess = useMemo(
    () => (user?.roles ?? []).some((role) => TEACHER_ROLES.includes(role)),
    [user?.roles],
  );

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<QuizAnalytics>(`/api/v1/quizzes/${quizId}/analytics`);
      setAnalytics(data);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError ? requestError.message : "Unable to load analytics.",
      );
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    if (!canAccess) {
      setLoading(false);
      return;
    }

    void fetchAnalytics();
  }, [canAccess, fetchAnalytics]);

  const maxDistributionCount = useMemo(() => {
    if (!analytics) return 1;
    const values = SCORE_BUCKETS.map((bucket) => analytics.score_distribution[bucket.key] || 0);
    return Math.max(1, ...values);
  }, [analytics]);

  function toggleQuestion(questionId: number): void {
    setExpandedQuestionIds((current) =>
      current.includes(questionId)
        ? current.filter((id) => id !== questionId)
        : [questionId, ...current],
    );
  }

  function renderChoiceDistribution(row: ItemAnalysisRow): ReactNode {
    if (!row.choice_distribution) {
      return (
        <p className="text-xs text-gray-500">
          No selectable-answer distribution for this question type.
        </p>
      );
    }

    const entries = Object.entries(row.choice_distribution);
    if (entries.length === 0) {
      return <p className="text-xs text-gray-500">No responses recorded.</p>;
    }

    const maxCount = Math.max(1, ...entries.map(([, count]) => count));

    return (
      <div className="space-y-2">
        {entries
          .slice()
          .sort((a, b) => b[1] - a[1])
          .map(([choiceKey, count]) => {
            const width = Math.max((count / maxCount) * 100, count > 0 ? 4 : 0);
            const labelText = row.choice_labels?.[choiceKey]
              ? `${choiceKey}: ${row.choice_labels[choiceKey]}`
              : choiceKey;

            return (
              <div key={`${row.question_id}-${choiceKey}`} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{labelText}</span>
                  <span>{count}</span>
                </div>
                <div className="h-2 w-full rounded bg-gray-100">
                  <div className="h-2 rounded bg-blue-500" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRoles={TEACHER_ROLES}>
      <AppShell>
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="space-y-1">
            <Link
              href={`/assess/quizzes/${quizId}`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              &larr; Back to Quiz
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Quiz Analytics</h1>
            <p className="text-sm text-gray-600">
              Question-level and class-level performance insights.
            </p>
          </div>

          {!canAccess && (
            <div className="rounded-md bg-gray-100 p-3 text-sm text-gray-600">
              Access restricted to admin, curriculum lead, and teacher roles.
            </div>
          )}

          {canAccess && loading && <p className="text-sm text-gray-500">Loading analytics...</p>}

          {canAccess && error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          {canAccess && analytics && !loading && !error && (
            <>
              {analytics.total_attempts === 0 && (
                <section className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
                  No graded attempts yet. Analytics will populate once students submit and grading
                  is complete.
                </section>
              )}

              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Mean Score</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {analytics.score_stats.mean}%
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Median Score</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {analytics.score_stats.median}%
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Score Range</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {analytics.score_stats.min}% - {analytics.score_stats.max}%
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Std Dev</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {analytics.score_stats.std_dev}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Total Attempts</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {analytics.total_attempts}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Unique Students</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {analytics.unique_students}
                  </p>
                </div>
              </section>

              <div className="grid gap-6 xl:grid-cols-2">
                <section className="rounded-lg border border-gray-200 bg-white p-5">
                  <h2 className="text-lg font-semibold text-gray-900">Score Distribution</h2>
                  <div className="mt-4 space-y-3">
                    {SCORE_BUCKETS.map((bucket) => {
                      const count = analytics.score_distribution[bucket.key] || 0;
                      const width = Math.max(
                        (count / maxDistributionCount) * 100,
                        count > 0 ? 4 : 0,
                      );

                      return (
                        <div key={bucket.key} className="space-y-1">
                          <div
                            className={`flex items-center justify-between text-sm ${bucket.colorClass}`}
                          >
                            <span>{bucket.key}</span>
                            <span>{count} students</span>
                          </div>
                          <div className="h-3 w-full rounded bg-gray-100">
                            <div
                              className={`h-3 rounded ${bucket.barClass}`}
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="rounded-lg border border-gray-200 bg-white p-5">
                  <h2 className="text-lg font-semibold text-gray-900">Time Statistics</h2>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Average Time</p>
                      <p className="mt-1 text-lg font-semibold text-gray-900">
                        {formatSeconds(analytics.time_stats.mean)}
                      </p>
                    </div>
                    <div className="rounded border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Minimum Time</p>
                      <p className="mt-1 text-lg font-semibold text-gray-900">
                        {formatSeconds(analytics.time_stats.min)}
                      </p>
                    </div>
                    <div className="rounded border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Maximum Time</p>
                      <p className="mt-1 text-lg font-semibold text-gray-900">
                        {formatSeconds(analytics.time_stats.max)}
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">Item Analysis</h2>
                  <Link
                    href={`/teach/courses/${courseId}/quiz-performance`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Course Quiz Performance
                  </Link>
                </div>

                {analytics.item_analysis.length === 0 ? (
                  <p className="text-sm text-gray-500">No quiz questions available for analysis.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="border-b border-gray-200 bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">
                            Question
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Type</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">
                            Difficulty
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">
                            Responses
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Correct</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">
                            Avg Points
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {analytics.item_analysis.map((row) => {
                          const expanded = expandedQuestionIds.includes(row.question_id);
                          return (
                            <Fragment key={row.question_id}>
                              <tr className="hover:bg-gray-50">
                                <td className="px-3 py-2 align-top">
                                  <button
                                    type="button"
                                    onClick={() => toggleQuestion(row.question_id)}
                                    className="w-full text-left"
                                  >
                                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                      Question {row.question_number}
                                    </span>
                                    <p className="text-sm font-medium text-gray-900">
                                      {row.prompt}
                                    </p>
                                    <p className="text-xs text-blue-600">
                                      {expanded ? "Hide details" : "Show details"}
                                    </p>
                                  </button>
                                </td>
                                <td className="px-3 py-2 align-top">
                                  <span
                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${questionTypeClass(row.question_type)}`}
                                  >
                                    {questionTypeLabel(row.question_type)}
                                  </span>
                                </td>
                                <td className="px-3 py-2 align-top">
                                  <span
                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColor(row.difficulty)}`}
                                  >
                                    {difficultyPercent(row.difficulty)}
                                  </span>
                                </td>
                                <td className="px-3 py-2 align-top text-gray-700">
                                  {row.total_responses}
                                </td>
                                <td className="px-3 py-2 align-top text-gray-700">
                                  {row.correct_count}
                                </td>
                                <td className="px-3 py-2 align-top text-gray-700">
                                  {row.avg_points !== null ? row.avg_points.toFixed(2) : "--"}
                                </td>
                              </tr>
                              {expanded && (
                                <tr className="bg-gray-50">
                                  <td colSpan={6} className="px-4 py-3">
                                    <div className="space-y-3">
                                      <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                          Full Prompt
                                        </p>
                                        <p className="mt-1 text-sm text-gray-800">
                                          {row.full_prompt}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                          Choice Distribution
                                        </p>
                                        <div className="mt-2">{renderChoiceDistribution(row)}</div>
                                      </div>
                                    </div>
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
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
