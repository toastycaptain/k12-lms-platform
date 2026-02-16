"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { ResponsiveTable } from "@/components/ResponsiveTable";
import { apiFetch } from "@/lib/api";
import { GradebookSkeleton } from "@/components/skeletons/GradebookSkeleton";
import { EmptyState } from "@/components/EmptyState";

interface QuizResult {
  quiz: {
    id: number;
    title: string;
    points_possible: number;
    status: string;
  };
  attempts: Array<{
    id: number;
    user_id: number;
    attempt_number: number;
    status: string;
    score: number | null;
    percentage: number | null;
    submitted_at: string | null;
  }>;
}

export default function QuizResultsPage() {
  const params = useParams();
  const quizId = params.quizId as string;

  const [results, setResults] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "score">("name");

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await apiFetch<QuizResult>(`/api/v1/quizzes/${quizId}/results`);
        setResults(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [quizId]);

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <GradebookSkeleton />
        </AppShell>
      </ProtectedRoute>
    );
  }

  const allAttempts = results?.attempts || [];
  const filteredAttempts =
    statusFilter === "all" ? allAttempts : allAttempts.filter((a) => a.status === statusFilter);

  const sortedAttempts = [...filteredAttempts].sort((a, b) => {
    if (sortBy === "score") return (b.score || 0) - (a.score || 0);
    return a.user_id - b.user_id;
  });

  // Summary stats
  const gradedAttempts = allAttempts.filter((a) => a.status === "graded");
  const totalAttempts = allAttempts.length;
  const avgScore =
    gradedAttempts.length > 0
      ? gradedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / gradedAttempts.length
      : 0;
  const avgPercentage =
    gradedAttempts.length > 0
      ? gradedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / gradedAttempts.length
      : 0;
  const highestScore =
    gradedAttempts.length > 0 ? Math.max(...gradedAttempts.map((a) => a.score || 0)) : 0;
  const lowestScore =
    gradedAttempts.length > 0 ? Math.min(...gradedAttempts.map((a) => a.score || 0)) : 0;
  const completionRate =
    totalAttempts > 0
      ? Math.round(
          (allAttempts.filter((a) => a.status !== "in_progress").length / totalAttempts) * 100,
        )
      : 0;

  const STATUS_COLORS: Record<string, string> = {
    in_progress: "bg-yellow-200 text-yellow-900",
    submitted: "bg-blue-100 text-blue-800",
    graded: "bg-green-100 text-green-800",
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href={`/assess/quizzes/${quizId}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                &larr; Back to quiz
              </Link>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">Quiz Results</h1>
              <p className="text-sm text-gray-500">{results?.quiz.title}</p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {[
              { label: "Total Attempts", value: totalAttempts },
              { label: "Avg Score", value: avgScore.toFixed(1) },
              { label: "Avg %", value: `${Math.round(avgPercentage)}%` },
              { label: "High / Low", value: `${highestScore} / ${lowestScore}` },
              { label: "Completion", value: `${completionRate}%` },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted">Submitted</option>
              <option value="graded">Graded</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "name" | "score")}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            >
              <option value="name">Sort by Student</option>
              <option value="score">Sort by Score</option>
            </select>
          </div>

          {/* Attempts Table */}
          {sortedAttempts.length === 0 ? (
            <EmptyState
              title="No attempts found"
              description="No quiz attempts have been submitted yet."
            />
          ) : (
            <ResponsiveTable
              caption="Quiz attempts"
              data={sortedAttempts}
              keyExtractor={(attempt) => attempt.id}
              columns={[
                {
                  key: "student",
                  header: "Student",
                  primary: true,
                  render: (attempt) => `User #${attempt.user_id}`,
                },
                {
                  key: "attempt",
                  header: "Attempt",
                  render: (attempt) => `#${attempt.attempt_number}`,
                },
                {
                  key: "score",
                  header: "Score",
                  render: (attempt) =>
                    attempt.score != null
                      ? `${attempt.score} / ${results?.quiz.points_possible ?? "--"}`
                      : "--",
                },
                {
                  key: "percentage",
                  header: "%",
                  render: (attempt) =>
                    attempt.percentage != null ? `${Math.round(attempt.percentage)}%` : "--",
                },
                {
                  key: "status",
                  header: "Status",
                  render: (attempt) => (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[attempt.status] || ""}`}
                    >
                      {attempt.status}
                    </span>
                  ),
                },
                {
                  key: "submitted_at",
                  header: "Submitted",
                  render: (attempt) =>
                    attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : "--",
                },
                {
                  key: "actions",
                  header: "Actions",
                  render: (attempt) => (
                    <Link
                      href={`/assess/attempts/${attempt.id}/grade`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      Grade
                    </Link>
                  ),
                },
              ]}
            />
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
