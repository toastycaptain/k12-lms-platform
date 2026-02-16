"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/lib/api";

interface Quiz {
  id: number;
  title: string;
  description: string;
  instructions: string;
  quiz_type: string;
  time_limit_minutes: number | null;
  attempts_allowed: number;
  shuffle_questions: boolean;
  shuffle_choices: boolean;
  show_results: string;
  due_at: string | null;
  unlock_at: string | null;
  lock_at: string | null;
  status: string;
  points_possible: number;
  course_id: number;
}

interface QuizItem {
  id: number;
  question_id: number;
  position: number;
  points: string;
  question_type?: string;
  prompt?: string;
}

interface QuestionBank {
  id: number;
  title: string;
}

interface Question {
  id: number;
  prompt: string;
  question_type: string;
  points: number;
}

interface Accommodation {
  id: number;
  user_id: number;
  extra_time_minutes: number;
  extra_attempts: number;
  notes: string | null;
}

export default function QuizBuilderPage() {
  const params = useParams();
  const quizId = params.quizId as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [items, setItems] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [quizType, setQuizType] = useState("standard");
  const [timeLimit, setTimeLimit] = useState("");
  const [attemptsAllowed, setAttemptsAllowed] = useState("1");
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleChoices, setShuffleChoices] = useState(false);
  const [showResults, setShowResults] = useState("after_submit");
  const [dueAt, setDueAt] = useState("");
  const [unlockAt, setUnlockAt] = useState("");
  const [lockAt, setLockAt] = useState("");

  // Add questions
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());

  // Accommodations
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [showAccommodations, setShowAccommodations] = useState(false);
  const [accomUserId, setAccomUserId] = useState("");
  const [accomExtraTime, setAccomExtraTime] = useState("0");
  const [accomExtraAttempts, setAccomExtraAttempts] = useState("0");
  const [accomNotes, setAccomNotes] = useState("");
  const [editingAccomId, setEditingAccomId] = useState<number | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const data = await apiFetch<QuizItem[]>(`/api/v1/quizzes/${quizId}/quiz_items`);
      setItems(data);
    } catch {
      // ignore
    }
  }, [quizId]);

  useEffect(() => {
    async function fetchData() {
      try {
        const quizData = await apiFetch<Quiz>(`/api/v1/quizzes/${quizId}`);
        setQuiz(quizData);
        setTitle(quizData.title);
        setDescription(quizData.description || "");
        setInstructions(quizData.instructions || "");
        setQuizType(quizData.quiz_type);
        setTimeLimit(quizData.time_limit_minutes?.toString() || "");
        setAttemptsAllowed(quizData.attempts_allowed.toString());
        setShuffleQuestions(quizData.shuffle_questions);
        setShuffleChoices(quizData.shuffle_choices);
        setShowResults(quizData.show_results);
        setDueAt(quizData.due_at || "");
        setUnlockAt(quizData.unlock_at || "");
        setLockAt(quizData.lock_at || "");
        await fetchItems();
        const [banksData, accomData] = await Promise.all([
          apiFetch<QuestionBank[]>("/api/v1/question_banks"),
          apiFetch<Accommodation[]>(`/api/v1/quizzes/${quizId}/accommodations`).catch(() => []),
        ]);
        setBanks(banksData);
        setAccommodations(accomData);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [quizId, fetchItems]);

  async function saveSettings() {
    setSaving(true);
    try {
      const updated = await apiFetch<Quiz>(`/api/v1/quizzes/${quizId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          description,
          instructions,
          quiz_type: quizType,
          time_limit_minutes: timeLimit ? parseInt(timeLimit) : null,
          attempts_allowed: parseInt(attemptsAllowed),
          shuffle_questions: shuffleQuestions,
          shuffle_choices: shuffleChoices,
          show_results: showResults,
          due_at: dueAt || null,
          unlock_at: unlockAt || null,
          lock_at: lockAt || null,
        }),
      });
      setQuiz(updated);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function fetchBankQuestions(bankId: string) {
    setSelectedBank(bankId);
    setSelectedQuestions(new Set());
    if (!bankId) {
      setBankQuestions([]);
      return;
    }
    try {
      const data = await apiFetch<Question[]>(`/api/v1/question_banks/${bankId}/questions`);
      const existingIds = new Set(items.map((i) => i.question_id));
      setBankQuestions(data.filter((q) => !existingIds.has(q.id)));
    } catch {
      setBankQuestions([]);
    }
  }

  async function addSelected() {
    setSaving(true);
    for (const qId of selectedQuestions) {
      try {
        await apiFetch(`/api/v1/quizzes/${quizId}/quiz_items`, {
          method: "POST",
          body: JSON.stringify({ question_id: qId }),
        });
      } catch {
        // skip duplicates
      }
    }
    setSelectedQuestions(new Set());
    await fetchItems();
    await fetchBankQuestions(selectedBank);
    const updated = await apiFetch<Quiz>(`/api/v1/quizzes/${quizId}`);
    setQuiz(updated);
    setSaving(false);
  }

  async function removeItem(itemId: number) {
    try {
      await apiFetch(`/api/v1/quiz_items/${itemId}`, { method: "DELETE" });
      await fetchItems();
      const updated = await apiFetch<Quiz>(`/api/v1/quizzes/${quizId}`);
      setQuiz(updated);
    } catch {
      // ignore
    }
  }

  async function updatePoints(itemId: number, newPoints: string) {
    try {
      await apiFetch(`/api/v1/quiz_items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ points: parseFloat(newPoints) }),
      });
      await fetchItems();
      const updated = await apiFetch<Quiz>(`/api/v1/quizzes/${quizId}`);
      setQuiz(updated);
    } catch {
      // ignore
    }
  }

  async function reorder(direction: "up" | "down", index: number) {
    const newItems = [...items];
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newItems.length) return;
    [newItems[index], newItems[swapIdx]] = [newItems[swapIdx], newItems[index]];
    const itemIds = newItems.map((i) => i.id);
    try {
      await apiFetch(`/api/v1/quizzes/${quizId}/reorder_items`, {
        method: "POST",
        body: JSON.stringify({ item_ids: itemIds }),
      });
      await fetchItems();
    } catch {
      // ignore
    }
  }

  async function fetchAccommodations() {
    try {
      const data = await apiFetch<Accommodation[]>(`/api/v1/quizzes/${quizId}/accommodations`);
      setAccommodations(data);
    } catch {
      // ignore
    }
  }

  async function saveAccommodation() {
    if (!accomUserId) return;
    setSaving(true);
    try {
      if (editingAccomId) {
        await apiFetch(`/api/v1/quiz_accommodations/${editingAccomId}`, {
          method: "PATCH",
          body: JSON.stringify({
            extra_time_minutes: parseInt(accomExtraTime),
            extra_attempts: parseInt(accomExtraAttempts),
            notes: accomNotes || null,
          }),
        });
      } else {
        await apiFetch(`/api/v1/quizzes/${quizId}/accommodations`, {
          method: "POST",
          body: JSON.stringify({
            user_id: parseInt(accomUserId),
            extra_time_minutes: parseInt(accomExtraTime),
            extra_attempts: parseInt(accomExtraAttempts),
            notes: accomNotes || null,
          }),
        });
      }
      setAccomUserId("");
      setAccomExtraTime("0");
      setAccomExtraAttempts("0");
      setAccomNotes("");
      setEditingAccomId(null);
      await fetchAccommodations();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  function startEditAccom(a: Accommodation) {
    setEditingAccomId(a.id);
    setAccomUserId(a.user_id.toString());
    setAccomExtraTime(a.extra_time_minutes.toString());
    setAccomExtraAttempts(a.extra_attempts.toString());
    setAccomNotes(a.notes || "");
  }

  async function removeAccommodation(id: number) {
    if (!confirm("Remove this accommodation?")) return;
    try {
      await apiFetch(`/api/v1/quiz_accommodations/${id}`, { method: "DELETE" });
      await fetchAccommodations();
    } catch {
      // ignore
    }
  }

  async function publishQuiz() {
    try {
      const updated = await apiFetch<Quiz>(`/api/v1/quizzes/${quizId}/publish`, { method: "POST" });
      setQuiz(updated);
    } catch {
      // ignore
    }
  }

  async function closeQuiz() {
    try {
      const updated = await apiFetch<Quiz>(`/api/v1/quizzes/${quizId}/close`, { method: "POST" });
      setQuiz(updated);
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="text-sm text-gray-500">Loading...</div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  const STATUS_COLORS: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-800",
    published: "bg-green-100 text-green-800",
    closed: "bg-red-100 text-red-800",
    archived: "bg-gray-100 text-gray-600",
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Quiz Builder</h1>
              {quiz && (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[quiz.status] || ""}`}
                >
                  {quiz.status}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {quiz?.course_id && (
                <Link
                  href={`/teach/courses/${quiz.course_id}/quiz-performance`}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Quiz Performance
                </Link>
              )}
              {quiz?.status === "draft" && (
                <button
                  onClick={publishQuiz}
                  className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                >
                  Publish
                </button>
              )}
              {quiz?.status === "published" && (
                <button
                  onClick={closeQuiz}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                >
                  Close
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Settings Panel */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Instructions</label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={2}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quiz Type</label>
                  <select
                    value={quizType}
                    onChange={(e) => setQuizType(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="standard">Standard</option>
                    <option value="practice">Practice</option>
                    <option value="survey">Survey</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Show Results</label>
                  <select
                    value={showResults}
                    onChange={(e) => setShowResults(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="after_submit">After Submit</option>
                    <option value="after_due_date">After Due Date</option>
                    <option value="never">Never</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Time Limit (min)
                  </label>
                  <input
                    type="number"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Attempts Allowed
                  </label>
                  <input
                    type="number"
                    value={attemptsAllowed}
                    onChange={(e) => setAttemptsAllowed(e.target.value)}
                    min="1"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={shuffleQuestions}
                    onChange={(e) => setShuffleQuestions(e.target.checked)}
                  />
                  Shuffle Questions
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={shuffleChoices}
                    onChange={(e) => setShuffleChoices(e.target.checked)}
                  />
                  Shuffle Choices
                </label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Due At</label>
                  <input
                    type="datetime-local"
                    value={dueAt}
                    onChange={(e) => setDueAt(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unlock At</label>
                  <input
                    type="datetime-local"
                    value={unlockAt}
                    onChange={(e) => setUnlockAt(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lock At</label>
                  <input
                    type="datetime-local"
                    value={lockAt}
                    onChange={(e) => setLockAt(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
              <button
                onClick={saveSettings}
                disabled={saving}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>

            {/* Questions Panel */}
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Questions ({items.length})
                  </h2>
                  <span className="text-sm text-gray-500">
                    {quiz?.points_possible || 0} pts total
                  </span>
                </div>

                {items.length === 0 ? (
                  <p className="text-sm text-gray-500">No questions added yet.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {items.map((item, idx) => (
                      <div key={item.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex flex-col">
                            <button
                              onClick={() => reorder("up", idx)}
                              disabled={idx === 0}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs leading-none"
                            >
                              &uarr;
                            </button>
                            <button
                              onClick={() => reorder("down", idx)}
                              disabled={idx === items.length - 1}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs leading-none"
                            >
                              &darr;
                            </button>
                          </div>
                          <span className="text-xs text-gray-400">{idx + 1}.</span>
                          <span className="text-sm text-gray-900 truncate">
                            Q#{item.question_id}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <input
                            type="number"
                            defaultValue={item.points}
                            onBlur={(e) => updatePoints(item.id, e.target.value)}
                            className="w-16 rounded border border-gray-300 px-2 py-0.5 text-sm text-right"
                            min="0.1"
                            step="0.5"
                          />
                          <span className="text-xs text-gray-500">pts</span>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Questions from Bank */}
              <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-3">
                <h3 className="font-medium text-gray-900">Add from Question Bank</h3>
                <select
                  value={selectedBank}
                  onChange={(e) => fetchBankQuestions(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Select a bank</option>
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title}
                    </option>
                  ))}
                </select>
                {bankQuestions.length > 0 && (
                  <>
                    <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
                      {bankQuestions.map((q) => (
                        <label
                          key={q.id}
                          className="flex items-center gap-2 py-1.5 text-sm cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedQuestions.has(q.id)}
                            onChange={(e) => {
                              const next = new Set(selectedQuestions);
                              if (e.target.checked) {
                                next.add(q.id);
                              } else {
                                next.delete(q.id);
                              }
                              setSelectedQuestions(next);
                            }}
                          />
                          <span className="truncate">{q.prompt}</span>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {q.question_type}
                          </span>
                        </label>
                      ))}
                    </div>
                    <button
                      onClick={addSelected}
                      disabled={selectedQuestions.size === 0 || saving}
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      Add Selected ({selectedQuestions.size})
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Accommodations Panel */}
          <div className="rounded-lg border border-gray-200 bg-white">
            <button
              onClick={() => setShowAccommodations(!showAccommodations)}
              className="flex w-full items-center justify-between px-6 py-4"
            >
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">Accommodations</h2>
                {accommodations.length > 0 && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                    {accommodations.length} student{accommodations.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <span className="text-gray-400 text-sm">{showAccommodations ? "Hide" : "Show"}</span>
            </button>

            {showAccommodations && (
              <div className="border-t border-gray-200 px-6 pb-6 space-y-4">
                {/* List */}
                {accommodations.length > 0 && (
                  <div className="divide-y divide-gray-100 mt-2">
                    {accommodations.map((a) => (
                      <div key={a.id} className="flex items-center justify-between py-2">
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">User #{a.user_id}</span>
                          <span className="ml-3 text-gray-500">
                            +{a.extra_time_minutes}min, +{a.extra_attempts} attempts
                          </span>
                          {a.notes && <span className="ml-2 text-gray-400">({a.notes})</span>}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditAccom(a)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => removeAccommodation(a.id)}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add/Edit Form */}
                <div className="rounded-md border border-gray-200 p-4 space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    {editingAccomId ? "Edit Accommodation" : "Add Accommodation"}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600">
                        Student User ID
                      </label>
                      <input
                        type="number"
                        value={accomUserId}
                        onChange={(e) => setAccomUserId(e.target.value)}
                        disabled={!!editingAccomId}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">
                        Extra Time (min)
                      </label>
                      <input
                        type="number"
                        value={accomExtraTime}
                        onChange={(e) => setAccomExtraTime(e.target.value)}
                        min="0"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">
                        Extra Attempts
                      </label>
                      <input
                        type="number"
                        value={accomExtraAttempts}
                        onChange={(e) => setAccomExtraAttempts(e.target.value)}
                        min="0"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Notes</label>
                      <textarea
                        value={accomNotes}
                        onChange={(e) => setAccomNotes(e.target.value)}
                        rows={1}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={saveAccommodation}
                      disabled={!accomUserId || saving}
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {editingAccomId ? "Update" : "Add"}
                    </button>
                    {editingAccomId && (
                      <button
                        onClick={() => {
                          setEditingAccomId(null);
                          setAccomUserId("");
                          setAccomExtraTime("0");
                          setAccomExtraAttempts("0");
                          setAccomNotes("");
                        }}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
