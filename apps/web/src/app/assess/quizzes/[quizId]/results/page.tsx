"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/lib/api";

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
    return <ProtectedRoute><AppShell><div className="text-sm text-gray-500">Loading results...</div></AppShell></ProtectedRoute>;
  }

  const allAttempts = results?.attempts || [];
  const filteredAttempts = statusFilter === "all"
    ? allAttempts
    : allAttempts.filter((a) => a.status === statusFilter);

  const sortedAttempts = [...filteredAttempts].sort((a, b) => {
    if (sortBy === "score") return (b.score || 0) - (a.score || 0);
    return a.user_id - b.user_id;
  });

  // Summary stats
  const gradedAttempts = allAttempts.filter((a) => a.status === "graded");
  const totalAttempts = allAttempts.length;
  const avgScore = gradedAttempts.length > 0
    ? gradedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / gradedAttempts.length
    : 0;
  const avgPercentage = gradedAttempts.length > 0
    ? gradedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / gradedAttempts.length
    : 0;
  const highestScore = gradedAttempts.length > 0
    ? Math.max(...gradedAttempts.map((a) => a.score || 0))
    : 0;
  const lowestScore = gradedAttempts.length > 0
    ? Math.min(...gradedAttempts.map((a) => a.score || 0))
    : 0;
  const completionRate = totalAttempts > 0
    ? Math.round((allAttempts.filter((a) => a.status !== "in_progress").length / totalAttempts) * 100)
    : 0;

  const STATUS_COLORS: Record<string, string> = {
    in_progress: "bg-yellow-100 text-yellow-800",
    submitted: "bg-blue-100 text-blue-800",
    graded: "bg-green-100 text-green-800",
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href={`/assess/quizzes/${quizId}`} className="text-sm text-blue-600 hover:text-blue-800">
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
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Student</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Attempt</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Score</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">%</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Submitted</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedAttempts.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">User #{a.user_id}</td>
                    <td className="px-4 py-3">#{a.attempt_number}</td>
                    <td className="px-4 py-3 font-medium">
                      {a.score != null ? `${a.score} / ${results?.quiz.points_possible}` : "--"}
                    </td>
                    <td className="px-4 py-3">
                      {a.percentage != null ? `${Math.round(a.percentage)}%` : "--"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[a.status] || ""}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {a.submitted_at ? new Date(a.submitted_at).toLocaleString() : "--"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/assess/attempts/${a.id}/grade`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Grade
                      </Link>
                    </td>
                  </tr>
                ))}
                {sortedAttempts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No attempts found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
