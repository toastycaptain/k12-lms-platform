"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@k12/ui";
import AiApplyModal from "@/components/AiApplyModal";
import { apiFetch, ApiError } from "@/lib/api";
import { buildSuggestionDiffs, parseStructuredAiOutput } from "@/lib/ai-output-parser";

export interface IbAiGroundingRef {
  type?: string;
  label: string;
  excerpt?: string;
}

export interface IbAiTargetField {
  field: string;
  label: string;
  currentValue: string;
}

export interface IbAiTaskOption {
  taskType: string;
  label: string;
  description: string;
  mode?: "diff" | "analysis";
  promptSeed?: string;
  targetFields?: IbAiTargetField[];
  context?: Record<string, unknown>;
  applyTarget?: { type: string; id: number | string };
  onApply?: (changes: Record<string, string>) => Promise<void> | void;
}

interface IbAiInvocationResponse {
  id: number;
  content: string;
  status: string;
  grounding_refs?: IbAiGroundingRef[];
  human_only_boundaries?: string[];
}

export function IbAiAssistPanel({
  title,
  description,
  taskOptions,
  commonContext = {},
  compact = false,
}: {
  title: string;
  description: string;
  taskOptions: IbAiTaskOption[];
  commonContext?: Record<string, unknown>;
  compact?: boolean;
}) {
  const { addToast } = useToast();
  const [selectedTaskType, setSelectedTaskType] = useState(taskOptions[0]?.taskType || "");
  const [prompt, setPrompt] = useState(taskOptions[0]?.promptSeed || "");
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IbAiInvocationResponse | null>(null);
  const [analysisText, setAnalysisText] = useState("");
  const [diffs, setDiffs] = useState<
    Array<{ field: string; label: string; previous: string; next: string }>
  >([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  const task = useMemo(
    () =>
      taskOptions.find((option) => option.taskType === selectedTaskType) || taskOptions[0] || null,
    [selectedTaskType, taskOptions],
  );

  useEffect(() => {
    setPrompt(task?.promptSeed || "");
    setError(null);
    setResult(null);
    setAnalysisText("");
    setDiffs([]);
    setSelectedFields([]);
    setModalOpen(false);
  }, [task?.promptSeed, task?.taskType]);

  async function runTask() {
    if (!task) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch<IbAiInvocationResponse>("/api/v1/ai_invocations", {
        method: "POST",
        body: JSON.stringify({
          task_type: task.taskType,
          prompt: prompt.trim() || undefined,
          context: {
            ...commonContext,
            ...task.context,
          },
        }),
      });
      setResult(response);

      if ((task.mode || "analysis") === "diff") {
        const structured = parseStructuredAiOutput(response.content || "");
        const currentValues = Object.fromEntries(
          (task.targetFields || []).map((field) => [field.field, field.currentValue]),
        );
        const nextDiffs = structured ? buildSuggestionDiffs(currentValues, structured) : [];
        setDiffs(nextDiffs);
        setSelectedFields(nextDiffs.filter((diff) => diff.changed).map((diff) => diff.field));
        setAnalysisText("");
      } else {
        setDiffs([]);
        setSelectedFields([]);
        setAnalysisText(response.content || "");
      }
    } catch (requestError) {
      setError(
        requestError instanceof ApiError ? requestError.message : "Unable to run AI assist.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function recordReview(review: Record<string, unknown>) {
    if (!result?.id) return;

    await apiFetch(`/api/v1/ai_invocations/${result.id}`, {
      method: "PATCH",
      body: JSON.stringify({ review }),
    });
  }

  async function applyDiffs() {
    if (!task?.onApply) return;

    const accepted = diffs
      .filter((diff) => selectedFields.includes(diff.field))
      .reduce<Record<string, string>>((memo, diff) => {
        memo[diff.field] = diff.next;
        return memo;
      }, {});
    if (Object.keys(accepted).length === 0) return;

    setApplying(true);

    try {
      await task.onApply(accepted);
      await apiFetch(`/api/v1/ai_invocations/${result?.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          applied_at: new Date().toISOString(),
          applied_to: task.applyTarget,
          review: {
            status: "applied",
            workflow: String(
              (task.context?.workflow as string | undefined) ||
                (commonContext.workflow as string | undefined) ||
                "",
            ),
            teacher_trust: 5,
            estimated_minutes_saved: 8,
            accepted_fields: selectedFields,
          },
        }),
      });
      addToast("success", "AI suggestions applied for review.");
      setModalOpen(false);
    } catch (applyError) {
      addToast(
        "error",
        applyError instanceof ApiError ? applyError.message : "Unable to apply suggestions.",
      );
    } finally {
      setApplying(false);
    }
  }

  async function sendFeedback(status: "helpful" | "needs_work", teacherTrust: number) {
    try {
      await recordReview({
        status,
        workflow: String(
          (task?.context?.workflow as string | undefined) ||
            (commonContext.workflow as string | undefined) ||
            "",
        ),
        teacher_trust: teacherTrust,
        estimated_minutes_saved: status === "helpful" ? 5 : 0,
        rejected_fields: status === "needs_work" ? selectedFields : [],
      });
      addToast("success", "AI feedback recorded.");
    } catch (reviewError) {
      addToast(
        "error",
        reviewError instanceof ApiError ? reviewError.message : "Unable to record AI feedback.",
      );
    }
  }

  if (!task) {
    return null;
  }

  const groundingRefs =
    result?.grounding_refs ||
    ((task.context?.grounding_refs as IbAiGroundingRef[] | undefined) ?? []);
  const boundaries = result?.human_only_boundaries || [];

  return (
    <section className="rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        {taskOptions.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {taskOptions.map((option) => (
              <button
                key={option.taskType}
                type="button"
                onClick={() => setSelectedTaskType(option.taskType)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  selectedTaskType === option.taskType
                    ? "bg-slate-950 text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <p className="font-semibold text-slate-950">{task.label}</p>
        <p className="mt-1">{task.description}</p>
      </div>

      <label className="mt-4 block text-sm font-medium text-slate-700">
        Teacher instruction
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Optional instruction to steer the assist."
          className={`mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm ${compact ? "min-h-24" : "min-h-28"}`}
        />
      </label>

      {groundingRefs.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Grounding
          </p>
          <div className="mt-2 space-y-2">
            {groundingRefs.slice(0, compact ? 2 : 4).map((ref, index) => (
              <div
                key={`${ref.label}-${index}`}
                className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700"
              >
                <p className="font-semibold text-slate-950">{ref.label}</p>
                {ref.excerpt ? <p className="mt-1">{ref.excerpt}</p> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {boundaries.length > 0 ? (
        <p className="mt-4 text-xs text-slate-500">
          Human-only boundaries: {boundaries.join(", ")}
        </p>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void runTask()}
          disabled={loading}
          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
        >
          {loading ? "Running..." : "Generate assist"}
        </button>
        {diffs.length > 0 && task.onApply ? (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Review diffs
          </button>
        ) : null}
        {result ? (
          <>
            <button
              type="button"
              onClick={() => void sendFeedback("helpful", 5)}
              className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700"
            >
              Helpful
            </button>
            <button
              type="button"
              onClick={() => void sendFeedback("needs_work", 2)}
              className="rounded-full border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-700"
            >
              Needs work
            </button>
          </>
        ) : null}
      </div>

      {diffs.length > 0 ? (
        <div className="mt-4 space-y-2">
          {diffs.map((diff) => (
            <div
              key={diff.field}
              className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700"
            >
              <p className="font-semibold text-slate-950">{diff.label}</p>
              <p className="mt-1 line-clamp-3">{diff.next || "No suggested content."}</p>
            </div>
          ))}
        </div>
      ) : null}

      {analysisText ? (
        <pre className="mt-4 overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {analysisText}
        </pre>
      ) : null}

      <AiApplyModal
        open={modalOpen}
        changes={diffs.map((diff) => ({
          field: diff.field,
          previous: diff.previous,
          next: diff.next,
        }))}
        applying={applying}
        selectedFields={selectedFields}
        onSelectionChange={setSelectedFields}
        onCancel={() => setModalOpen(false)}
        onConfirm={() => void applyDiffs()}
      />
    </section>
  );
}
