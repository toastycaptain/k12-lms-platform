"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api";
import { addonApiFetch, openAddonSignInPopup, resolveAddonToken } from "@/lib/addon-api";
import { useToast } from "@k12/ui";

type WorkspaceTab = "units" | "standards" | "ai";

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

interface CourseOption {
  id: number;
  name: string;
  code: string;
}

interface UnitPlanDetail {
  id: number;
  title: string;
  current_version_id: number | null;
}

interface AttachTarget {
  linkableType: "UnitVersion" | "LessonPlan";
  linkableId: number;
}

const TASK_OPTIONS = [
  { value: "lesson_plan", label: "Lesson Plan" },
  { value: "unit_plan", label: "Unit Plan" },
  { value: "differentiation", label: "Differentiation" },
  { value: "assessment", label: "Assessment" },
  { value: "rewrite", label: "Rewrite" },
];

function fallbackFileUrl(fileId: string, mimeType: string): string {
  const isPresentation = mimeType.includes("presentation");
  if (isPresentation) {
    return `https://docs.google.com/presentation/d/${fileId}`;
  }

  return `https://docs.google.com/document/d/${fileId}`;
}

function WorkspaceAddonInner() {
  const searchParams = useSearchParams();
  const { addToast } = useToast();

  const addonToken = resolveAddonToken(searchParams);

  const [tab, setTab] = useState<WorkspaceTab>("units");
  const [authState, setAuthState] = useState<"checking" | "authenticated" | "unauthenticated">(
    "checking",
  );
  const [loading, setLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState<AddonMe | null>(null);
  const [unitPlans, setUnitPlans] = useState<UnitPlanRow[]>([]);
  const [standards, setStandards] = useState<StandardRow[]>([]);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);

  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const [standardSearch, setStandardSearch] = useState("");

  const [fileId, setFileId] = useState(
    searchParams.get("fileId") ||
      searchParams.get("docId") ||
      searchParams.get("presentationId") ||
      "",
  );
  const [fileTitle, setFileTitle] = useState(
    searchParams.get("title") || "Google Workspace Attachment",
  );
  const [fileUrl, setFileUrl] = useState(searchParams.get("url") || "");
  const [fileMimeType, setFileMimeType] = useState(
    searchParams.get("mimeType") ||
      (searchParams.get("presentationId")
        ? "application/vnd.google-apps.presentation"
        : "application/vnd.google-apps.document"),
  );

  const [taskType, setTaskType] = useState("lesson_plan");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const groupedStandards = useMemo(() => {
    const visible = standards.filter((standard) => {
      if (!standardSearch.trim()) return true;
      const needle = standardSearch.toLowerCase();
      return (
        standard.code.toLowerCase().includes(needle) ||
        standard.description.toLowerCase().includes(needle) ||
        standard.framework_name.toLowerCase().includes(needle)
      );
    });

    const groups = new Map<string, StandardRow[]>();
    visible.forEach((standard) => {
      const key = standard.framework_name || "Other";
      const existing = groups.get(key) || [];
      existing.push(standard);
      groups.set(key, existing);
    });

    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [standardSearch, standards]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      setAuthState("checking");

      try {
        const [me, unitRows, templateRows, standardRows] = await Promise.all([
          addonApiFetch<AddonMe>("/api/v1/addon/me", addonToken),
          addonApiFetch<UnitPlanRow[]>("/api/v1/addon/unit_plans", addonToken),
          addonApiFetch<TemplateRow[]>("/api/v1/addon/templates", addonToken),
          addonApiFetch<StandardRow[]>("/api/v1/addon/standards", addonToken),
        ]);

        setCurrentUser(me);
        setUnitPlans(unitRows);
        setTemplates(templateRows);
        setStandards(standardRows);
        setSelectedUnitId((prev) => prev ?? unitRows[0]?.id ?? null);
        setSelectedTemplateId((prev) => prev || String(templateRows[0]?.id || ""));
        setAuthState("authenticated");

        try {
          const courseRows = await apiFetch<CourseOption[]>("/api/v1/courses");
          setCourses(courseRows);
          setSelectedCourseId((prev) => prev || String(courseRows[0]?.id || ""));
        } catch {
          // In iframe mode, third-party cookie auth may be blocked. Keep template action optional.
          setCourses([]);
        }
      } catch (fetchError) {
        if (fetchError instanceof ApiError && fetchError.status === 401) {
          setAuthState("unauthenticated");
          setError(
            addonToken
              ? "Your add-on session is not authorized. Sign in and reload the sidebar."
              : "Missing add-on token. Open this page from the Google Add-on host.",
          );
        } else {
          const message =
            fetchError instanceof Error ? fetchError.message : "Failed to load add-on data.";
          setAuthState("unauthenticated");
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [addonToken]);

  function buildDriveContext() {
    const normalizedId = fileId.trim();
    if (!normalizedId) {
      throw new Error("Google file id is required to insert content.");
    }

    const normalizedTitle = fileTitle.trim() || "Google Workspace Attachment";
    const normalizedMime = fileMimeType.trim() || "application/vnd.google-apps.document";
    const normalizedUrl = fileUrl.trim() || fallbackFileUrl(normalizedId, normalizedMime);

    return {
      drive_file_id: normalizedId,
      drive_file_title: normalizedTitle,
      drive_file_url: normalizedUrl,
      drive_mime_type: normalizedMime,
    };
  }

  async function resolveAttachTargetForUnit(unitId: number): Promise<AttachTarget> {
    // Prefer UnitVersion when regular session auth is available.
    try {
      const detail = await apiFetch<UnitPlanDetail>(`/api/v1/unit_plans/${unitId}`);
      if (detail.current_version_id) {
        return {
          linkableType: "UnitVersion",
          linkableId: detail.current_version_id,
        };
      }
    } catch {
      // Fallback to lesson-level attachment in bearer-token-only add-on mode.
    }

    const lessons = await addonApiFetch<LessonRow[]>(
      `/api/v1/addon/unit_plans/${unitId}/lessons`,
      addonToken,
    );
    const firstLesson = lessons[0];

    if (!firstLesson) {
      throw new Error("This unit has no lessons yet. Add a lesson before inserting.");
    }

    return {
      linkableType: "LessonPlan",
      linkableId: firstLesson.id,
    };
  }

  async function attachResource(target: AttachTarget, titleOverride?: string) {
    const context = buildDriveContext();
    await addonApiFetch("/api/v1/addon/attach", addonToken, {
      method: "POST",
      body: JSON.stringify({
        linkable_type: target.linkableType,
        linkable_id: target.linkableId,
        ...context,
        drive_file_title: titleOverride || context.drive_file_title,
      }),
    });
  }

  async function insertUnit(unit: UnitPlanRow) {
    setBusyKey(`unit-${unit.id}`);
    setError(null);

    try {
      const target = await resolveAttachTargetForUnit(unit.id);
      await attachResource(target);
      addToast("success", `Inserted ${unit.title}`);
    } catch (insertError) {
      const message = insertError instanceof Error ? insertError.message : "Failed to insert unit.";
      setError(message);
      addToast("error", message);
    } finally {
      setBusyKey(null);
    }
  }

  async function insertStandard(standard: StandardRow) {
    if (!selectedUnitId) {
      const message = "Select a unit first to attach this standard context.";
      setError(message);
      addToast("error", message);
      return;
    }

    setBusyKey(`standard-${standard.id}`);
    setError(null);

    try {
      const target = await resolveAttachTargetForUnit(selectedUnitId);
      await attachResource(
        target,
        `${fileTitle || "Google Workspace Attachment"} · ${standard.code}`,
      );
      addToast("success", `Inserted ${standard.code}`);
    } catch (insertError) {
      const message =
        insertError instanceof Error ? insertError.message : "Failed to insert selected standard.";
      setError(message);
      addToast("error", message);
    } finally {
      setBusyKey(null);
    }
  }

  async function createFromTemplate() {
    if (!selectedTemplateId) {
      const message = "Choose a template first.";
      setError(message);
      addToast("error", message);
      return;
    }

    if (!selectedCourseId) {
      const message = "Choose a target course before creating a unit.";
      setError(message);
      addToast("error", message);
      return;
    }

    setBusyKey("create-template");
    setError(null);

    try {
      const created = await apiFetch<UnitPlanDetail>(
        `/api/v1/templates/${selectedTemplateId}/create_unit`,
        {
          method: "POST",
          body: JSON.stringify({ course_id: Number(selectedCourseId) }),
        },
      );

      setUnitPlans((prev) => {
        if (prev.some((row) => row.id === created.id)) return prev;
        return [
          {
            id: created.id,
            title: created.title,
            status: "draft",
            updated_at: new Date().toISOString(),
          },
          ...prev,
        ];
      });
      setSelectedUnitId(created.id);

      const target: AttachTarget = created.current_version_id
        ? { linkableType: "UnitVersion", linkableId: created.current_version_id }
        : await resolveAttachTargetForUnit(created.id);

      await attachResource(target);
      addToast("success", "Created unit from template and linked it to this file.");
    } catch (createError) {
      const message =
        createError instanceof Error
          ? createError.message
          : "Failed to create a unit from the selected template.";
      setError(message);
      addToast("error", message);
    } finally {
      setBusyKey(null);
    }
  }

  async function runAiAssist() {
    if (!aiPrompt.trim()) return;

    setAiBusy(true);
    setError(null);

    try {
      const result = await addonApiFetch<{ content?: string }>(
        "/api/v1/addon/ai_generate",
        addonToken,
        {
          method: "POST",
          body: JSON.stringify({
            task_type: taskType,
            prompt: aiPrompt.trim(),
            context: {
              selected_unit_id: selectedUnitId,
              file_id: fileId || null,
            },
          }),
        },
      );
      setAiResult(result.content || "");
    } catch (aiError) {
      const message = aiError instanceof Error ? aiError.message : "AI generation failed.";
      setError(message);
      addToast("error", message);
    } finally {
      setAiBusy(false);
    }
  }

  async function copyAiResult() {
    if (!aiResult) return;

    try {
      await navigator.clipboard.writeText(aiResult);
      addToast("success", "AI result copied to clipboard.");
    } catch {
      addToast("error", "Could not copy AI result.");
    }
  }

  if (loading || authState === "checking") {
    return <p className="p-3 text-sm text-slate-500">Loading Workspace add-on…</p>;
  }

  if (authState === "unauthenticated") {
    return (
      <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <h1 className="text-base font-semibold">Sign in to connect</h1>
        <p>
          This sidebar needs an authenticated add-on context before it can insert LMS resources into
          your Google file.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={openAddonSignInPopup}
            className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
          >
            Sign In
          </button>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
          >
            Reload
          </button>
        </div>
        {error && <p className="text-xs text-amber-800">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <header className="rounded-xl border border-slate-200 bg-white p-3">
        <h1 className="text-sm font-semibold text-slate-900">Workspace Add-on</h1>
        {currentUser && (
          <p className="mt-1 text-xs text-slate-500">
            {currentUser.name} · {currentUser.tenant_name}
          </p>
        )}
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          File Context
        </p>
        <div className="mt-2 grid grid-cols-1 gap-2">
          <input
            value={fileId}
            onChange={(event) => setFileId(event.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-xs"
            placeholder="Google file id"
          />
          <input
            value={fileTitle}
            onChange={(event) => setFileTitle(event.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-xs"
            placeholder="File title"
          />
          <input
            value={fileUrl}
            onChange={(event) => setFileUrl(event.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-xs"
            placeholder="Optional file URL"
          />
          <select
            value={fileMimeType}
            onChange={(event) => setFileMimeType(event.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-xs"
          >
            <option value="application/vnd.google-apps.document">Google Doc</option>
            <option value="application/vnd.google-apps.presentation">Google Slides</option>
          </select>
        </div>
      </section>

      {error && <div className="rounded-md bg-rose-50 p-2 text-xs text-rose-700">{error}</div>}

      <div className="rounded-xl border border-slate-200 bg-white p-1">
        <div className="grid grid-cols-3 gap-1">
          {(
            [
              { id: "units", label: "Unit Plans" },
              { id: "standards", label: "Standards" },
              { id: "ai", label: "AI Assist" },
            ] as Array<{ id: WorkspaceTab; label: string }>
          ).map((tabOption) => (
            <button
              key={tabOption.id}
              onClick={() => setTab(tabOption.id)}
              className={`rounded-md px-2 py-2 text-xs font-medium ${
                tab === tabOption.id
                  ? "bg-blue-600 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {tabOption.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "units" && (
        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Create from Template</h2>
            <div className="mt-2 grid grid-cols-1 gap-2">
              <select
                value={selectedTemplateId}
                onChange={(event) => setSelectedTemplateId(event.target.value)}
                className="rounded border border-slate-300 px-2 py-1 text-xs"
              >
                <option value="">Select template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedCourseId}
                onChange={(event) => setSelectedCourseId(event.target.value)}
                className="rounded border border-slate-300 px-2 py-1 text-xs"
              >
                <option value="">Select course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name} ({course.code})
                  </option>
                ))}
              </select>
              <button
                onClick={() => void createFromTemplate()}
                disabled={busyKey === "create-template"}
                className="rounded bg-blue-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {busyKey === "create-template" ? "Creating..." : "Create from Template"}
              </button>
              {courses.length === 0 && (
                <p className="text-[11px] text-slate-500">
                  Course list is unavailable in this iframe session. Sign in again if needed.
                </p>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900">Unit Plans</h2>
            <div className="mt-2 space-y-2">
              {unitPlans.map((unit) => (
                <div key={unit.id} className="rounded-lg border border-slate-200 p-2">
                  <button
                    onClick={() => setSelectedUnitId(unit.id)}
                    className={`block w-full text-left text-xs font-medium ${
                      selectedUnitId === unit.id ? "text-blue-700" : "text-slate-900"
                    }`}
                  >
                    {unit.title}
                  </button>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {unit.status} · Updated {new Date(unit.updated_at).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => void insertUnit(unit)}
                    disabled={busyKey === `unit-${unit.id}`}
                    className="mt-2 rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {busyKey === `unit-${unit.id}` ? "Inserting..." : "Insert"}
                  </button>
                </div>
              ))}
              {unitPlans.length === 0 && (
                <p className="text-xs text-slate-500">No unit plans available.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {tab === "standards" && (
        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
          <h2 className="text-sm font-semibold text-slate-900">Standards Browser</h2>
          <input
            value={standardSearch}
            onChange={(event) => setStandardSearch(event.target.value)}
            placeholder="Search code, description, or framework"
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
          />

          <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
            {groupedStandards.map(([frameworkName, rows]) => (
              <div key={frameworkName}>
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {frameworkName}
                </h3>
                <div className="mt-1 space-y-1">
                  {rows.map((standard) => (
                    <div key={standard.id} className="rounded border border-slate-200 p-2">
                      <p className="text-xs font-medium text-slate-900">{standard.code}</p>
                      <p className="text-[11px] text-slate-600">{standard.description}</p>
                      <button
                        onClick={() => void insertStandard(standard)}
                        disabled={busyKey === `standard-${standard.id}`}
                        className="mt-1 rounded border border-slate-300 px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {busyKey === `standard-${standard.id}` ? "Inserting..." : "Insert"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {groupedStandards.length === 0 && (
              <p className="text-xs text-slate-500">No standards match the current search.</p>
            )}
          </div>
        </section>
      )}

      {tab === "ai" && (
        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
          <h2 className="text-sm font-semibold text-slate-900">AI Assist</h2>
          <select
            value={taskType}
            onChange={(event) => setTaskType(event.target.value)}
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
            onChange={(event) => setAiPrompt(event.target.value)}
            rows={5}
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
            placeholder="Draft a quick lesson intro for a mixed-ability class..."
          />

          <button
            onClick={() => void runAiAssist()}
            disabled={aiBusy || !aiPrompt.trim()}
            className="rounded bg-blue-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {aiBusy ? "Generating..." : "Generate"}
          </button>

          {aiResult && (
            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
              <pre className="whitespace-pre-wrap text-xs text-slate-700">{aiResult}</pre>
              <button
                onClick={() => void copyAiResult()}
                className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-white"
              >
                Copy
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default function WorkspaceAddonPage() {
  return (
    <Suspense fallback={<p className="p-3 text-sm text-slate-500">Loading Workspace add-on…</p>}>
      <WorkspaceAddonInner />
    </Suspense>
  );
}
