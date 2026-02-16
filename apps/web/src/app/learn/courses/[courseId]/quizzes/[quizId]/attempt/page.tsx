"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ApiError, apiFetch } from "@/lib/api";
import { QuizSkeleton } from "@/components/skeletons/QuizSkeleton";

interface Quiz {
  id: number;
  title: string;
  description: string | null;
  instructions: string | null;
  points_possible: number | null;
  time_limit_minutes: number | null;
  attempts_allowed: number;
  show_results: "after_submit" | "after_due_date" | "never";
  status: string;
  due_at: string | null;
}

interface QuizAttempt {
  id: number;
  quiz_id: number;
  attempt_number: number;
  status: "in_progress" | "submitted" | "graded";
  score: number | null;
  percentage: number | null;
  started_at: string;
  submitted_at: string | null;
  effective_time_limit: number | null;
  created_at: string;
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
}

interface AttemptAnswer {
  id: number;
  question_id: number;
  answer: Record<string, unknown>;
}

interface QuizAccommodation {
  id: number;
  quiz_id: number;
  user_id: number;
  extra_time_minutes: number;
  extra_attempts: number;
}

const LEARN_ROLES = ["admin", "teacher", "student"];

function formatTime(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function answerCountLabel(answered: number, total: number): string {
  return `${answered}/${total} answered`;
}

function questionTypeLabel(questionType: string): string {
  switch (questionType) {
    case "multiple_choice":
      return "Multiple choice";
    case "multiple_answer":
      return "Multiple answer";
    case "true_false":
      return "True/False";
    case "short_answer":
      return "Short answer";
    case "essay":
      return "Essay";
    case "matching":
      return "Matching";
    case "fill_in_blank":
      return "Fill in the blank";
    default:
      return "Question";
  }
}

export default function LearnQuizAttemptPage() {
  const params = useParams();
  const courseId = String(params.courseId);
  const quizId = String(params.quizId);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [accommodation, setAccommodation] = useState<QuizAccommodation | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<QuizAttempt | null>(null);
  const [items, setItems] = useState<QuizItem[]>([]);
  const [questions, setQuestions] = useState<Record<number, Question>>({});
  const [answers, setAnswers] = useState<Record<number, Record<string, unknown>>>({});

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const answersRef = useRef<Record<number, Record<string, unknown>>>({});
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSubmitLockRef = useRef(false);

  const effectiveAttemptsAllowed = useMemo(() => {
    if (!quiz) return 0;
    return quiz.attempts_allowed + (accommodation?.extra_attempts || 0);
  }, [accommodation?.extra_attempts, quiz]);

  const attemptsUsed = attempts.length;
  const attemptsRemaining = Math.max(0, effectiveAttemptsAllowed - attemptsUsed);
  const inProgressAttempt = attempts.find((attempt) => attempt.status === "in_progress") || null;

  const answeredCount = useMemo(
    () => items.filter((item) => Boolean(answers[item.question_id])).length,
    [answers, items],
  );
  const unansweredCount = Math.max(0, items.length - answeredCount);

  const preAttemptTimeLimit = useMemo(() => {
    if (!quiz?.time_limit_minutes) return null;
    return quiz.time_limit_minutes + (accommodation?.extra_time_minutes || 0);
  }, [accommodation?.extra_time_minutes, quiz?.time_limit_minutes]);

  const canStartNewAttempt = Boolean(
    quiz &&
    quiz.status === "published" &&
    !inProgressAttempt &&
    attemptsUsed < effectiveAttemptsAllowed,
  );

  const loadAttemptWorkspace = useCallback(async (attempt: QuizAttempt) => {
    const [quizItems, savedAnswers] = await Promise.all([
      apiFetch<QuizItem[]>(`/api/v1/quizzes/${attempt.quiz_id}/quiz_items`),
      apiFetch<AttemptAnswer[]>(`/api/v1/quiz_attempts/${attempt.id}/answers`),
    ]);

    const orderedItems = [...quizItems].sort((a, b) => a.position - b.position);
    const questionMap: Record<number, Question> = {};

    await Promise.all(
      orderedItems.map(async (item) => {
        const question = await apiFetch<Question>(`/api/v1/questions/${item.question_id}`);
        questionMap[item.question_id] = question;
      }),
    );

    const answerMap = savedAnswers.reduce<Record<number, Record<string, unknown>>>((acc, entry) => {
      acc[entry.question_id] = entry.answer;
      return acc;
    }, {});

    answersRef.current = answerMap;
    setItems(orderedItems);
    setQuestions(questionMap);
    setAnswers(answerMap);
    setActiveAttempt(attempt);

    if (attempt.effective_time_limit) {
      const startedMs = new Date(attempt.started_at).getTime();
      const endMs = startedMs + attempt.effective_time_limit * 60 * 1000;
      setTimeLeft(Math.max(0, Math.floor((endMs - Date.now()) / 1000)));
    } else {
      setTimeLeft(null);
    }
  }, []);

  const refreshBaseData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [quizData, attemptData] = await Promise.all([
        apiFetch<Quiz>(`/api/v1/quizzes/${quizId}`),
        apiFetch<QuizAttempt[]>(`/api/v1/quizzes/${quizId}/attempts`),
      ]);

      const sortedAttempts = [...attemptData].sort((a, b) => b.attempt_number - a.attempt_number);
      setQuiz(quizData);
      setAttempts(sortedAttempts);

      try {
        const accommodations = await apiFetch<QuizAccommodation[]>(
          `/api/v1/quizzes/${quizId}/accommodations`,
        );
        setAccommodation(accommodations[0] || null);
      } catch {
        setAccommodation(null);
      }

      const active = sortedAttempts.find((attempt) => attempt.status === "in_progress") || null;
      if (active) {
        await loadAttemptWorkspace(active);
      } else {
        setActiveAttempt(null);
        setItems([]);
        setQuestions({});
        setAnswers({});
        setTimeLeft(null);
      }
    } catch {
      setError("Unable to load quiz.");
    } finally {
      setLoading(false);
    }
  }, [loadAttemptWorkspace, quizId]);

  useEffect(() => {
    void refreshBaseData();
  }, [refreshBaseData]);

  const saveAnswers = useCallback(
    async (nextAnswers: Record<number, Record<string, unknown>>) => {
      if (!activeAttempt || Object.keys(nextAnswers).length === 0) return;

      setSaving(true);
      try {
        const payload = Object.entries(nextAnswers).map(([questionId, answer]) => ({
          question_id: Number(questionId),
          answer,
        }));

        await apiFetch(`/api/v1/quiz_attempts/${activeAttempt.id}/answers`, {
          method: "POST",
          body: JSON.stringify({ answers: payload }),
        });
      } finally {
        setSaving(false);
      }
    },
    [activeAttempt],
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (
      !activeAttempt?.effective_time_limit ||
      activeAttempt.status !== "in_progress" ||
      timeLeft === null
    )
      return;

    const timer = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous === null) return null;
        const next = previous - 1;
        if (next <= 0) return 0;
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeAttempt?.effective_time_limit, activeAttempt?.status, timeLeft]);

  function setAnswer(questionId: number, answer: Record<string, unknown>) {
    const nextAnswers = {
      ...answersRef.current,
      [questionId]: answer,
    };
    answersRef.current = nextAnswers;
    setAnswers(nextAnswers);

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      void saveAnswers(nextAnswers);
    }, 1200);
  }

  async function startAttempt() {
    if (!quiz) return;

    setStarting(true);
    setError(null);

    try {
      const created = await apiFetch<QuizAttempt>(`/api/v1/quizzes/${quiz.id}/attempts`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setAttempts((previous) => [created, ...previous]);
      await loadAttemptWorkspace(created);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to start quiz.");
      }
    } finally {
      setStarting(false);
    }
  }

  const submitQuiz = useCallback(
    async (autoSubmitted = false) => {
      if (!activeAttempt || submitting) return;

      if (!autoSubmitted) {
        const confirmed = window.confirm(
          `Are you sure you want to submit? You have ${unansweredCount} unanswered question${unansweredCount === 1 ? "" : "s"}.`,
        );
        if (!confirmed) return;
      }

      setSubmitting(true);
      setError(null);

      try {
        await saveAnswers(answersRef.current);
        const updated = await apiFetch<QuizAttempt>(
          `/api/v1/quiz_attempts/${activeAttempt.id}/submit`,
          {
            method: "POST",
          },
        );
        setActiveAttempt(updated);
        setAttempts((previous) =>
          previous.map((attempt) => (attempt.id === updated.id ? updated : attempt)),
        );
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Unable to submit quiz.");
        }
      } finally {
        setSubmitting(false);
      }
    },
    [activeAttempt, saveAnswers, submitting, unansweredCount],
  );

  useEffect(() => {
    if (
      !activeAttempt ||
      activeAttempt.status !== "in_progress" ||
      timeLeft !== 0 ||
      autoSubmitLockRef.current
    )
      return;
    autoSubmitLockRef.current = true;
    void (async () => {
      await submitQuiz(true);
      autoSubmitLockRef.current = false;
    })();
  }, [activeAttempt, submitQuiz, timeLeft]);

  function renderQuestionInput(item: QuizItem, index: number) {
    const question = questions[item.question_id];
    const answer = answers[item.question_id] || {};

    if (!question) return null;
    const choices = question.choices || [];

    return (
      <article
        key={item.id}
        id={`question-${index + 1}`}
        className="rounded-lg border border-gray-200 bg-white p-5 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Question {index + 1} • {questionTypeLabel(question.question_type)}
            </p>
          </div>
          <p className="text-xs text-gray-500">{item.points} points</p>
        </div>
        <p className="whitespace-pre-wrap text-sm text-gray-900">{question.prompt}</p>

        {question.question_type === "multiple_choice" && (
          <div className="space-y-2">
            {choices.map((choice) => (
              <label
                key={choice.key}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm"
              >
                <input
                  type="radio"
                  name={`q-${item.question_id}`}
                  checked={answer.key === choice.key}
                  onChange={() => setAnswer(item.question_id, { key: choice.key })}
                />
                <span>{choice.text}</span>
              </label>
            ))}
          </div>
        )}

        {question.question_type === "multiple_answer" && (
          <div className="space-y-2">
            {choices.map((choice) => {
              const selectedKeys = Array.isArray(answer.keys) ? (answer.keys as string[]) : [];
              const checked = selectedKeys.includes(choice.key);
              return (
                <label
                  key={choice.key}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const next = checked
                        ? selectedKeys.filter((key) => key !== choice.key)
                        : [...selectedKeys, choice.key];
                      setAnswer(item.question_id, { keys: next });
                    }}
                  />
                  <span>{choice.text}</span>
                </label>
              );
            })}
          </div>
        )}

        {question.question_type === "true_false" && (
          <div className="space-y-2">
            {[true, false].map((value) => (
              <label
                key={String(value)}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm"
              >
                <input
                  type="radio"
                  name={`tf-${item.question_id}`}
                  checked={answer.value === value}
                  onChange={() => setAnswer(item.question_id, { value })}
                />
                <span>{value ? "True" : "False"}</span>
              </label>
            ))}
          </div>
        )}

        {question.question_type === "short_answer" && (
          <input
            type="text"
            value={(answer.text as string) || ""}
            onChange={(event) => setAnswer(item.question_id, { text: event.target.value })}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Type your answer..."
          />
        )}

        {question.question_type === "essay" && (
          <textarea
            rows={6}
            value={(answer.text as string) || ""}
            onChange={(event) => setAnswer(item.question_id, { text: event.target.value })}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Write your response..."
          />
        )}

        {question.question_type === "matching" && (
          <div className="space-y-2">
            {choices.map((choice, pairIndex) => {
              const currentPairs = Array.isArray(answer.pairs)
                ? (answer.pairs as Array<Record<string, string>>)
                : [];
              const currentRight = currentPairs[pairIndex]?.right || "";
              return (
                <div
                  key={`${choice.left || choice.key}-${pairIndex}`}
                  className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm"
                >
                  <span className="truncate rounded border border-gray-200 bg-gray-50 px-2 py-1">
                    {choice.left || choice.text}
                  </span>
                  <span className="text-gray-400">&rarr;</span>
                  <input
                    value={currentRight}
                    onChange={(event) => {
                      const nextPairs = [...currentPairs];
                      nextPairs[pairIndex] = {
                        left: choice.left || choice.text,
                        right: event.target.value,
                      };
                      setAnswer(item.question_id, { pairs: nextPairs });
                    }}
                    className="rounded-md border border-gray-300 px-2 py-1"
                    placeholder="Match value..."
                  />
                </div>
              );
            })}
          </div>
        )}

        {question.question_type === "fill_in_blank" && (
          <input
            type="text"
            value={Array.isArray(answer.answers) ? String(answer.answers[0] || "") : ""}
            onChange={(event) => setAnswer(item.question_id, { answers: [event.target.value] })}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Type your answer..."
          />
        )}

        {![
          "multiple_choice",
          "multiple_answer",
          "true_false",
          "short_answer",
          "essay",
          "matching",
          "fill_in_blank",
        ].includes(question.question_type) && (
          <textarea
            rows={5}
            value={(answer.text as string) || ""}
            onChange={(event) => setAnswer(item.question_id, { text: event.target.value })}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Enter your response..."
          />
        )}
      </article>
    );
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={LEARN_ROLES}>
        <AppShell>
          <QuizSkeleton />
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (!quiz) {
    return (
      <ProtectedRoute requiredRoles={LEARN_ROLES}>
        <AppShell>
          <p className="text-sm text-gray-500">Quiz not found.</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  const isTakingAttempt = activeAttempt?.status === "in_progress";

  return (
    <ProtectedRoute requiredRoles={LEARN_ROLES}>
      <AppShell>
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="rounded-lg border border-gray-200 bg-white p-6">
            <Link
              href={`/learn/courses/${courseId}`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              &larr; Back to Course
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">{quiz.title}</h1>
            {quiz.description && <p className="mt-1 text-sm text-gray-700">{quiz.description}</p>}
            {quiz.instructions && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{quiz.instructions}</p>
            )}
          </header>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {!isTakingAttempt && (
            <section className="rounded-lg border border-gray-200 bg-white p-6 space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Quiz Details</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                <div className="rounded border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Points Possible</p>
                  <p className="mt-1 font-semibold text-gray-900">{quiz.points_possible ?? 0}</p>
                </div>
                <div className="rounded border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Time Limit</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {preAttemptTimeLimit ? `${preAttemptTimeLimit} minutes` : "No limit"}
                  </p>
                </div>
                <div className="rounded border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Questions</p>
                  <p className="mt-1 font-semibold text-gray-900">{items.length}</p>
                </div>
                <div className="rounded border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Attempts</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {attemptsUsed}/{effectiveAttemptsAllowed} used
                  </p>
                </div>
              </div>

              {accommodation && (
                <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                  Accommodation applied: +{accommodation.extra_time_minutes} minutes, +
                  {accommodation.extra_attempts} attempts.
                </div>
              )}

              {quiz.status !== "published" && (
                <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
                  This quiz is not currently available.
                </div>
              )}

              {quiz.status === "published" && attemptsRemaining === 0 && (
                <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
                  No attempts remaining.
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => void startAttempt()}
                  disabled={!canStartNewAttempt || starting}
                  className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {starting ? "Starting..." : "Start Quiz"}
                </button>
                <span className="text-sm text-gray-500">
                  {answerCountLabel(answeredCount, items.length)}
                </span>
              </div>

              {activeAttempt && activeAttempt.status !== "in_progress" && (
                <div className="rounded-md border border-gray-200 bg-gray-50 p-4 space-y-3">
                  {quiz.show_results === "after_submit" ? (
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Attempt Submitted</p>
                      <p className="text-sm text-gray-600">
                        You scored {activeAttempt.score ?? "-"} out of {quiz.points_possible ?? 0}
                        {activeAttempt.percentage != null
                          ? ` (${Math.round(activeAttempt.percentage)}%)`
                          : ""}
                        .
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700">
                      Your quiz has been submitted. Results will be available when released by your
                      teacher.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/learn/courses/${courseId}`}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Return to Course
                    </Link>
                    <Link
                      href={`/learn/courses/${courseId}/quizzes/${quiz.id}/results/${activeAttempt.id}`}
                      className="rounded-md border border-blue-300 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-50"
                    >
                      View Results
                    </Link>
                  </div>
                </div>
              )}
            </section>
          )}

          {isTakingAttempt && activeAttempt && (
            <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
              <section className="space-y-4">
                <div className="sticky top-4 z-10 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Attempt #{activeAttempt.attempt_number}
                      </p>
                      <p className="text-xs text-gray-500">
                        {answerCountLabel(answeredCount, items.length)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {saving && <span className="text-xs text-gray-500">Saving...</span>}
                      {timeLeft !== null && (
                        <span
                          className={`rounded-md px-3 py-1 text-sm font-mono font-semibold ${timeLeft <= 300 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}
                        >
                          {formatTime(timeLeft)}
                        </span>
                      )}
                      <button
                        onClick={() => void submitQuiz(false)}
                        disabled={submitting}
                        className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {submitting ? "Submitting..." : "Submit Quiz"}
                      </button>
                    </div>
                  </div>
                </div>

                {items.map((item, index) => renderQuestionInput(item, index))}
              </section>

              <aside className="rounded-lg border border-gray-200 bg-white p-4 h-max lg:sticky lg:top-4">
                <p className="text-sm font-semibold text-gray-900">Question Navigation</p>
                <p className="mt-1 text-xs text-gray-500">{unansweredCount} unanswered</p>
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {items.map((item, index) => {
                    const answered = Boolean(answers[item.question_id]);
                    return (
                      <a
                        key={item.id}
                        href={`#question-${index + 1}`}
                        className={`flex h-8 w-8 items-center justify-center rounded text-xs font-medium ${
                          answered ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {index + 1}
                      </a>
                    );
                  })}
                </div>
              </aside>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
