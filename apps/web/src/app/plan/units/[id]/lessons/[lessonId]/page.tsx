"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import GoogleDrivePicker from "@/components/GoogleDrivePicker";

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

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <p className="text-gray-500">Loading...</p>
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
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
