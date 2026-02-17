"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import GoogleDrivePicker from "@/components/GoogleDrivePicker";
import AiAssistantPanel from "@/components/AiAssistantPanel";
import AiApplyModal, { type AiApplyChange } from "@/components/AiApplyModal";
import { parseLessonOutput, type LessonPlanOutput } from "@/lib/ai-output-parser";

interface LessonPlan {
  id: number;
  title: string;
  status: string;
  position: number;
  current_version_id: number | null;
}

interface LessonVersion {
  id: number;
  version_number: number;
  title: string;
  objectives: string | null;
  activities: string | null;
  materials: string | null;
  duration_minutes: number | null;
  created_at: string;
}

interface ResourceLink {
  id: number;
  title: string;
  url: string;
  provider: string;
}

export default function LessonEditorPage() {
  const params = useParams();
  const unitId = params.id as string;
  const lessonId = params.lessonId as string;

  const { user } = useAuth();

  const [lesson, setLesson] = useState<LessonPlan | null>(null);
  const [currentVersion, setCurrentVersion] = useState<LessonVersion | null>(null);
  const [resources, setResources] = useState<ResourceLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiTaskType, setAiTaskType] = useState("lesson_plan");
  const [applyingAi, setApplyingAi] = useState(false);
  const [aiApplyError, setAiApplyError] = useState<string | null>(null);
  const [aiApplyMessage, setAiApplyMessage] = useState<string | null>(null);
  const [pendingAiDraft, setPendingAiDraft] = useState<LessonPlanOutput | null>(null);
  const [pendingAiChanges, setPendingAiChanges] = useState<AiApplyChange[]>([]);
  const [showAiApplyModal, setShowAiApplyModal] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [objectives, setObjectives] = useState("");
  const [activities, setActivities] = useState("");
  const [materials, setMaterials] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<string>("");

  // Resource link form
  const [newResourceUrl, setNewResourceUrl] = useState("");
  const [newResourceTitle, setNewResourceTitle] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const lessonData = await apiFetch<LessonPlan>(
        `/api/v1/unit_plans/${unitId}/lesson_plans/${lessonId}`,
      );
      setLesson(lessonData);

      const versions = await apiFetch<LessonVersion[]>(
        `/api/v1/unit_plans/${unitId}/lesson_plans/${lessonId}/versions`,
      );

      if (versions.length > 0) {
        const cv = versions[0]; // sorted desc
        setCurrentVersion(cv);
        setTitle(cv.title);
        setObjectives(cv.objectives || "");
        setActivities(cv.activities || "");
        setMaterials(cv.materials || "");
        setDurationMinutes(cv.duration_minutes?.toString() || "");

        // Fetch resource links for current version
        try {
          const links = await apiFetch<ResourceLink[]>(
            `/api/v1/lesson_versions/${cv.id}/resource_links`,
          );
          setResources(links);
        } catch {
          // No resources
        }
      } else {
        setTitle(lessonData.title);
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, [unitId, lessonId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/v1/unit_plans/${unitId}/lesson_plans/${lessonId}/create_version`, {
        method: "POST",
        body: JSON.stringify({
          version: {
            title,
            objectives,
            activities,
            materials,
            duration_minutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
          },
        }),
      });
      await fetchData();
    } catch {
      // Handle error
    } finally {
      setSaving(false);
    }
  };

  const handleAddResource = async () => {
    if (!newResourceUrl.trim() || !currentVersion) return;
    try {
      await apiFetch(`/api/v1/lesson_versions/${currentVersion.id}/resource_links`, {
        method: "POST",
        body: JSON.stringify({
          resource_link: {
            url: newResourceUrl,
            title: newResourceTitle || newResourceUrl,
            provider: "url",
          },
        }),
      });
      setNewResourceUrl("");
      setNewResourceTitle("");
      await fetchData();
    } catch {
      // Handle error
    }
  };

  const handleDeleteResource = async (resourceId: number) => {
    if (!currentVersion) return;
    try {
      await apiFetch(`/api/v1/lesson_versions/${currentVersion.id}/resource_links/${resourceId}`, {
        method: "DELETE",
      });
      setResources(resources.filter((r) => r.id !== resourceId));
    } catch {
      // Handle error
    }
  };

  const handleAiApply = (content: string, target = "all") => {
    setAiApplyError(null);
    setAiApplyMessage(null);

    const parsed = parseLessonOutput(content);
    const selected = target || "all";
    const draft: LessonPlanOutput = {};

    if ((selected === "all" || selected === "objectives") && parsed.objectives) {
      draft.objectives = parsed.objectives;
    }
    if ((selected === "all" || selected === "activities") && parsed.activities) {
      draft.activities = parsed.activities;
    }
    if ((selected === "all" || selected === "materials") && parsed.materials) {
      draft.materials = parsed.materials;
    }
    if (
      (selected === "all" || selected === "duration_minutes") &&
      parsed.duration_minutes !== undefined
    ) {
      draft.duration_minutes = parsed.duration_minutes;
    }

    if (Object.keys(draft).length === 0) {
      setAiApplyError("AI output did not include recognized lesson planning fields.");
      return;
    }

    const changes: AiApplyChange[] = [];

    if (draft.objectives !== undefined && draft.objectives !== objectives) {
      changes.push({
        field: "Objectives",
        previous: objectives,
        next: draft.objectives,
      });
    }
    if (draft.activities !== undefined && draft.activities !== activities) {
      changes.push({
        field: "Activities",
        previous: activities,
        next: draft.activities,
      });
    }
    if (draft.materials !== undefined && draft.materials !== materials) {
      changes.push({
        field: "Materials",
        previous: materials,
        next: draft.materials,
      });
    }
    if (
      draft.duration_minutes !== undefined &&
      String(draft.duration_minutes) !== (durationMinutes || "")
    ) {
      changes.push({
        field: "Duration (minutes)",
        previous: durationMinutes,
        next: String(draft.duration_minutes),
      });
    }

    if (changes.length === 0) {
      setAiApplyMessage("AI output matches current lesson content. No changes to apply.");
      return;
    }

    setPendingAiDraft(draft);
    setPendingAiChanges(changes);
    setShowAiApplyModal(true);
  };

  const confirmAiApply = async () => {
    if (!pendingAiDraft) return;

    setApplyingAi(true);
    setAiApplyError(null);

    const nextObjectives = pendingAiDraft.objectives ?? objectives;
    const nextActivities = pendingAiDraft.activities ?? activities;
    const nextMaterials = pendingAiDraft.materials ?? materials;
    const nextDuration =
      pendingAiDraft.duration_minutes !== undefined
        ? pendingAiDraft.duration_minutes
        : durationMinutes
          ? Number.parseInt(durationMinutes, 10)
          : null;

    try {
      await apiFetch(`/api/v1/unit_plans/${unitId}/lesson_plans/${lessonId}/create_version`, {
        method: "POST",
        body: JSON.stringify({
          version: {
            title,
            objectives: nextObjectives,
            activities: nextActivities,
            materials: nextMaterials,
            duration_minutes: nextDuration,
          },
        }),
      });

      try {
        const invocations = await apiFetch<{ id: number }[]>(
          `/api/v1/ai_invocations?task_type=${encodeURIComponent(aiTaskType)}&status=completed`,
        );
        if (invocations.length > 0) {
          await apiFetch(`/api/v1/ai_invocations/${invocations[0].id}`, {
            method: "PATCH",
            body: JSON.stringify({
              applied_at: new Date().toISOString(),
              applied_to: { type: "lesson_plan", id: Number(lessonId) },
            }),
          });
        }
      } catch {
        // Best-effort invocation audit trail.
      }

      await fetchData();
      setAiApplyMessage("AI draft applied and saved as a new lesson version.");
      setShowAiApplyModal(false);
      setPendingAiDraft(null);
      setPendingAiChanges([]);
    } catch {
      setAiApplyError("Failed to apply AI draft to this lesson.");
    } finally {
      setApplyingAi(false);
    }
  };

  const handleExportPdf = async () => {
    setExporting(true);
    setExportError(null);
    setExportMessage(null);

    try {
      await apiFetch(`/api/v1/unit_plans/${unitId}/lesson_plans/${lessonId}/export_pdf`, {
        method: "POST",
      });
      setExportMessage("Generating lesson PDF...");

      setTimeout(async () => {
        try {
          const status = await apiFetch<{ status: string; download_url?: string }>(
            `/api/v1/unit_plans/${unitId}/lesson_plans/${lessonId}/export_pdf_status`,
          );

          if (status.status === "completed" && status.download_url) {
            setExportMessage("PDF is ready. Opening download...");
            window.open(status.download_url, "_blank", "noopener,noreferrer");
          } else {
            setExportMessage("PDF is still processing. Please export again shortly.");
          }
        } catch {
          setExportError("Unable to check lesson PDF export status.");
        }
      }, 1500);
    } catch {
      setExportError("Failed to start lesson PDF export.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <ListSkeleton />
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (!lesson) {
    return (
      <ProtectedRoute>
        <AppShell>
          <p className="text-gray-500">Lesson not found.</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  const isEditable = lesson.status === "draft";

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href={`/plan/units/${unitId}`}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                &larr; Back to Unit
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Lesson Editor</h1>
              {currentVersion && (
                <span className="text-sm text-gray-400">v{currentVersion.version_number}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPdf}
                disabled={exporting}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {exporting ? "Exporting..." : "Export PDF"}
              </button>
              <button
                onClick={() => setShowAiPanel((prev) => !prev)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {showAiPanel ? "Hide AI Assistant" : "AI Assistant"}
              </button>
              {isEditable && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save New Version"}
                </button>
              )}
            </div>
          </div>

          {aiApplyError && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{aiApplyError}</div>
          )}
          {aiApplyMessage && (
            <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">{aiApplyMessage}</div>
          )}

          {exportError && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{exportError}</div>
          )}
          {exportMessage && (
            <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">{exportMessage}</div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!isEditable}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
            />
          </div>

          {/* Objectives */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Objectives</label>
            <textarea
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              disabled={!isEditable}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
            />
          </div>

          {/* Activities */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Activities</label>
            <textarea
              value={activities}
              onChange={(e) => setActivities(e.target.value)}
              disabled={!isEditable}
              rows={6}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
            />
          </div>

          {/* Materials */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Materials</label>
            <textarea
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              disabled={!isEditable}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              disabled={!isEditable}
              min="0"
              className="mt-1 block w-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
            />
          </div>

          {/* Resource Links */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Resource Links</label>
            {resources.length > 0 && (
              <ul className="mt-2 space-y-2">
                {resources.map((resource) => (
                  <li
                    key={resource.id}
                    className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2"
                  >
                    <div>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {resource.title}
                      </a>
                      <span className="ml-2 text-xs text-gray-400">{resource.provider}</span>
                    </div>
                    {isEditable && (
                      <button
                        onClick={() => handleDeleteResource(resource.id)}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {isEditable && currentVersion && (
              <div className="mt-3 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Resource title"
                    value={newResourceTitle}
                    onChange={(e) => setNewResourceTitle(e.target.value)}
                    className="block w-40 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="url"
                    placeholder="URL (e.g., https://drive.google.com/...)"
                    value={newResourceUrl}
                    onChange={(e) => setNewResourceUrl(e.target.value)}
                    className="block flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddResource}
                    disabled={!newResourceUrl.trim()}
                    className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
                {user?.google_connected && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        try {
                          const result = await apiFetch<{ id: string; title: string; url: string }>(
                            "/api/v1/drive/documents",
                            {
                              method: "POST",
                              body: JSON.stringify({
                                title: title || "Untitled Document",
                                linkable_type: "LessonVersion",
                                linkable_id: currentVersion.id,
                              }),
                            },
                          );
                          window.open(result.url, "_blank");
                          await fetchData();
                        } catch {
                          // Handle error
                        }
                      }}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      New Google Doc
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const result = await apiFetch<{ id: string; title: string; url: string }>(
                            "/api/v1/drive/presentations",
                            {
                              method: "POST",
                              body: JSON.stringify({
                                title: title || "Untitled Presentation",
                                linkable_type: "LessonVersion",
                                linkable_id: currentVersion.id,
                              }),
                            },
                          );
                          window.open(result.url, "_blank");
                          await fetchData();
                        } catch {
                          // Handle error
                        }
                      }}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      New Google Slides
                    </button>
                    <GoogleDrivePicker
                      onSelect={async (file) => {
                        try {
                          await apiFetch(
                            `/api/v1/lesson_versions/${currentVersion.id}/resource_links`,
                            {
                              method: "POST",
                              body: JSON.stringify({
                                resource_link: {
                                  url: file.url,
                                  title: file.name,
                                  provider: "google_drive",
                                  drive_file_id: file.id,
                                },
                              }),
                            },
                          );
                          await fetchData();
                        } catch {
                          // Handle error
                        }
                      }}
                    >
                      <span className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                        Attach from Drive
                      </span>
                    </GoogleDrivePicker>
                  </div>
                )}
              </div>
            )}
          </div>

          {showAiPanel && (
            <AiAssistantPanel
              lessonId={Number(lessonId)}
              onTaskTypeChange={setAiTaskType}
              onApply={handleAiApply}
              applyTargets={[
                { value: "all", label: "Apply All" },
                { value: "objectives", label: "Apply Objectives Only" },
                { value: "activities", label: "Apply Activities Only" },
                { value: "materials", label: "Apply Materials Only" },
                { value: "duration_minutes", label: "Apply Duration Only" },
              ]}
            />
          )}
        </div>
        <AiApplyModal
          open={showAiApplyModal}
          title="Apply AI Changes to Lesson"
          changes={pendingAiChanges}
          applying={applyingAi}
          onCancel={() => {
            if (applyingAi) return;
            setShowAiApplyModal(false);
            setPendingAiDraft(null);
            setPendingAiChanges([]);
          }}
          onConfirm={() => {
            void confirmAiApply();
          }}
        />
      </AppShell>
    </ProtectedRoute>
  );
}
