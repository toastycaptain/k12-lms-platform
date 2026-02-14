"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/lib/api";

interface QuizAttempt {
  id: number;
  quiz_id: number;
  status: string;
  started_at: string;
  effective_time_limit: number | null;
}

interface Quiz {
  id: number;
  title: string;
  points_possible: number;
}

interface QuizItem {
  id: number;
  question_id: number;
  position: number;
  points: string;
}

interface Question {
  id: number;
  question_type: string;
  prompt: string;
  choices: Array<Record<string, string>>;
  correct_answer: Record<string, unknown>;
  points: number;
}

interface SavedAnswer {
  question_id: number;
  answer: Record<string, unknown>;
}

export default function AttemptPage() {
  const params = useParams();
  const attemptId = params.attemptId as string;
  const router = useRouter();

  const [, setAttempt] = useState<QuizAttempt | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [items, setItems] = useState<QuizItem[]>([]);
  const [questions, setQuestions] = useState<Map<number, Question>>(new Map());
  const [answers, setAnswers] = useState<Map<number, Record<string, unknown>>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAutoSubmittedRef = useRef(false);

  const saveAnswers = useCallback(async (answersMap: Map<number, Record<string, unknown>>) => {
    if (answersMap.size === 0) return;
    setSaving(true);
    try {
      const payload = Array.from(answersMap.entries()).map(([question_id, answer]) => ({
        question_id,
        answer,
      }));
      await apiFetch(`/api/v1/quiz_attempts/${attemptId}/answers`, {
        method: "POST",
        body: JSON.stringify({ answers: payload }),
      });
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }, [attemptId]);

  const submitAttempt = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    await saveAnswers(answers);
    try {
      await apiFetch(`/api/v1/quiz_attempts/${attemptId}/submit`, { method: "POST" });
      router.push(`/assess/attempts/${attemptId}/results`);
    } catch {
      setSubmitting(false);
    }
  }, [attemptId, answers, saveAnswers, submitting, router]);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        const attemptData = await apiFetch<QuizAttempt>(`/api/v1/quiz_attempts/${attemptId}`);
        setAttempt(attemptData);

        if (attemptData.status !== "in_progress") {
          router.push(`/assess/attempts/${attemptId}/results`);
          return;
        }

        const [quizData, itemsData, savedAnswers] = await Promise.all([
          apiFetch<Quiz>(`/api/v1/quizzes/${attemptData.quiz_id}`),
          apiFetch<QuizItem[]>(`/api/v1/quizzes/${attemptData.quiz_id}/quiz_items`),
          apiFetch<SavedAnswer[]>(`/api/v1/quiz_attempts/${attemptId}/answers`),
        ]);
        setQuiz(quizData);
        setItems(itemsData.sort((a, b) => a.position - b.position));

        // Fetch individual questions
        const qMap = new Map<number, Question>();
        const questionIds = itemsData.map((i) => i.question_id);
        await Promise.all(
          questionIds.map(async (qId) => {
            try {
              const q = await apiFetch<Question>(`/api/v1/questions/${qId}`);
              qMap.set(qId, q);
            } catch {
              // ignore
            }
          }),
        );
        setQuestions(qMap);

        // Load saved answers
        const aMap = new Map<number, Record<string, unknown>>();
        for (const sa of savedAnswers) {
          aMap.set(sa.question_id, sa.answer);
        }
        setAnswers(aMap);

        // Timer
        if (attemptData.effective_time_limit) {
          const started = new Date(attemptData.started_at).getTime();
          const endTime = started + attemptData.effective_time_limit * 60 * 1000;
          const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
          setTimeLeft(remaining);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [attemptId, router]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        const next = prev - 1;
        if (next <= 0 && !hasAutoSubmittedRef.current) {
          hasAutoSubmittedRef.current = true;
          submitAttempt();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, submitAttempt]);

  function updateAnswer(questionId: number, answer: Record<string, unknown>) {
    const newAnswers = new Map(answers);
    newAnswers.set(questionId, answer);
    setAnswers(newAnswers);

    // Debounced auto-save
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveAnswers(newAnswers), 2000);
  }

  function handleSubmit() {
    if (confirm("Are you sure you want to submit? You cannot change your answers after submitting.")) {
      submitAttempt();
    }
  }

  if (loading) {
    return <ProtectedRoute><AppShell><div className="text-sm text-gray-500">Loading quiz...</div></AppShell></ProtectedRoute>;
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const answeredCount = items.filter((item) => answers.has(item.question_id)).length;

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">{quiz?.title}</h1>
              <div className="flex items-center gap-3">
                {saving && <span className="text-xs text-gray-400">Saving...</span>}
                {timeLeft !== null && (
                  <span className={`rounded-md px-3 py-1 text-sm font-mono font-medium ${
                    timeLeft <= 300 ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-700"
                  }`}>
                    {formatTime(timeLeft)}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {items.map((item, idx) => {
                const question = questions.get(item.question_id);
                if (!question) return null;
                const answer = answers.get(item.question_id);

                return (
                  <div key={item.id} id={`question-${idx + 1}`} className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Question {idx + 1}</span>
                      <span className="text-xs text-gray-400">{item.points} pts</span>
                    </div>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{question.prompt}</p>

                    {/* Multiple Choice */}
                    {question.question_type === "multiple_choice" && (
                      <div className="space-y-2">
                        {(question.choices || []).map((choice) => (
                          <label key={choice.key} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="radio"
                              name={`q-${item.question_id}`}
                              checked={(answer as Record<string, string>)?.key === choice.key}
                              onChange={() => updateAnswer(item.question_id, { key: choice.key })}
                            />
                            {choice.text}
                          </label>
                        ))}
                      </div>
                    )}

                    {/* True/False */}
                    {question.question_type === "true_false" && (
                      <div className="space-y-2">
                        {[true, false].map((val) => (
                          <label key={String(val)} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="radio"
                              name={`q-${item.question_id}`}
                              checked={(answer as Record<string, boolean>)?.value === val}
                              onChange={() => updateAnswer(item.question_id, { value: val })}
                            />
                            {val ? "True" : "False"}
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Short Answer */}
                    {question.question_type === "short_answer" && (
                      <input
                        type="text"
                        value={((answer as Record<string, string>)?.text) || ""}
                        onChange={(e) => updateAnswer(item.question_id, { text: e.target.value })}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Type your answer..."
                      />
                    )}

                    {/* Essay */}
                    {question.question_type === "essay" && (
                      <textarea
                        value={((answer as Record<string, string>)?.text) || ""}
                        onChange={(e) => updateAnswer(item.question_id, { text: e.target.value })}
                        rows={5}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Write your response..."
                      />
                    )}

                    {/* Matching */}
                    {question.question_type === "matching" && (
                      <div className="space-y-2">
                        {(question.choices || []).map((pair, pairIdx) => (
                          <div key={pairIdx} className="flex items-center gap-2 text-sm">
                            <span className="w-32 truncate font-medium">{pair.left || (pair as Record<string, string>).text}</span>
                            <span className="text-gray-400">&rarr;</span>
                            <input
                              type="text"
                              value={
                                ((answer as Record<string, Array<Record<string, string>>>)?.pairs?.[pairIdx]?.right) || ""
                              }
                              onChange={(e) => {
                                const pairs = [...((answer as Record<string, Array<Record<string, string>>>)?.pairs || [])];
                                while (pairs.length <= pairIdx) pairs.push({ left: "", right: "" });
                                pairs[pairIdx] = { left: (pair as Record<string, string>).left || "", right: e.target.value };
                                updateAnswer(item.question_id, { pairs });
                              }}
                              className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm"
                              placeholder="Match..."
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Fill in the Blank */}
                    {question.question_type === "fill_in_blank" && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={((answer as Record<string, string[]>)?.answers?.[0]) || ""}
                          onChange={(e) => updateAnswer(item.question_id, { answers: [e.target.value] })}
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                          placeholder="Fill in the blank..."
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-md bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Quiz"}
              </button>
            </div>
          </div>

          {/* Question Sidebar */}
          <div className="hidden lg:block w-48 flex-shrink-0">
            <div className="sticky top-4 rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Questions</h3>
              <div className="grid grid-cols-5 gap-1.5">
                {items.map((item, idx) => {
                  const isAnswered = answers.has(item.question_id);
                  return (
                    <a
                      key={item.id}
                      href={`#question-${idx + 1}`}
                      className={`flex h-7 w-7 items-center justify-center rounded text-xs font-medium ${
                        isAnswered
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {idx + 1}
                    </a>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-gray-500">
                {answeredCount} of {items.length} answered
              </p>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
