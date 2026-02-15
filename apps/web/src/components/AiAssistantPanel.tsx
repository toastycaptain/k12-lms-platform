"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";

interface AiTaskPolicy {
  id: number;
  task_type: string;
  enabled: boolean;
}

interface InvocationResponse {
  id: number;
  content: string;
  provider: string;
  model: string;
  status: string;
}

interface AiAssistantPanelProps {
  unitId?: number;
  lessonId?: number;
  context?: Record<string, string>;
}

const TASK_TYPES = ["lesson_plan", "unit_plan", "differentiation", "assessment", "rewrite"];

export default function AiAssistantPanel({ unitId, lessonId, context = {} }: AiAssistantPanelProps) {
  const [taskType, setTaskType] = useState<string>("lesson_plan");
  const [prompt, setPrompt] = useState("");
  const [responseText, setResponseText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [policyHint, setPolicyHint] = useState<string | null>(null);
  const [enabledTasks, setEnabledTasks] = useState<Record<string, boolean>>(
    Object.fromEntries(TASK_TYPES.map((value) => [value, true])) as Record<string, boolean>,
  );

  useEffect(() => {
    async function loadPolicies() {
      try {
        const policies = await apiFetch<AiTaskPolicy[]>("/api/v1/ai_task_policies");
        const enabledMap = Object.fromEntries(TASK_TYPES.map((value) => [value, false])) as Record<string, boolean>;
        policies.forEach((policy) => {
          if (TASK_TYPES.includes(policy.task_type)) {
            enabledMap[policy.task_type] = policy.enabled;
          }
        });
        setEnabledTasks(enabledMap);

        if (!enabledMap[taskType]) {
          const fallback = TASK_TYPES.find((value) => enabledMap[value]) || "lesson_plan";
          setTaskType(fallback);
        }
      } catch (e) {
        if (e instanceof ApiError && e.status === 403) {
          setPolicyHint("Policy list is restricted for your role. Generation endpoint still enforces policy access.");
          setEnabledTasks(Object.fromEntries(TASK_TYPES.map((value) => [value, true])) as Record<string, boolean>);
        } else {
          setPolicyHint("Could not load policy availability. Proceeding with default task options.");
        }
      }
    }

    void loadPolicies();
  }, [taskType]);

  const contextPayload = useMemo(() => {
    return {
      ...(unitId ? { unit_id: String(unitId) } : {}),
      ...(lessonId ? { lesson_id: String(lessonId) } : {}),
      ...context,
    };
  }, [unitId, lessonId, context]);

  async function generate() {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await apiFetch<InvocationResponse>("/api/v1/ai_invocations", {
        method: "POST",
        body: JSON.stringify({
          task_type: taskType,
          prompt: prompt.trim(),
          context: contextPayload,
        }),
      });
      setResponseText(result.content || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI generation failed.");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard() {
    if (!responseText) return;
    await navigator.clipboard.writeText(responseText);
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-900">AI Assistant</h3>
      {policyHint && <p className="mt-1 text-xs text-gray-500">{policyHint}</p>}
      {error && <p className="mt-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700">{error}</p>}

      <div className="mt-3 space-y-2">
        <label className="block text-xs font-medium text-gray-700">Task Type</label>
        <select
          value={taskType}
          onChange={(e) => setTaskType(e.target.value)}
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
        >
          {TASK_TYPES.map((value) => (
            <option key={value} value={value} disabled={!enabledTasks[value]}>
              {value}
              {!enabledTasks[value] ? " (disabled)" : ""}
            </option>
          ))}
        </select>

        <label className="block text-xs font-medium text-gray-700">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          placeholder="Describe what you'd like the AI to help with..."
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
        />

        <button
          onClick={() => void generate()}
          disabled={loading || !prompt.trim() || !enabledTasks[taskType]}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </div>

      <div className="mt-4">
        <label className="block text-xs font-medium text-gray-700">Response</label>
        <div className="mt-1 rounded border border-gray-200 bg-gray-50 p-2">
          {responseText ? (
            <pre className="whitespace-pre-wrap text-xs text-gray-800">{responseText}</pre>
          ) : (
            <p className="text-xs text-gray-500">No response yet.</p>
          )}
        </div>
        <button
          onClick={() => void copyToClipboard()}
          disabled={!responseText}
          className="mt-2 rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Copy to Clipboard
        </button>
      </div>
    </section>
  );
}
