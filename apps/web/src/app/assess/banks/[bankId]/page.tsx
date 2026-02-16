"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/lib/api";
import { QuizSkeleton } from "@/components/skeletons/QuizSkeleton";
import { EmptyState } from "@/components/EmptyState";

interface QuestionBank {
  id: number;
  title: string;
  description: string;
  subject: string;
  grade_level: string;
  status: string;
}

interface Choice {
  key: string;
  text: string;
}

interface MatchPair {
  left: string;
  right: string;
}

interface Question {
  id: number;
  prompt: string;
  question_type: string;
  choices: Choice[] | null;
  correct_answer: Record<string, unknown> | null;
  points: number;
  explanation: string;
  status: string;
}

const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "true_false", label: "True / False" },
  { value: "short_answer", label: "Short Answer" },
  { value: "essay", label: "Essay" },
  { value: "matching", label: "Matching" },
  { value: "fill_in_blank", label: "Fill in the Blank" },
];

const TYPE_BADGES: Record<string, string> = {
  multiple_choice: "bg-blue-100 text-blue-800",
  true_false: "bg-purple-100 text-purple-800",
  short_answer: "bg-yellow-200 text-yellow-900",
  essay: "bg-green-100 text-green-800",
  matching: "bg-orange-100 text-orange-800",
  fill_in_blank: "bg-pink-100 text-pink-800",
};

export default function QuestionBankEditorPage() {
  const params = useParams();
  const router = useRouter();
  const bankId = params.bankId as string;

  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // QTI state
  const [exporting, setExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  // Bank edit form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");

  // Question form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [qType, setQType] = useState("multiple_choice");
  const [prompt, setPrompt] = useState("");
  const [points, setPoints] = useState("1");
  const [explanation, setExplanation] = useState("");
  const [choices, setChoices] = useState<Choice[]>([
    { key: "a", text: "" },
    { key: "b", text: "" },
  ]);
  const [correctKey, setCorrectKey] = useState("a");
  const [tfValue, setTfValue] = useState(true);
  const [acceptable, setAcceptable] = useState<string[]>([""]);
  const [matchPairs, setMatchPairs] = useState<MatchPair[]>([{ left: "", right: "" }]);
  const [fillAnswers, setFillAnswers] = useState<string[]>([""]);

  const fetchQuestions = useCallback(async () => {
    try {
      const data = await apiFetch<Question[]>(`/api/v1/question_banks/${bankId}/questions`);
      setQuestions(data);
    } catch {
      // ignore
    }
  }, [bankId]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [bankData] = await Promise.all([
          apiFetch<QuestionBank>(`/api/v1/question_banks/${bankId}`),
        ]);
        setBank(bankData);
        setTitle(bankData.title);
        setDescription(bankData.description || "");
        setSubject(bankData.subject || "");
        setGradeLevel(bankData.grade_level || "");
        await fetchQuestions();
      } catch {
        router.push("/assess/banks");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [bankId, router, fetchQuestions]);

  async function saveBank() {
    setSaving(true);
    try {
      const updated = await apiFetch<QuestionBank>(`/api/v1/question_banks/${bankId}`, {
        method: "PATCH",
        body: JSON.stringify({ title, description, subject, grade_level: gradeLevel }),
      });
      setBank(updated);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function exportQti() {
    setExporting(true);
    setExportUrl(null);
    try {
      await apiFetch(`/api/v1/question_banks/${bankId}/export_qti`, { method: "POST" });
      // Poll for completion
      const poll = async () => {
        for (let i = 0; i < 30; i++) {
          await new Promise((r) => setTimeout(r, 2000));
          try {
            const status = await apiFetch<{ status: string; download_url?: string }>(
              `/api/v1/question_banks/${bankId}/export_qti_status`,
            );
            if (status.status === "completed" && status.download_url) {
              setExportUrl(status.download_url);
              return;
            }
          } catch {
            // keep polling
          }
        }
      };
      await poll();
    } catch {
      // ignore
    } finally {
      setExporting(false);
    }
  }

  async function importQti(file: File) {
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const res = await fetch(`${API_BASE}/api/v1/question_banks/${bankId}/import_qti`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (res.ok) {
        setImportResult("Import started. Questions will appear shortly.");
        // Wait a moment then refresh questions
        await new Promise((r) => setTimeout(r, 3000));
        await fetchQuestions();
        setImportResult("Import complete.");
      } else {
        setImportResult("Import failed.");
      }
    } catch {
      setImportResult("Import failed.");
    } finally {
      setImporting(false);
    }
  }

  function resetQuestionForm() {
    setShowForm(false);
    setEditingId(null);
    setQType("multiple_choice");
    setPrompt("");
    setPoints("1");
    setExplanation("");
    setChoices([
      { key: "a", text: "" },
      { key: "b", text: "" },
    ]);
    setCorrectKey("a");
    setTfValue(true);
    setAcceptable([""]);
    setMatchPairs([{ left: "", right: "" }]);
    setFillAnswers([""]);
  }

  function editQuestion(q: Question) {
    setEditingId(q.id);
    setQType(q.question_type);
    setPrompt(q.prompt);
    setPoints(String(q.points));
    setExplanation(q.explanation || "");
    if (q.question_type === "multiple_choice" && q.choices) {
      setChoices(q.choices);
      setCorrectKey((q.correct_answer?.key as string) || "a");
    } else if (q.question_type === "true_false") {
      setTfValue((q.correct_answer?.value as boolean) ?? true);
    } else if (q.question_type === "short_answer" && q.correct_answer) {
      setAcceptable((q.correct_answer.acceptable as string[]) || [""]);
    } else if (q.question_type === "matching" && q.correct_answer) {
      setMatchPairs((q.correct_answer.pairs as MatchPair[]) || [{ left: "", right: "" }]);
    } else if (q.question_type === "fill_in_blank" && q.correct_answer) {
      setFillAnswers((q.correct_answer.answers as string[]) || [""]);
    }
    setShowForm(true);
  }

  function buildQuestionPayload() {
    const payload: Record<string, unknown> = {
      prompt,
      question_type: qType,
      points: parseFloat(points),
      explanation,
    };

    switch (qType) {
      case "multiple_choice":
        payload.choices = choices;
        payload.correct_answer = { key: correctKey };
        break;
      case "true_false":
        payload.choices = [
          { key: "true", text: "True" },
          { key: "false", text: "False" },
        ];
        payload.correct_answer = { value: tfValue };
        break;
      case "short_answer":
        payload.correct_answer = { acceptable: acceptable.filter(Boolean) };
        break;
      case "matching":
        payload.correct_answer = { pairs: matchPairs.filter((p) => p.left && p.right) };
        break;
      case "fill_in_blank":
        payload.correct_answer = { answers: fillAnswers.filter(Boolean) };
        break;
      case "essay":
        payload.choices = null;
        payload.correct_answer = null;
        break;
    }
    return payload;
  }

  async function saveQuestion() {
    setSaving(true);
    try {
      const payload = buildQuestionPayload();
      if (editingId) {
        await apiFetch(`/api/v1/questions/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch(`/api/v1/question_banks/${bankId}/questions`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      resetQuestionForm();
      await fetchQuestions();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuestion(id: number) {
    if (!confirm("Delete this question?")) return;
    try {
      await apiFetch(`/api/v1/questions/${id}`, { method: "DELETE" });
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <QuizSkeleton />
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-8">
          {/* Bank Details */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-900">Edit Question Bank</h1>
              {bank && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${bank.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                >
                  {bank.status}
                </span>
              )}
            </div>
            <div className="space-y-4">
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Grade Level</label>
                  <input
                    type="text"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <button
                onClick={saveBank}
                disabled={saving}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Bank"}
              </button>
            </div>
          </div>

          {/* QTI Import/Export */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">QTI Import / Export</h2>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={exportQti}
                  disabled={exporting}
                  className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {exporting ? "Exporting..." : "Export QTI"}
                </button>
                {exportUrl && (
                  <a
                    href={exportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Download
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2">
                <label className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                  {importing ? "Importing..." : "Import QTI"}
                  <input
                    type="file"
                    accept=".xml,.zip"
                    className="hidden"
                    disabled={importing}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) importQti(file);
                      e.target.value = "";
                    }}
                  />
                </label>
                {importResult && <span className="text-sm text-gray-600">{importResult}</span>}
              </div>
            </div>
          </div>

          {/* Questions Section */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Questions ({questions.length})
              </h2>
              {!showForm && (
                <button
                  onClick={() => {
                    resetQuestionForm();
                    setShowForm(true);
                  }}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Add Question
                </button>
              )}
            </div>

            {/* Question Form */}
            {showForm && (
              <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-4">
                <h3 className="font-medium text-gray-900">
                  {editingId ? "Edit Question" : "New Question"}
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value)}
                    disabled={!!editingId}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    {QUESTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prompt</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={2}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>

                {/* Type-specific fields */}
                {qType === "multiple_choice" && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Choices</label>
                    {choices.map((c, i) => (
                      <div key={c.key} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correct"
                          checked={correctKey === c.key}
                          onChange={() => setCorrectKey(c.key)}
                        />
                        <span className="text-sm font-medium w-6">{c.key}.</span>
                        <input
                          type="text"
                          value={c.text}
                          onChange={(e) => {
                            const updated = [...choices];
                            updated[i] = { ...c, text: e.target.value };
                            setChoices(updated);
                          }}
                          className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm"
                        />
                        {choices.length > 2 && (
                          <button
                            onClick={() => setChoices(choices.filter((_, j) => j !== i))}
                            className="text-red-500 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const nextKey = String.fromCharCode(97 + choices.length);
                        setChoices([...choices, { key: nextKey, text: "" }]);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Choice
                    </button>
                  </div>
                )}

                {qType === "true_false" && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Correct Answer
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1 text-sm">
                        <input type="radio" checked={tfValue} onChange={() => setTfValue(true)} />
                        True
                      </label>
                      <label className="flex items-center gap-1 text-sm">
                        <input type="radio" checked={!tfValue} onChange={() => setTfValue(false)} />
                        False
                      </label>
                    </div>
                  </div>
                )}

                {qType === "short_answer" && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Acceptable Answers
                    </label>
                    {acceptable.map((a, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={a}
                          onChange={(e) => {
                            const updated = [...acceptable];
                            updated[i] = e.target.value;
                            setAcceptable(updated);
                          }}
                          className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm"
                        />
                        {acceptable.length > 1 && (
                          <button
                            onClick={() => setAcceptable(acceptable.filter((_, j) => j !== i))}
                            className="text-red-500 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => setAcceptable([...acceptable, ""])}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Answer
                    </button>
                  </div>
                )}

                {qType === "matching" && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Match Pairs</label>
                    {matchPairs.map((p, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={p.left}
                          onChange={(e) => {
                            const updated = [...matchPairs];
                            updated[i] = { ...p, left: e.target.value };
                            setMatchPairs(updated);
                          }}
                          placeholder="Term"
                          className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm"
                        />
                        <span className="text-gray-400">=</span>
                        <input
                          type="text"
                          value={p.right}
                          onChange={(e) => {
                            const updated = [...matchPairs];
                            updated[i] = { ...p, right: e.target.value };
                            setMatchPairs(updated);
                          }}
                          placeholder="Definition"
                          className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm"
                        />
                        {matchPairs.length > 1 && (
                          <button
                            onClick={() => setMatchPairs(matchPairs.filter((_, j) => j !== i))}
                            className="text-red-500 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => setMatchPairs([...matchPairs, { left: "", right: "" }])}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Pair
                    </button>
                  </div>
                )}

                {qType === "fill_in_blank" && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Correct Answers (in order)
                    </label>
                    {fillAnswers.map((a, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={a}
                          onChange={(e) => {
                            const updated = [...fillAnswers];
                            updated[i] = e.target.value;
                            setFillAnswers(updated);
                          }}
                          className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm"
                        />
                        {fillAnswers.length > 1 && (
                          <button
                            onClick={() => setFillAnswers(fillAnswers.filter((_, j) => j !== i))}
                            className="text-red-500 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => setFillAnswers([...fillAnswers, ""])}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Answer
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Points</label>
                    <input
                      type="number"
                      value={points}
                      onChange={(e) => setPoints(e.target.value)}
                      min="0.1"
                      step="0.5"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Explanation</label>
                    <input
                      type="text"
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={saveQuestion}
                    disabled={saving}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : editingId ? "Update" : "Add"}
                  </button>
                  <button
                    onClick={resetQuestionForm}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Questions List */}
            {questions.length === 0 ? (
              <EmptyState
                title="No questions yet"
                description="Add your first question using the form above."
              />
            ) : (
              <div className="divide-y divide-gray-100">
                {questions.map((q, idx) => (
                  <div key={q.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs text-gray-400 w-6">{idx + 1}.</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${
                          TYPE_BADGES[q.question_type] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {q.question_type.replace("_", " ")}
                      </span>
                      <span className="text-sm text-gray-900 truncate">{q.prompt}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <span className="text-xs text-gray-500">{q.points} pts</span>
                      <button
                        onClick={() => editQuestion(q)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteQuestion(q.id)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
