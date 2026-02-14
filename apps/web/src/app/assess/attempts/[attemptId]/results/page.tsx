"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/lib/api";

interface QuizAttempt {
  id: number;
  quiz_id: number;
  status: string;
  score: number | null;
  percentage: number | null;
  started_at: string;
  submitted_at: string | null;
  time_spent_seconds: number | null;
}

interface Quiz {
  id: number;
  title: string;
  points_possible: number;
  show_results: string;
  due_at: string | null;
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
  choices: Array<{ text: string; key: string }>;
  correct_answer: Record<string, unknown>;
  explanation: string | null;
  points: number;
}

export default function AttemptResultsPage() {
  const params = useParams();
  const attemptId = params.attemptId as string;

  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<AttemptAnswer[]>([]);
  const [questions, setQuestions] = useState<Map<number, Question>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const attemptData = await apiFetch<QuizAttempt>(`/api/v1/quiz_attempts/${attemptId}`);
        setAttempt(attemptData);

        const [quizData, answersData] = await Promise.all([
          apiFetch<Quiz>(`/api/v1/quizzes/${attemptData.quiz_id}`),
          apiFetch<AttemptAnswer[]>(`/api/v1/quiz_attempts/${attemptId}/answers`),
        ]);
        setQuiz(quizData);
        setQuizAnswers(answersData);

        // Fetch questions if results should show details
        if (quizData.show_results === "after_submit" || quizData.show_results === "never") {
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
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [attemptId]);

  if (loading) {
    return <ProtectedRoute><AppShell><div className="text-sm text-gray-500">Loading results...</div></AppShell></ProtectedRoute>;
  }

  const showDetailedResults = quiz?.show_results === "after_submit";
  const showAfterDue = quiz?.show_results === "after_due_date";
  const dueDate = quiz?.due_at ? new Date(quiz.due_at) : null;
  const isPastDue = dueDate ? new Date() > dueDate : false;

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-6">
          <Link href={`/assess/quizzes/${quiz?.id}/take`} className="text-sm text-blue-600 hover:text-blue-800">
            &larr; Back to quiz
          </Link>

          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Quiz Results</h1>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              attempt?.status === "graded" ? "bg-green-100 text-green-800" :
              attempt?.status === "submitted" ? "bg-blue-100 text-blue-800" :
              "bg-yellow-100 text-yellow-800"
            }`}>{attempt?.status}</span>
          </div>

          {/* Score Summary */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{quiz?.title}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
              <div>
                <span className="text-gray-500 block">Score</span>
                <span className="text-xl font-bold">
                  {attempt?.score != null ? attempt.score : "--"} / {quiz?.points_possible || 0}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Percentage</span>
                <span className="text-xl font-bold">
                  {attempt?.percentage != null ? `${Math.round(attempt.percentage)}%` : "--"}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Status</span>
                <span className="text-xl font-bold capitalize">{attempt?.status}</span>
              </div>
              {attempt?.time_spent_seconds != null && (
                <div>
                  <span className="text-gray-500 block">Time Spent</span>
                  <span className="text-xl font-bold">{formatDuration(attempt.time_spent_seconds)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Results or Messages */}
          {showAfterDue && !isPastDue && (
            <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700">
              Results available after {dueDate?.toLocaleDateString()}
            </div>
          )}

          {(showDetailedResults || (showAfterDue && isPastDue)) && quizAnswers.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Question Details</h3>
              {quizAnswers.map((ans, idx) => {
                const question = questions.get(ans.question_id);
                if (!question) return null;

                return (
                  <div key={ans.id} className="rounded-lg border border-gray-200 bg-white p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Question {idx + 1}</span>
                      <div className="flex items-center gap-2">
                        {ans.is_correct != null && (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            ans.is_correct ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {ans.is_correct ? "Correct" : "Incorrect"}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {ans.points_awarded != null ? ans.points_awarded : "--"} / {question.points} pts
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-900">{question.prompt}</p>

                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Your answer: </span>
                      {JSON.stringify(ans.answer)}
                    </div>

                    {question.explanation && (
                      <div className="text-sm text-blue-700 bg-blue-50 rounded p-2">
                        <span className="font-medium">Explanation: </span>
                        {question.explanation}
                      </div>
                    )}

                    {ans.feedback && (
                      <div className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                        <span className="font-medium">Feedback: </span>
                        {ans.feedback}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
