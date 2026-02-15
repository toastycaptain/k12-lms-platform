"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface UnitPlanRow {
  id: number;
  title: string;
  status: string;
  updated_at: string;
}

interface LessonRow {
  id: number;
  title: string;
  position: number;
}

interface StandardRow {
  id: number;
  code: string;
  description: string;
  framework_id: number;
  framework_name: string;
}

interface TemplateRow {
  id: number;
  name: string;
  subject: string | null;
  grade_level: string | null;
}

interface AddonMe {
  id: number;
  name: string;
  email: string;
  tenant_name: string;
}

async function addonFetch<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "Addon API request failed";
    try {
      const body = await response.json();
      message = body?.error || body?.detail || message;
    } catch {
      // no-op
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

const TASK_OPTIONS = [
  { value: "lesson_plan", label: "Lesson Plan" },
  { value: "unit_plan", label: "Unit Plan" },
  { value: "differentiation", label: "Differentiation" },
  { value: "assessment", label: "Assessment" },
  { value: "rewrite", label: "Rewrite" },
];

function AddonSidebarInner() {
  const searchParams = useSearchParams();
  const addonToken = searchParams.get("token") || process.env.NEXT_PUBLIC_ADDON_TOKEN || "";

  const [currentUser, setCurrentUser] = useState<AddonMe | null>(null);
  const [unitPlans, setUnitPlans] = useState<UnitPlanRow[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [alignedStandards, setAlignedStandards] = useState<StandardRow[]>([]);
  const [publishedTemplates, setPublishedTemplates] = useState<TemplateRow[]>([]);
  const [allStandards, setAllStandards] = useState<StandardRow[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [frameworkId, setFrameworkId] = useState("");

  const [taskType, setTaskType] = useState("lesson_plan");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [fileId, setFileId] = useState(searchParams.get("fileId") || searchParams.get("docId") || "");
  const [fileTitle, setFileTitle] = useState(searchParams.get("title") || "Google Workspace Attachment");
  const [fileUrl, setFileUrl] = useState(searchParams.get("url") || "");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const frameworkOptions = useMemo(() => {
    const byName = new Map<number, string>();
    for (const standard of allStandards) {
      byName.set(standard.framework_id, standard.framework_name);
    }
    return Array.from(byName.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [allStandards]);

  const visibleStandards = useMemo(() => {
    if (!searchQuery.trim()) return allStandards.slice(0, 25);

    const q = searchQuery.toLowerCase();
    return allStandards.filter((s) => {
      return s.code.toLowerCase().includes(q) || (s.description || "").toLowerCase().includes(q);
    });
  }, [allStandards, searchQuery]);

  useEffect(() => {
    if (!addonToken) {
      setLoading(false);
      setError("Missing addon token. Pass ?token=... in the add-on URL.");
      return;
    }

    async function loadInitial() {
      setLoading(true);
      setError(null);

      try {
        const [me, plans, templates, standards] = await Promise.all([
          addonFetch<AddonMe>("/api/v1/addon/me", addonToken),
          addonFetch<UnitPlanRow[]>("/api/v1/addon/unit_plans", addonToken),
          addonFetch<TemplateRow[]>("/api/v1/addon/templates", addonToken),
          addonFetch<StandardRow[]>("/api/v1/addon/standards", addonToken),
        ]);

        setCurrentUser(me);
        setUnitPlans(plans);
        setPublishedTemplates(templates);
        setAllStandards(standards);
        if (plans[0]) {
          setSelectedUnitId(plans[0].id);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to load add-on data.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void loadInitial();
  }, [addonToken]);

  useEffect(() => {
    if (!addonToken || !selectedUnitId) {
      setLessons([]);
      setAlignedStandards([]);
      return;
    }

    async function loadUnitDetails() {
      try {
        const [lessonRows, standardRows] = await Promise.all([
          addonFetch<LessonRow[]>(`/api/v1/addon/unit_plans/${selectedUnitId}/lessons`, addonToken),
          addonFetch<StandardRow[]>(`/api/v1/addon/unit_plans/${selectedUnitId}/standards`, addonToken),
        ]);
        setLessons(lessonRows);
        setAlignedStandards(standardRows);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to load unit details.";
        setError(message);
      }
    }

    void loadUnitDetails();
  }, [addonToken, selectedUnitId]);

  useEffect(() => {
    if (!addonToken) return;
    async function reloadStandards() {
      try {
        const path = frameworkId
          ? `/api/v1/addon/standards?framework_id=${encodeURIComponent(frameworkId)}`
          : "/api/v1/addon/standards";
        const standards = await addonFetch<StandardRow[]>(path, addonToken);
        setAllStandards(standards);
      } catch {
        // keep previous results if reload fails
      }
    }

    void reloadStandards();
  }, [addonToken, frameworkId]);

  async function attachToLesson(lessonId: number) {
    if (!addonToken) return;
    if (!fileId.trim()) {
      setError("Provide a Google file id before attaching.");
      return;
    }

    const resolvedUrl = fileUrl.trim() || `https://docs.google.com/document/d/${fileId}`;
    const resolvedTitle = fileTitle.trim() || "Google Workspace Attachment";

    setError(null);
    setSuccess(null);
    try {
      await addonFetch("/api/v1/addon/attach", addonToken, {
        method: "POST",
        body: JSON.stringify({
          linkable_type: "LessonPlan",
          linkable_id: lessonId,
          drive_file_url: resolvedUrl,
          drive_file_title: resolvedTitle,
          drive_file_id: fileId.trim(),
          drive_mime_type: "application/vnd.google-apps.document",
        }),
      });
      setSuccess("Attachment linked to lesson.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to attach resource.";
      setError(message);
    }
  }

  async function runAiAssist() {
    if (!addonToken || !aiPrompt.trim()) return;
    setAiLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await addonFetch<{ content?: string }>("/api/v1/addon/ai_generate", addonToken, {
        method: "POST",
        body: JSON.stringify({
          task_type: taskType,
          prompt: aiPrompt.trim(),
          context: {
            selected_unit_id: selectedUnitId,
            selected_lesson_ids: lessons.map((l) => l.id),
          },
        }),
      });
      setAiResult(response.content || "");
    } catch (e) {
      const message = e instanceof Error ? e.message : "AI generation failed.";
      setError(message);
    } finally {
      setAiLoading(false);
    }
  }

  async function copyToDoc() {
    if (!aiResult) return;
    await navigator.clipboard.writeText(aiResult);
    setSuccess("AI result copied to clipboard. Paste into your document.");
  }

  if (loading) {
    return <p className="p-3 text-sm text-slate-500">Loading add-on panel...</p>;
  }

  return (
    <div className="space-y-4">
      <header className="rounded-lg border border-slate-200 bg-white p-3">
        <h1 className="text-base font-semibold text-slate-900">K-12 LMS Add-on</h1>
        {currentUser && (
          <p className="mt-1 text-xs text-slate-500">
            {currentUser.name} · {currentUser.tenant_name}
          </p>
        )}
      </header>

      {error && <div className="rounded-md bg-rose-50 p-2 text-xs text-rose-700">{error}</div>}
      {success && <div className="rounded-md bg-emerald-50 p-2 text-xs text-emerald-700">{success}</div>}

      <section className="rounded-lg border border-slate-200 bg-white p-3">
        <h2 className="text-sm font-semibold text-slate-900">Recent Unit Plans</h2>
        <div className="mt-2 space-y-1">
          {unitPlans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedUnitId(plan.id)}
              className={`block w-full rounded-md px-2 py-1.5 text-left text-xs ${
                selectedUnitId === plan.id ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {plan.title}
            </button>
          ))}
          {unitPlans.length === 0 && <p className="text-xs text-slate-500">No unit plans found.</p>}
        </div>

        <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Lessons</h3>
        <div className="mt-1 space-y-1">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="rounded-md border border-slate-200 p-2">
              <p className="text-xs font-medium text-slate-900">{lesson.title}</p>
              <button
                onClick={() => void attachToLesson(lesson.id)}
                className="mt-1 rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
              >
                Attach to Lesson
              </button>
            </div>
          ))}
          {selectedUnitId && lessons.length === 0 && <p className="text-xs text-slate-500">No lessons in this unit.</p>}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2">
          <input
            value={fileId}
            onChange={(e) => setFileId(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-xs"
            placeholder="Google file id"
          />
          <input
            value={fileTitle}
            onChange={(e) => setFileTitle(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-xs"
            placeholder="Attachment title"
          />
          <input
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-xs"
            placeholder="Optional full file URL"
          />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-3">
        <h2 className="text-sm font-semibold text-slate-900">Standards</h2>
        <div className="mt-2 grid grid-cols-1 gap-2">
          <select
            value={frameworkId}
            onChange={(e) => setFrameworkId(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-xs"
          >
            <option value="">All Frameworks</option>
            {frameworkOptions.map(([frameworkIdValue, frameworkName]) => (
              <option key={frameworkIdValue} value={frameworkIdValue}>
                {frameworkName}
              </option>
            ))}
          </select>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-xs"
            placeholder="Search standards..."
          />
        </div>

        <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
          {visibleStandards.map((standard) => (
            <div key={standard.id} className="rounded border border-slate-200 p-2 text-xs">
              <p className="font-medium text-slate-900">{standard.code}</p>
              <p className="text-slate-600">{standard.description}</p>
            </div>
          ))}
        </div>

        <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Aligned to Selected Unit</h3>
        <div className="mt-1 space-y-1">
          {alignedStandards.map((standard) => (
            <div key={standard.id} className="rounded border border-blue-100 bg-blue-50 p-2 text-xs text-blue-800">
              {standard.code} · {standard.description}
            </div>
          ))}
          {selectedUnitId && alignedStandards.length === 0 && (
            <p className="text-xs text-slate-500">No aligned standards found for this unit.</p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-3">
        <h2 className="text-sm font-semibold text-slate-900">AI Assist</h2>
        <div className="mt-2 space-y-2">
          <select
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
          >
            {TASK_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            rows={4}
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
            placeholder="Ask AI to draft or revise content..."
          />
          <button
            onClick={() => void runAiAssist()}
            disabled={aiLoading || !aiPrompt.trim()}
            className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {aiLoading ? "Generating..." : "Generate"}
          </button>
          {aiResult && (
            <div className="space-y-2 rounded border border-slate-200 bg-slate-50 p-2">
              <pre className="whitespace-pre-wrap text-xs text-slate-700">{aiResult}</pre>
              <button
                onClick={() => void copyToDoc()}
                className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-white"
              >
                Copy to Doc
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-3">
        <h2 className="text-sm font-semibold text-slate-900">Published Templates</h2>
        <div className="mt-2 space-y-1">
          {publishedTemplates.map((template) => (
            <div key={template.id} className="rounded border border-slate-200 p-2 text-xs">
              <p className="font-medium text-slate-900">{template.name}</p>
              <p className="text-slate-500">
                {template.subject || "General"} · {template.grade_level || "All Grades"}
              </p>
            </div>
          ))}
          {publishedTemplates.length === 0 && <p className="text-xs text-slate-500">No published templates.</p>}
        </div>
      </section>
    </div>
  );
}

export default function AddonSidebarPage() {
  return (
    <Suspense fallback={<p className="p-3 text-sm text-slate-500">Loading add-on panel...</p>}>
      <AddonSidebarInner />
    </Suspense>
  );
}
