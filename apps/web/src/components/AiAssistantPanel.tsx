"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";

type TaskType = "unit_generation" | "lesson_generation" | "differentiation" | "assessment_generation" | "rewrite";

interface AiAssistantPanelProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: TaskType;
  context?: {
    subject?: string;
    gradeLevel?: string;
    topic?: string;
    unitPlanId?: number;
    content?: string;
  };
  onResultApply?: (taskType: TaskType, result: Record<string, unknown>) => void;
}

interface PollResult {
  status: string;
  content: Record<string, unknown> | null;
  error_message: string | null;
}

const TABS: { key: TaskType; label: string }[] = [
  { key: "unit_generation", label: "Unit" },
  { key: "lesson_generation", label: "Lesson" },
  { key: "differentiation", label: "Differentiate" },
  { key: "assessment_generation", label: "Assessment" },
  { key: "rewrite", label: "Rewrite" },
];

export default function AiAssistantPanel({
  open,
  onClose,
  defaultTab = "unit_generation",
  context = {},
  onResultApply,
}: AiAssistantPanelProps) {
  const [activeTab, setActiveTab] = useState<TaskType>(defaultTab);
  const [generating, setGenerating] = useState(false);
  const [invocationId, setInvocationId] = useState<number | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form fields shared across tabs
  const [subject, setSubject] = useState(context.subject || "");
  const [gradeLevel, setGradeLevel] = useState(context.gradeLevel || "");
  const [topic, setTopic] = useState(context.topic || "");
  const [numLessons, setNumLessons] = useState("5");
  const [additionalContext, setAdditionalContext] = useState("");

  // Lesson-specific
  const [objectives, setObjectives] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("45");

  // Differentiation-specific
  const [diffContent, setDiffContent] = useState(context.content || "");
  const [diffType, setDiffType] = useState("ell");

  // Assessment-specific
  const [numQuestions, setNumQuestions] = useState("10");
  const [difficulty, setDifficulty] = useState("medium");

  // Rewrite-specific
  const [rewriteContent, setRewriteContent] = useState(context.content || "");
  const [rewriteInstruction, setRewriteInstruction] = useState("");

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    if (context.subject) setSubject(context.subject);
    if (context.gradeLevel) setGradeLevel(context.gradeLevel);
    if (context.topic) setTopic(context.topic);
    if (context.content) {
      setDiffContent(context.content);
      setRewriteContent(context.content);
    }
  }, [context]);

  const pollForResult = useCallback(async (id: number) => {
    const maxAttempts = 60;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        const data = await apiFetch<PollResult>(`/api/v1/ai/invocations/${id}/result`);
        if (data.status === "completed" && data.content) {
          setResult(data.content);
          setGenerating(false);
          return;
        }
        if (data.status === "failed") {
          setError(data.error_message || "Generation failed.");
          setGenerating(false);
          return;
        }
      } catch {
        // Continue polling
      }
    }
    setError("Generation timed out.");
    setGenerating(false);
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setResult(null);

    let endpoint = "";
    let body: Record<string, unknown> = {};

    switch (activeTab) {
      case "unit_generation":
        endpoint = "/api/v1/ai/generate_unit";
        body = { subject, topic, grade_level: gradeLevel, num_lessons: parseInt(numLessons, 10), additional_context: additionalContext || undefined };
        break;
      case "lesson_generation":
        endpoint = "/api/v1/ai/generate_lesson";
        body = { subject, topic, grade_level: gradeLevel, objectives, duration_minutes: parseInt(durationMinutes, 10), unit_plan_id: context.unitPlanId, additional_context: additionalContext || undefined };
        break;
      case "differentiation":
        endpoint = "/api/v1/ai/differentiate";
        body = { content: diffContent, differentiation_type: diffType, grade_level: gradeLevel, subject, additional_context: additionalContext || undefined };
        break;
      case "assessment_generation":
        endpoint = "/api/v1/ai/generate_assessment";
        body = { topic, grade_level: gradeLevel, num_questions: parseInt(numQuestions, 10), difficulty, additional_context: additionalContext || undefined };
        break;
      case "rewrite":
        endpoint = "/api/v1/ai/rewrite";
        body = { content: rewriteContent, instruction: rewriteInstruction, grade_level: gradeLevel, additional_context: additionalContext || undefined };
        break;
    }

    try {
      const data = await apiFetch<{ invocation_id: number }>(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setInvocationId(data.invocation_id);
      await pollForResult(data.invocation_id);
    } catch {
      setError("Failed to start AI generation. Check that AI policies are configured.");
      setGenerating(false);
    }
  }

  function handleApply() {
    if (result && onResultApply) {
      onResultApply(activeTab, result);
    }
    setResult(null);
    setInvocationId(null);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto flex h-full w-[480px] flex-col border-l border-gray-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setResult(null); setError(null); }}
              className={`flex-1 px-2 py-2.5 text-xs font-medium ${
                activeTab === tab.key
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Common fields */}
          {(activeTab === "unit_generation" || activeTab === "lesson_generation" || activeTab === "assessment_generation") && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700">Subject</label>
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Mathematics" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Topic</label>
                <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Fractions" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Grade Level</label>
                <input type="text" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} placeholder="e.g. 5" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
              </div>
            </>
          )}

          {/* Unit generation fields */}
          {activeTab === "unit_generation" && (
            <div>
              <label className="block text-xs font-medium text-gray-700">Number of Lessons</label>
              <input type="number" value={numLessons} onChange={(e) => setNumLessons(e.target.value)} min="1" max="20" className="mt-1 block w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
          )}

          {/* Lesson generation fields */}
          {activeTab === "lesson_generation" && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700">Objectives</label>
                <textarea value={objectives} onChange={(e) => setObjectives(e.target.value)} rows={2} placeholder="What students should learn..." className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Duration (minutes)</label>
                <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} min="10" max="180" className="mt-1 block w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
              </div>
            </>
          )}

          {/* Differentiation fields */}
          {activeTab === "differentiation" && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700">Content to Differentiate</label>
                <textarea value={diffContent} onChange={(e) => setDiffContent(e.target.value)} rows={4} placeholder="Paste lesson content here..." className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Differentiation Type</label>
                <select value={diffType} onChange={(e) => setDiffType(e.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm">
                  <option value="ell">English Language Learners</option>
                  <option value="gifted">Gifted/Advanced</option>
                  <option value="remedial">Remedial/Below Grade</option>
                  <option value="special_ed">Special Education</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Grade Level</label>
                <input type="text" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} placeholder="e.g. 5" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
              </div>
            </>
          )}

          {/* Assessment fields */}
          {activeTab === "assessment_generation" && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700">Number of Questions</label>
                <input type="number" value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)} min="1" max="50" className="mt-1 block w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Difficulty</label>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm">
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </>
          )}

          {/* Rewrite fields */}
          {activeTab === "rewrite" && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700">Content to Rewrite</label>
                <textarea value={rewriteContent} onChange={(e) => setRewriteContent(e.target.value)} rows={4} placeholder="Paste content here..." className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Instructions</label>
                <textarea value={rewriteInstruction} onChange={(e) => setRewriteInstruction(e.target.value)} rows={2} placeholder="e.g. Simplify for 3rd graders..." className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Grade Level</label>
                <input type="text" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} placeholder="e.g. 3" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
              </div>
            </>
          )}

          {/* Additional context (all tabs) */}
          <div>
            <label className="block text-xs font-medium text-gray-700">Additional Context (optional)</label>
            <textarea value={additionalContext} onChange={(e) => setAdditionalContext(e.target.value)} rows={2} placeholder="Any extra instructions..." className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate with AI"}
          </button>

          {/* Loading indicator */}
          {generating && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              AI is generating content... This may take a moment.
              {invocationId && <span className="text-xs text-gray-400">(#{invocationId})</span>}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="text-xs font-medium text-green-800">Generation Complete</p>
              </div>
              <div className="max-h-64 overflow-auto rounded-md border border-gray-200 bg-gray-50 p-3">
                <pre className="whitespace-pre-wrap text-xs text-gray-700">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
              {onResultApply && (
                <button
                  onClick={handleApply}
                  className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  Apply to Editor
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
