"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import AiAssistantPanel from "@/components/AiAssistantPanel";
import { StatusBadge } from "@/components/StatusBadge";

interface UnitPlan {
  id: number;
  title: string;
  status: string;
  course_id: number;
  current_version_id: number | null;
}

interface UnitVersion {
  id: number;
  version_number: number;
  title: string;
  description: string | null;
  essential_questions: string[];
  enduring_understandings: string[];
  created_at: string;
}

interface LessonPlan {
  id: number;
  title: string;
  position: number;
  status: string;
}

interface Standard {
  id: number;
  code: string;
  description: string;
}

export default function UnitPlannerPage() {
  const params = useParams();
  const unitId = params.id as string;

  const [unitPlan, setUnitPlan] = useState<UnitPlan | null>(null);
  const [versions, setVersions] = useState<UnitVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<UnitVersion | null>(null);
  const [lessons, setLessons] = useState<LessonPlan[]>([]);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [allStandards, setAllStandards] = useState<Standard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [essentialQuestions, setEssentialQuestions] = useState<string[]>([""]);
  const [enduringUnderstandings, setEnduringUnderstandings] = useState<string[]>([""]);
  const [standardSearch, setStandardSearch] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [unit, vers, lessonList] = await Promise.all([
        apiFetch<UnitPlan>(`/api/v1/unit_plans/${unitId}`),
        apiFetch<UnitVersion[]>(`/api/v1/unit_plans/${unitId}/versions`),
        apiFetch<LessonPlan[]>(`/api/v1/unit_plans/${unitId}/lesson_plans`),
      ]);

      setUnitPlan(unit);
      setVersions(vers);
      setLessons(lessonList.sort((a, b) => a.position - b.position));

      if (vers.length > 0) {
        const cv = vers[0]; // sorted desc by version_number
        setCurrentVersion(cv);
        setTitle(cv.title);
        setDescription(cv.description || "");
        setEssentialQuestions(cv.essential_questions.length > 0 ? cv.essential_questions : [""]);
        setEnduringUnderstandings(
          cv.enduring_understandings.length > 0 ? cv.enduring_understandings : [""],
        );
      } else {
        setTitle(unit.title);
      }

      // Fetch all standards for search
      const stdList = await apiFetch<Standard[]>("/api/v1/standards");
      setAllStandards(stdList);

      // Fetch aligned standards from current version
      if (vers.length > 0) {
        try {
          const aligned = await apiFetch<Standard[]>(
            `/api/v1/unit_versions/${vers[0].id}/standards`,
          );
          setStandards(aligned);
        } catch {
          // May not have standards yet
        }
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, [unitId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/v1/unit_plans/${unitId}/create_version`, {
        method: "POST",
        body: JSON.stringify({
          version: {
            title,
            description,
            essential_questions: essentialQuestions.filter((q) => q.trim()),
            enduring_understandings: enduringUnderstandings.filter((u) => u.trim()),
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

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await apiFetch(`/api/v1/unit_plans/${unitId}/publish`, {
        method: "POST",
      });
      await fetchData();
    } catch {
      // Handle error
    } finally {
      setPublishing(false);
    }
  };

  const addListItem = (
    list: string[],
    setList: (items: string[]) => void,
  ) => {
    setList([...list, ""]);
  };

  const updateListItem = (
    list: string[],
    setList: (items: string[]) => void,
    index: number,
    value: string,
  ) => {
    const updated = [...list];
    updated[index] = value;
    setList(updated);
  };

  const removeListItem = (
    list: string[],
    setList: (items: string[]) => void,
    index: number,
  ) => {
    if (list.length <= 1) return;
    setList(list.filter((_, i) => i !== index));
  };

  const filteredStandards = allStandards.filter(
    (s) =>
      standardSearch &&
      (s.code.toLowerCase().includes(standardSearch.toLowerCase()) ||
        s.description.toLowerCase().includes(standardSearch.toLowerCase())),
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <p className="text-gray-500">Loading...</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (!unitPlan) {
    return (
      <ProtectedRoute>
        <AppShell>
          <p className="text-gray-500">Unit plan not found.</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  const isEditable = unitPlan.status === "draft";

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="min-w-0 flex-1 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/plan/units" className="text-sm text-gray-400 hover:text-gray-600">
                  &larr; Back
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Unit Planner</h1>
                <StatusBadge status={unitPlan.status} />
                {currentVersion && (
                  <span className="text-sm text-gray-400">v{currentVersion.version_number}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAiPanelOpen(true)}
                  className="rounded-md border border-purple-300 bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100"
                >
                  AI Assist
                </button>
                {isEditable && (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save New Version"}
                    </button>
                    <button
                      onClick={handlePublish}
                      disabled={publishing || !currentVersion}
                      className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {publishing ? "Publishing..." : "Publish"}
                    </button>
                  </>
                )}
              </div>
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

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!isEditable}
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>

            {/* Essential Questions */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Essential Questions</label>
              <div className="mt-1 space-y-2">
                {essentialQuestions.map((q, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={q}
                      onChange={(e) =>
                        updateListItem(
                          essentialQuestions,
                          setEssentialQuestions,
                          i,
                          e.target.value,
                        )
                      }
                      disabled={!isEditable}
                      placeholder={`Question ${i + 1}`}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
                    />
                    {isEditable && essentialQuestions.length > 1 && (
                      <button
                        onClick={() =>
                          removeListItem(essentialQuestions, setEssentialQuestions, i)
                        }
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                {isEditable && (
                  <button
                    onClick={() => addListItem(essentialQuestions, setEssentialQuestions)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add Question
                  </button>
                )}
              </div>
            </div>

            {/* Enduring Understandings */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Enduring Understandings
              </label>
              <div className="mt-1 space-y-2">
                {enduringUnderstandings.map((u, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={u}
                      onChange={(e) =>
                        updateListItem(
                          enduringUnderstandings,
                          setEnduringUnderstandings,
                          i,
                          e.target.value,
                        )
                      }
                      disabled={!isEditable}
                      placeholder={`Understanding ${i + 1}`}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
                    />
                    {isEditable && enduringUnderstandings.length > 1 && (
                      <button
                        onClick={() =>
                          removeListItem(enduringUnderstandings, setEnduringUnderstandings, i)
                        }
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                {isEditable && (
                  <button
                    onClick={() =>
                      addListItem(enduringUnderstandings, setEnduringUnderstandings)
                    }
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add Understanding
                  </button>
                )}
              </div>
            </div>

            {/* Standards Alignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Standards Alignment
              </label>
              <input
                type="text"
                placeholder="Search standards by code or description..."
                value={standardSearch}
                onChange={(e) => setStandardSearch(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {filteredStandards.length > 0 && (
                <ul className="mt-2 max-h-40 overflow-auto rounded-md border border-gray-200 bg-white">
                  {filteredStandards.slice(0, 10).map((std) => (
                    <li
                      key={std.id}
                      className="cursor-pointer border-b border-gray-100 px-3 py-2 text-sm hover:bg-blue-50 last:border-0"
                      onClick={async () => {
                        if (!standards.find((s) => s.id === std.id)) {
                          if (currentVersion) {
                            try {
                              await apiFetch(
                                `/api/v1/unit_versions/${currentVersion.id}/standards`,
                                {
                                  method: "POST",
                                  body: JSON.stringify({ standard_ids: [std.id] }),
                                },
                              );
                            } catch {
                              // May already be attached
                            }
                          }
                          setStandards([...standards, std]);
                        }
                        setStandardSearch("");
                      }}
                    >
                      <span className="font-medium">{std.code}</span>: {std.description}
                    </li>
                  ))}
                </ul>
              )}
              {standards.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {standards.map((std) => (
                    <span
                      key={std.id}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
                    >
                      {std.code}
                      <button
                        onClick={async () => {
                          if (currentVersion) {
                            try {
                              await apiFetch(
                                `/api/v1/unit_versions/${currentVersion.id}/standards/bulk_destroy`,
                                {
                                  method: "DELETE",
                                  body: JSON.stringify({ standard_ids: [std.id] }),
                                },
                              );
                            } catch {
                              // Handle error
                            }
                          }
                          setStandards(standards.filter((s) => s.id !== std.id));
                        }}
                        className="ml-1 text-blue-600 hover:text-blue-900"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Lessons */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Lessons</label>
                {isEditable && (
                  <Link
                    href={`/plan/units/${unitId}/lessons/new`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add Lesson
                  </Link>
                )}
              </div>
              {lessons.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
                  <p className="text-sm text-gray-500">No lessons yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lessons.map((lesson, index) => (
                    <Link
                      key={lesson.id}
                      href={`/plan/units/${unitId}/lessons/${lesson.id}`}
                      className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{lesson.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Context Panel — UX §3.2 */}
          <div className="hidden w-72 flex-shrink-0 lg:block">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-gray-900">Version History</h3>
              <div className="mt-3 space-y-2">
                {versions.map((v) => (
                  <div
                    key={v.id}
                    className={`rounded-md px-3 py-2 text-sm ${
                      currentVersion?.id === v.id
                        ? "bg-blue-50 font-medium text-blue-700"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    v{v.version_number}: {v.title}
                  </div>
                ))}
                {versions.length === 0 && (
                  <p className="text-sm text-gray-400">No versions yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <AiAssistantPanel
          open={aiPanelOpen}
          onClose={() => setAiPanelOpen(false)}
          defaultTab="unit_generation"
          context={{ subject: title, topic: title }}
          onResultApply={(taskType, result) => {
            if (taskType === "unit_generation") {
              if (result.title && typeof result.title === "string") setTitle(result.title);
              if (result.description && typeof result.description === "string") setDescription(result.description);
              if (Array.isArray(result.essential_questions)) setEssentialQuestions(result.essential_questions as string[]);
              if (Array.isArray(result.enduring_understandings)) setEnduringUnderstandings(result.enduring_understandings as string[]);
            }
          }}
        />
      </AppShell>
    </ProtectedRoute>
  );
}
