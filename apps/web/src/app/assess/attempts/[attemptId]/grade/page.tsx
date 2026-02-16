"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/lib/api";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";

interface QuizAttempt {
  id: number;
  quiz_id: number;
  user_id: number;
  attempt_number: number;
  status: string;
  score: number | null;
  percentage: number | null;
}

interface Quiz {
  id: number;
  title: string;
  points_possible: number;
}

interface AttemptAnswer {
  id: number;
  question_id: number;
  answer: Record<string, unknown>;
  is_correct: boolean | null;
  points_awarded: number | null;
  feedback: string | null;
}

interface Question {
  id: number;
  question_type: string;
  prompt: string;
  choices: Array<Record<string, string>>;
  correct_answer: Record<string, unknown>;
  points: number;
}

interface GradeEntry {
  attempt_answer_id: number;
  points_awarded: string;
  feedback: string;
}

interface AllAttempt {
  id: number;
  user_id: number;
  attempt_number: number;
  status: string;
}

export default function AttemptGradePage() {
  const params = useParams();
  const attemptId = params.attemptId as string;
  const router = useRouter();

  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<AttemptAnswer[]>([]);
  const [questions, setQuestions] = useState<Map<number, Question>>(new Map());
  const [grades, setGrades] = useState<Map<number, GradeEntry>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allAttempts, setAllAttempts] = useState<AllAttempt[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const attemptData = await apiFetch<QuizAttempt>(`/api/v1/quiz_attempts/${attemptId}`);
        setAttempt(attemptData);

        const [quizData, answersData, attemptsData] = await Promise.all([
          apiFetch<Quiz>(`/api/v1/quizzes/${attemptData.quiz_id}`),
          apiFetch<AttemptAnswer[]>(`/api/v1/quiz_attempts/${attemptId}/answers`),
          apiFetch<{ attempts: AllAttempt[] }>(`/api/v1/quizzes/${attemptData.quiz_id}/results`)
            .then((r) => r.attempts)
            .catch(() => []),
        ]);
        setQuiz(quizData);
        setAnswers(answersData);
        setAllAttempts(attemptsData);

        // Fetch questions
        const qMap = new Map<number, Question>();
        await Promise.all(
          answersData.map(async (a) => {
            try {
              const q = await apiFetch<Question>(`/api/v1/questions/${a.question_id}`);
              qMap.set(a.question_id, q);
            } catch {
              // ignore
            }
          }),
        );
        setQuestions(qMap);

        // Initialize grade entries from existing data
        const gMap = new Map<number, GradeEntry>();
        for (const a of answersData) {
          gMap.set(a.id, {
            attempt_answer_id: a.id,
            points_awarded: a.points_awarded?.toString() || "",
            feedback: a.feedback || "",
          });
        }
        setGrades(gMap);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [attemptId]);

  function updateGrade(answerId: number, field: "points_awarded" | "feedback", value: string) {
    const newGrades = new Map(grades);
    const entry = newGrades.get(answerId) || {
      attempt_answer_id: answerId,
      points_awarded: "",
      feedback: "",
    };
    entry[field] = value;
    newGrades.set(answerId, entry);
    setGrades(newGrades);
  }

  async function saveGrades() {
    setSaving(true);
    try {
      const gradesList = Array.from(grades.values())
        .filter((g) => g.points_awarded !== "")
        .map((g) => ({
          attempt_answer_id: g.attempt_answer_id,
          points_awarded: parseFloat(g.points_awarded),
          feedback: g.feedback || undefined,
        }));

      await apiFetch(`/api/v1/quiz_attempts/${attemptId}/grade_all`, {
        method: "POST",
        body: JSON.stringify({ grades: gradesList }),
      });

      // Refresh attempt data
      const updated = await apiFetch<QuizAttempt>(`/api/v1/quiz_attempts/${attemptId}`);
      setAttempt(updated);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  // Navigation between attempts
  const currentIdx = allAttempts.findIndex((a) => a.id === parseInt(attemptId));
  const prevAttempt = currentIdx > 0 ? allAttempts[currentIdx - 1] : null;
  const nextAttempt = currentIdx < allAttempts.length - 1 ? allAttempts[currentIdx + 1] : null;

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <ListSkeleton />
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href={`/assess/quizzes/${quiz?.id}/results`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                &larr; Back to results
              </Link>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">Grade Attempt</h1>
              <p className="text-sm text-gray-500">
                {quiz?.title} &mdash; User #{attempt?.user_id}, Attempt #{attempt?.attempt_number}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  attempt?.status === "graded"
                    ? "bg-green-100 text-green-800"
                    : attempt?.status === "submitted"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-yellow-200 text-yellow-900"
                }`}
              >
                {attempt?.status}
              </span>
              {attempt?.score != null && (
                <span className="text-sm font-medium text-gray-700">
                  {attempt.score} / {quiz?.points_possible} (
                  {attempt.percentage != null ? `${Math.round(attempt.percentage)}%` : "--"})
                </span>
              )}
            </div>
          </div>

          {/* Questions and Grading */}
          <div className="space-y-4">
            {answers.map((ans, idx) => {
              const question = questions.get(ans.question_id);
              if (!question) return null;
              const grade = grades.get(ans.id);

              return (
                <div
                  key={ans.id}
                  className="rounded-lg border border-gray-200 bg-white p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Question {idx + 1}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                        {question.question_type}
                      </span>
                      {ans.is_correct != null && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            ans.is_correct
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {ans.is_correct ? "Correct" : "Incorrect"}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-900">{question.prompt}</p>

                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Student Answer: </span>
                    <span className="text-gray-600">{JSON.stringify(ans.answer)}</span>
                  </div>

                  {question.question_type !== "essay" && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Correct Answer: </span>
                      <span className="text-gray-600">
                        {JSON.stringify(question.correct_answer)}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                    <div>
                      <label className="block text-xs font-medium text-gray-600">
                        Points (max {question.points})
                      </label>
                      <input
                        type="number"
                        value={grade?.points_awarded || ""}
                        onChange={(e) => updateGrade(ans.id, "points_awarded", e.target.value)}
                        min="0"
                        max={question.points}
                        step="0.5"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Feedback</label>
                      <textarea
                        value={grade?.feedback || ""}
                        onChange={(e) => updateGrade(ans.id, "feedback", e.target.value)}
                        rows={2}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {prevAttempt && (
                <button
                  onClick={() => router.push(`/assess/attempts/${prevAttempt.id}/grade`)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  &larr; Previous
                </button>
              )}
              {nextAttempt && (
                <button
                  onClick={() => router.push(`/assess/attempts/${nextAttempt.id}/grade`)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Next &rarr;
                </button>
              )}
            </div>
            <button
              onClick={saveGrades}
              disabled={saving}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Grades"}
            </button>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
