"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/lib/api";

interface Quiz {
  id: number;
  title: string;
  instructions: string;
  time_limit_minutes: number | null;
  attempts_allowed: number;
  points_possible: number;
  status: string;
}

interface Attempt {
  id: number;
  attempt_number: number;
  status: string;
}

export default function QuizTakePage() {
  const params = useParams();
  const quizId = params.quizId as string;
  const router = useRouter();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [quizData, attemptsData] = await Promise.all([
          apiFetch<Quiz>(`/api/v1/quizzes/${quizId}`),
          apiFetch<Attempt[]>(`/api/v1/quizzes/${quizId}/attempts`),
        ]);
        setQuiz(quizData);
        setAttempts(attemptsData);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [quizId]);

  const attemptsUsed = attempts.length;
  const canStart = quiz?.status === "published" && attemptsUsed < (quiz?.attempts_allowed || 1);

  async function startAttempt() {
    setStarting(true);
    setError("");
    try {
      const attempt = await apiFetch<{ id: number }>(`/api/v1/quizzes/${quizId}/attempts`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      router.push(`/assess/attempts/${attempt.id}`);
    } catch {
      setError("Unable to start attempt. The quiz may be locked or you have reached the maximum attempts.");
      setStarting(false);
    }
  }

  if (loading) {
    return <ProtectedRoute><AppShell><div className="text-sm text-gray-500">Loading...</div></AppShell></ProtectedRoute>;
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-2xl space-y-6">
          <Link href={`/assess/quizzes/${quizId}`} className="text-sm text-blue-600 hover:text-blue-800">
            &larr; Back to quiz
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{quiz?.title}</h1>

          {quiz?.instructions && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Instructions</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{quiz.instructions}</p>
            </div>
          )}

          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Time Limit:</span>{" "}
                <span className="font-medium">{quiz?.time_limit_minutes ? `${quiz.time_limit_minutes} minutes` : "None"}</span>
              </div>
              <div>
                <span className="text-gray-500">Points:</span>{" "}
                <span className="font-medium">{quiz?.points_possible || 0}</span>
              </div>
              <div>
                <span className="text-gray-500">Attempts Allowed:</span>{" "}
                <span className="font-medium">{quiz?.attempts_allowed}</span>
              </div>
              <div>
                <span className="text-gray-500">Attempts Used:</span>{" "}
                <span className="font-medium">{attemptsUsed}</span>
              </div>
            </div>
          </div>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {quiz?.status !== "published" && (
            <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-700">
              This quiz is not currently available.
            </div>
          )}

          {quiz?.status === "published" && !canStart && (
            <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-700">
              You have reached the maximum number of attempts.
            </div>
          )}

          <button
            onClick={startAttempt}
            disabled={!canStart || starting}
            className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {starting ? "Starting..." : "Start Attempt"}
          </button>

          {attempts.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Previous Attempts</h3>
              <div className="space-y-1">
                {attempts.map((a) => (
                  <Link
                    key={a.id}
                    href={`/assess/attempts/${a.id}/results`}
                    className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:shadow-sm"
                  >
                    <span>Attempt #{a.attempt_number}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      a.status === "graded" ? "bg-green-100 text-green-800" :
                      a.status === "submitted" ? "bg-blue-100 text-blue-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>{a.status}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
