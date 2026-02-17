"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { apiFetchStream, isAbortError } from "@/lib/api-stream";
import { useAuth } from "@/lib/auth-context";

interface AiTaskPolicy {
  id: number;
  task_type: string;
  enabled: boolean;
  allowed_roles?: string[];
}

interface AiProviderConfig {
  id: number;
  status: "active" | "inactive";
}

interface InvocationResponse {
  id: number;
  content: string;
  provider: string;
  model: string;
  status: string;
}

interface AiApplyTargetOption {
  value: string;
  label: string;
}

interface AiAssistantPanelProps {
  unitId?: number;
  lessonId?: number;
  context?: Record<string, string>;
  onApply?: (content: string, target?: string) => void;
  applyTargets?: AiApplyTargetOption[];
  onTaskTypeChange?: (taskType: string) => void;
}

const TASK_TYPES = ["lesson_plan", "unit_plan", "differentiation", "assessment", "rewrite"];

export default function AiAssistantPanel({
  unitId,
  lessonId,
  context = {},
  onApply,
  applyTargets,
  onTaskTypeChange,
}: AiAssistantPanelProps) {
  const { user } = useAuth();

  const [taskType, setTaskType] = useState<string>("lesson_plan");
  const [prompt, setPrompt] = useState("");
  const [responseText, setResponseText] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [policyHint, setPolicyHint] = useState<string | null>(null);
  const [applyHint, setApplyHint] = useState<string | null>(null);
  const [applyTarget, setApplyTarget] = useState("all");
  const [providerConfigured, setProviderConfigured] = useState<boolean | null>(null);
  const [policiesLoaded, setPoliciesLoaded] = useState(false);
  const [enabledTasks, setEnabledTasks] = useState<Record<string, boolean>>(
    Object.fromEntries(TASK_TYPES.map((value) => [value, false])) as Record<string, boolean>,
  );

  const streamAbortRef = useRef<AbortController | null>(null);
  const userRoles = user?.roles ?? [];
  const userRolesKey = useMemo(() => userRoles.slice().sort().join("|"), [userRoles]);

  useEffect(() => {
    onTaskTypeChange?.(taskType);
  }, [onTaskTypeChange, taskType]);

  useEffect(() => {
    let cancelled = false;

    async function loadCapabilities() {
      setPoliciesLoaded(false);
      setPolicyHint(null);

      try {
        const [configs, policies] = await Promise.all([
          apiFetch<AiProviderConfig[]>("/api/v1/ai_provider_configs"),
          apiFetch<AiTaskPolicy[]>("/api/v1/ai_task_policies"),
        ]);

        if (cancelled) return;

        const hasActiveProvider = configs.some((config) => config.status === "active");
        setProviderConfigured(hasActiveProvider);

        const enabledMap = Object.fromEntries(TASK_TYPES.map((value) => [value, false])) as Record<
          string,
          boolean
        >;

        policies.forEach((policy) => {
          if (!TASK_TYPES.includes(policy.task_type) || !policy.enabled) return;

          const allowedRoles = Array.isArray(policy.allowed_roles) ? policy.allowed_roles : [];
          const roleAllowed =
            allowedRoles.length === 0 || userRoles.some((role) => allowedRoles.includes(role));
          enabledMap[policy.task_type] = roleAllowed;
        });

        setEnabledTasks(enabledMap);
        setPoliciesLoaded(true);

        const firstEnabledTask = TASK_TYPES.find((value) => enabledMap[value]);
        setTaskType((previousTaskType) => {
          if (enabledMap[previousTaskType]) return previousTaskType;
          return firstEnabledTask || previousTaskType;
        });

        if (!hasActiveProvider) {
          setPolicyHint("AI is not configured. Contact your administrator.");
        } else if (!firstEnabledTask) {
          setPolicyHint("No AI task types are enabled for your role.");
        }
      } catch (e) {
        if (!cancelled) {
          setEnabledTasks(
            Object.fromEntries(TASK_TYPES.map((value) => [value, false])) as Record<
              string,
              boolean
            >,
          );
          setProviderConfigured(false);

          if (e instanceof ApiError) {
            setPolicyHint(e.message);
          } else {
            setPolicyHint("Unable to load AI configuration. Contact your administrator.");
          }
        }
      }
    }

    void loadCapabilities();

    return () => {
      cancelled = true;
    };
  }, [userRolesKey]);

  useEffect(() => {
    return () => {
      streamAbortRef.current?.abort();
    };
  }, []);

  const contextPayload = useMemo(() => {
    return {
      ...(unitId ? { unit_id: String(unitId) } : {}),
      ...(lessonId ? { lesson_id: String(lessonId) } : {}),
      ...context,
    };
  }, [unitId, lessonId, context]);

  const resolvedApplyTargets = useMemo<AiApplyTargetOption[]>(() => {
    if (!onApply) return [];

    if (!applyTargets || applyTargets.length === 0) {
      return [{ value: "all", label: "Apply All" }];
    }

    const values = new Map<string, string>();
    values.set("all", "Apply All");
    applyTargets.forEach((target) => {
      if (!target?.value || target.value === "all") return;
      values.set(target.value, target.label || target.value);
    });

    return Array.from(values.entries()).map(([value, label]) => ({ value, label }));
  }, [applyTargets, onApply]);

  useEffect(() => {
    if (resolvedApplyTargets.length === 0) return;
    if (resolvedApplyTargets.some((target) => target.value === applyTarget)) return;

    setApplyTarget(resolvedApplyTargets[0].value);
  }, [applyTarget, resolvedApplyTargets]);

  async function runFallbackGeneration(trimmedPrompt: string) {
    const result = await apiFetch<InvocationResponse>("/api/v1/ai_invocations", {
      method: "POST",
      body: JSON.stringify({
        task_type: taskType,
        prompt: trimmedPrompt,
        context: contextPayload,
      }),
    });

    setResponseText(result.content || "");
  }

  async function generate() {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) return;

    if (!providerConfigured) {
      setError("AI is not configured. Contact your administrator.");
      return;
    }

    if (!enabledTasks[taskType]) {
      setError("This task type is not available for your role.");
      return;
    }

    setLoading(true);
    setStreaming(true);
    setError(null);
    setApplyHint(null);
    setResponseText("");

    let streamFailed = false;
    let aborted = false;

    const abortController = new AbortController();
    streamAbortRef.current = abortController;

    try {
      await apiFetchStream(
        "/api/v1/ai/stream",
        {
          task_type: taskType,
          prompt: trimmedPrompt,
          context: contextPayload,
          messages: [
            {
              role: "user",
              content: trimmedPrompt,
            },
          ],
        },
        (token) => {
          setResponseText((previous) => previous + token);
        },
        (fullText) => {
          setResponseText(fullText);
        },
        () => {
          streamFailed = true;
        },
        abortController.signal,
      );
    } catch (e) {
      if (isAbortError(e)) {
        aborted = true;
      } else {
        streamFailed = true;
      }
    } finally {
      setStreaming(false);
      streamAbortRef.current = null;
    }

    if (aborted) {
      setLoading(false);
      setError("Generation stopped.");
      return;
    }

    if (streamFailed) {
      try {
        await runFallbackGeneration(trimmedPrompt);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "AI generation failed.");
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(false);
  }

  function stopGeneration() {
    streamAbortRef.current?.abort();
  }

  async function copyToClipboard() {
    if (!responseText) return;
    await navigator.clipboard.writeText(responseText);
  }

  function applyContent() {
    if (!responseText || !onApply) return;
    if (applyTarget === "all") {
      onApply(responseText);
      setApplyHint("Applied to editor.");
      return;
    }

    const label = resolvedApplyTargets.find((target) => target.value === applyTarget)?.label;
    onApply(responseText, applyTarget);
    setApplyHint(`Applied ${label ? label.toLowerCase() : "selected field"}.`);
  }

  const restrictedTaskCount = TASK_TYPES.filter((taskName) => !enabledTasks[taskName]).length;

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-900">AI Assistant</h3>
      {policiesLoaded && (
        <div className="mt-2 rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-xs text-sky-800">
          AI actions are governed by your school&apos;s policy.
          {restrictedTaskCount > 0 && " Some tasks are unavailable for your role."}
        </div>
      )}
      {policyHint && <p className="mt-1 text-xs text-gray-500">{policyHint}</p>}
      {error && <p className="mt-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700">{error}</p>}
      {applyHint && (
        <p className="mt-2 rounded bg-green-50 px-2 py-1 text-xs text-green-700">{applyHint}</p>
      )}

      <div className="mt-3 space-y-2">
        <label className="block text-xs font-medium text-gray-700">Task Type</label>
        <div className="grid grid-cols-2 gap-2">
          {TASK_TYPES.map((value) => {
            const available = Boolean(enabledTasks[value]) && providerConfigured === true;
            const selected = taskType === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTaskType(value)}
                disabled={!available}
                className={`rounded border px-2 py-1.5 text-left text-xs ${
                  selected
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-300 bg-white text-gray-700"
                } ${!available ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400" : ""}`}
              >
                {value}
              </button>
            );
          })}
        </div>

        <label className="block text-xs font-medium text-gray-700">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            setApplyHint(null);
          }}
          rows={5}
          placeholder="Describe what you'd like the AI to help with..."
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
        />

        <div className="flex items-center gap-2">
          <button
            onClick={() => void generate()}
            disabled={loading || !prompt.trim() || !enabledTasks[taskType] || !providerConfigured}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate"}
          </button>
          {streaming && (
            <button
              onClick={stopGeneration}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-xs font-medium text-gray-700">Response</label>
        <div className="mt-1 rounded border border-gray-200 bg-gray-50 p-2">
          {responseText || loading ? (
            <pre className="whitespace-pre-wrap text-xs text-gray-800">
              {responseText}
              {loading && <span className="inline-block animate-pulse">|</span>}
            </pre>
          ) : (
            <p className="text-xs text-gray-500">No response yet.</p>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2">
          {onApply && resolvedApplyTargets.length > 1 && (
            <select
              aria-label="Apply target"
              value={applyTarget}
              onChange={(event) => setApplyTarget(event.target.value)}
              className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700"
            >
              {resolvedApplyTargets.map((target) => (
                <option key={target.value} value={target.value}>
                  {target.label}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={applyContent}
            disabled={!responseText || !onApply}
            className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Apply
          </button>
          <button
            onClick={() => void copyToClipboard()}
            disabled={!responseText}
            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Copy to Clipboard
          </button>
        </div>
      </div>
    </section>
  );
}
