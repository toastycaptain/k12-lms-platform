"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { EmptyState } from "@/components/EmptyState";

interface Quiz {
  id: number;
  title: string;
  points_possible: number | null;
  show_results: "after_submit" | "after_due_date" | "never";
  due_at: string | null;
  attempts_allowed: number;
}

interface QuizAttempt {
  id: number;
  quiz_id: number;
  status: "in_progress" | "submitted" | "graded";
  score: number | null;
  percentage: number | null;
  attempt_number: number;
  submitted_at: string | null;
}

interface AttemptAnswer {
  id: number;
  question_id: number;
  answer: Record<string, unknown>;
  is_correct: boolean | null;
  points_awarded: number | null;
  feedback: string | null;
}

interface QuizItem {
  id: number;
  question_id: number;
  position: number;
  points: string;
}

interface QuestionChoice {
  key: string;
  text: string;
  left?: string;
}

interface Question {
  id: number;
  question_type: string;
  prompt: string;
  choices: QuestionChoice[] | null;
  points?: number | null;
  correct_answer?: Record<string, unknown>;
}

interface QuizAccommodation {
  id: number;
  extra_attempts: number;
}

const LEARN_ROLES = ["admin", "teacher", "student"];

function formatPoints(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return String(value);
}

function renderChoiceLabel(choices: QuestionChoice[] | null, key: string): string {
  if (!choices) return key;
  const match = choices.find((choice) => choice.key === key);
  return match ? `${match.key}. ${match.text}` : key;
}

function formatAnswer(question: Question | undefined, answer: Record<string, unknown>): string {
  if (!question) return JSON.stringify(answer);

  if (question.question_type === "multiple_choice") {
    return renderChoiceLabel(question.choices, String(answer.key || ""));
  }

  if (question.question_type === "multiple_answer") {
    const keys = Array.isArray(answer.keys) ? (answer.keys as string[]) : [];
    return keys.map((key) => renderChoiceLabel(question.choices, key)).join(", ") || "No answer";
  }

  if (question.question_type === "true_false") {
    if (answer.value === true) return "True";
    if (answer.value === false) return "False";
    return "No answer";
  }

  if (question.question_type === "short_answer" || question.question_type === "essay") {
    return String(answer.text || "").trim() || "No answer";
  }

  if (question.question_type === "fill_in_blank") {
    const values = Array.isArray(answer.answers) ? (answer.answers as string[]) : [];
    return values.join(", ") || "No answer";
  }

  if (question.question_type === "matching") {
    const pairs = Array.isArray(answer.pairs)
      ? (answer.pairs as Array<Record<string, string>>)
      : [];
    if (pairs.length === 0) return "No answer";
    return pairs.map((pair) => `${pair.left} -> ${pair.right}`).join("; ");
  }

  return JSON.stringify(answer);
}

function formatCorrectAnswer(question: Question | undefined): string | null {
  if (!question || !question.correct_answer) return null;

  if (question.question_type === "multiple_choice") {
    return renderChoiceLabel(question.choices, String(question.correct_answer.key || ""));
  }

  if (question.question_type === "multiple_answer") {
    const keys = Array.isArray(question.correct_answer.keys)
      ? (question.correct_answer.keys as string[])
      : [];
    return keys.map((key) => renderChoiceLabel(question.choices, key)).join(", ");
  }

  if (question.question_type === "true_false") {
    return question.correct_answer.value === true ? "True" : "False";
  }

  if (question.question_type === "short_answer" || question.question_type === "essay") {
    return String(question.correct_answer.text || "");
  }

  if (question.question_type === "fill_in_blank") {
    const values = Array.isArray(question.correct_answer.answers)
      ? (question.correct_answer.answers as string[])
      : [];
    return values.join(", ");
  }

  if (question.question_type === "matching") {
    const pairs = Array.isArray(question.correct_answer.pairs)
      ? (question.correct_answer.pairs as Array<Record<string, string>>)
      : [];
    return pairs.map((pair) => `${pair.left} -> ${pair.right}`).join("; ");
  }

  return JSON.stringify(question.correct_answer);
}

export default function LearnQuizResultsPage() {
  const params = useParams();
  const courseId = String(params.courseId);
  const quizId = String(params.quizId);
  const attemptId = String(params.attemptId);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [answers, setAnswers] = useState<AttemptAnswer[]>([]);
  const [quizItemsByQuestionId, setQuizItemsByQuestionId] = useState<Record<number, QuizItem>>({});
  const [questionsById, setQuestionsById] = useState<Record<number, Question>>({});
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [extraAttempts, setExtraAttempts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const attemptData = await apiFetch<QuizAttempt>(`/api/v1/quiz_attempts/${attemptId}`);
        const [quizData, answerData, allAttempts, quizItems] = await Promise.all([
          apiFetch<Quiz>(`/api/v1/quizzes/${attemptData.quiz_id}`),
          apiFetch<AttemptAnswer[]>(`/api/v1/quiz_attempts/${attemptId}/answers`),
          apiFetch<QuizAttempt[]>(`/api/v1/quizzes/${attemptData.quiz_id}/attempts`),
          apiFetch<QuizItem[]>(`/api/v1/quizzes/${attemptData.quiz_id}/quiz_items`),
        ]);

        setQuiz(quizData);
        setAttempt(attemptData);
        setAnswers(answerData);
        setAttemptsUsed(allAttempts.length);
        setQuizItemsByQuestionId(
          quizItems.reduce<Record<number, QuizItem>>((acc, item) => {
            acc[item.question_id] = item;
            return acc;
          }, {}),
        );

        try {
          const accommodations = await apiFetch<QuizAccommodation[]>(
            `/api/v1/quizzes/${attemptData.quiz_id}/accommodations`,
          );
          setExtraAttempts(accommodations[0]?.extra_attempts || 0);
        } catch {
          setExtraAttempts(0);
        }

        const questionMap: Record<number, Question> = {};
        await Promise.all(
          answerData.map(async (entry) => {
            if (questionMap[entry.question_id]) return;
            questionMap[entry.question_id] = await apiFetch<Question>(
              `/api/v1/questions/${entry.question_id}`,
            );
          }),
        );
        setQuestionsById(questionMap);
      } catch {
        setError("Unable to load quiz results.");
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, [attemptId]);

  const reviewAllowed = useMemo(() => {
    if (!quiz) return false;
    if (quiz.show_results === "after_submit") return true;
    if (quiz.show_results === "never") return false;
    if (!quiz.due_at) return false;
    return new Date(quiz.due_at).getTime() <= Date.now();
  }, [quiz]);

  const canRetake = useMemo(() => {
    if (!quiz) return false;
    return attemptsUsed < quiz.attempts_allowed + extraAttempts;
  }, [attemptsUsed, extraAttempts, quiz]);

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={LEARN_ROLES}>
        <AppShell>
          <ListSkeleton />
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (!quiz || !attempt) {
    return (
      <ProtectedRoute requiredRoles={LEARN_ROLES}>
        <AppShell>
          <p className="text-sm text-gray-500">Quiz result not found.</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={LEARN_ROLES}>
      <AppShell>
        <div className="mx-auto max-w-4xl space-y-6">
          <header className="rounded-lg border border-gray-200 bg-white p-6">
            <Link
              href={`/learn/courses/${courseId}`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              &larr; Return to Course
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">{quiz.title} Results</h1>
            <p className="mt-1 text-sm text-gray-600">Attempt #{attempt.attempt_number}</p>
          </header>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Score Summary</h2>
            <p className="mt-2 text-sm text-gray-700">
              You scored {formatPoints(attempt.score)} out of {formatPoints(quiz.points_possible)}{" "}
              points
              {attempt.percentage != null ? ` (${Math.round(attempt.percentage)}%)` : ""}.
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Status: <span className="capitalize">{attempt.status}</span>
            </p>
          </section>

          {reviewAllowed ? (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">Question Review</h2>
              {answers.length === 0 ? (
                <EmptyState
                  title="No answers found"
                  description="No answers were recorded for this attempt."
                />
              ) : (
                answers.map((entry, index) => {
                  const question = questionsById[entry.question_id];
                  const quizItem = quizItemsByQuestionId[entry.question_id];
                  const studentAnswer = formatAnswer(question, entry.answer);
                  const correctAnswer = formatCorrectAnswer(question);

                  return (
                    <article
                      key={entry.id}
                      className="rounded-lg border border-gray-200 bg-white p-5 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900">Question {index + 1}</p>
                        <div className="flex items-center gap-2 text-xs">
                          {entry.is_correct !== null && (
                            <span
                              className={`rounded-full px-2 py-0.5 font-medium ${
                                entry.is_correct
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {entry.is_correct ? "Correct" : "Incorrect"}
                            </span>
                          )}
                          <span className="text-gray-500">
                            {formatPoints(entry.points_awarded)} /{" "}
                            {quizItem?.points || question?.points || "-"} points
                          </span>
                        </div>
                      </div>

                      <p className="whitespace-pre-wrap text-sm text-gray-800">
                        {question?.prompt || "Question prompt unavailable."}
                      </p>

                      <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                          Your answer
                        </p>
                        <p className="mt-1 whitespace-pre-wrap">{studentAnswer}</p>
                      </div>

                      {correctAnswer && correctAnswer !== studentAnswer && (
                        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-900">
                          <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                            Correct answer
                          </p>
                          <p className="mt-1 whitespace-pre-wrap">{correctAnswer}</p>
                        </div>
                      )}

                      {entry.feedback && (
                        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                            Teacher feedback
                          </p>
                          <p className="mt-1 whitespace-pre-wrap">{entry.feedback}</p>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </section>
          ) : (
            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <p className="text-sm text-gray-700">
                Detailed review is not currently available. You can view your total score above.
              </p>
            </section>
          )}

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/learn/courses/${courseId}`}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Return to Course
            </Link>
            {canRetake && (
              <Link
                href={`/learn/courses/${courseId}/quizzes/${quizId}/attempt`}
                className="rounded-md border border-blue-300 px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
              >
                Retake Quiz
              </Link>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
