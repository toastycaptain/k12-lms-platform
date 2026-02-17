"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import AiAssistantPanel from "@/components/AiAssistantPanel";
import AiApplyModal, { type AiApplyChange } from "@/components/AiApplyModal";
import { parseUnitOutput, type UnitPlanOutput } from "@/lib/ai-output-parser";
import { QuizSkeleton } from "@/components/skeletons/QuizSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { FormField, TextArea, TextInput } from "@/components/forms";

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

interface StandardFramework {
  id: number;
  name: string;
}

const TEACHER_ROLES = ["admin", "curriculum_lead", "teacher"];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-yellow-200 text-yellow-900",
    published: "bg-green-100 text-green-800",
    archived: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-600"}`}
    >
      {status}
    </span>
  );
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
  const [, setFrameworks] = useState<StandardFramework[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiTaskType, setAiTaskType] = useState("lesson_plan");
  const [applyingAi, setApplyingAi] = useState(false);
  const [aiApplyError, setAiApplyError] = useState<string | null>(null);
  const [aiApplyMessage, setAiApplyMessage] = useState<string | null>(null);
  const [pendingAiDraft, setPendingAiDraft] = useState<UnitPlanOutput | null>(null);
  const [pendingAiChanges, setPendingAiChanges] = useState<AiApplyChange[]>([]);
  const [showAiApplyModal, setShowAiApplyModal] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [essentialQuestions, setEssentialQuestions] = useState<string[]>([""]);
  const [enduringUnderstandings, setEnduringUnderstandings] = useState<string[]>([""]);
  const [standardSearch, setStandardSearch] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [unit, vers, lessonList, frameworkList] = await Promise.all([
        apiFetch<UnitPlan>(`/api/v1/unit_plans/${unitId}`),
        apiFetch<UnitVersion[]>(`/api/v1/unit_plans/${unitId}/versions`),
        apiFetch<LessonPlan[]>(`/api/v1/unit_plans/${unitId}/lesson_plans`),
        apiFetch<StandardFramework[]>("/api/v1/standard_frameworks"),
      ]);

      setUnitPlan(unit);
      setVersions(vers);
      setLessons(lessonList.sort((a, b) => a.position - b.position));
      setFrameworks(frameworkList);

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

  const addListItem = (list: string[], setList: (items: string[]) => void) => {
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

  const removeListItem = (list: string[], setList: (items: string[]) => void, index: number) => {
    if (list.length <= 1) return;
    setList(list.filter((_, i) => i !== index));
  };

  const handleAiApply = (content: string, target = "all") => {
    setAiApplyError(null);
    setAiApplyMessage(null);

    const parsed = parseUnitOutput(content);
    const selected = target || "all";
    const draft: UnitPlanOutput = {};

    if ((selected === "all" || selected === "description") && parsed.description) {
      draft.description = parsed.description;
    }

    if (
      (selected === "all" || selected === "essential_questions") &&
      parsed.essential_questions &&
      parsed.essential_questions.length > 0
    ) {
      draft.essential_questions = parsed.essential_questions;
    }

    if (
      (selected === "all" || selected === "enduring_understandings") &&
      parsed.enduring_understandings &&
      parsed.enduring_understandings.length > 0
    ) {
      draft.enduring_understandings = parsed.enduring_understandings;
    }

    if (Object.keys(draft).length === 0) {
      setAiApplyError("AI output did not include recognized unit planning fields.");
      return;
    }

    const changes: AiApplyChange[] = [];

    if (draft.description !== undefined && draft.description !== description) {
      changes.push({
        field: "Description",
        previous: description,
        next: draft.description,
      });
    }

    if (draft.essential_questions) {
      const previous = essentialQuestions.filter((value) => value.trim()).join("\n");
      const next = draft.essential_questions.join("\n");
      if (previous !== next) {
        changes.push({
          field: "Essential Questions",
          previous,
          next,
        });
      }
    }

    if (draft.enduring_understandings) {
      const previous = enduringUnderstandings.filter((value) => value.trim()).join("\n");
      const next = draft.enduring_understandings.join("\n");
      if (previous !== next) {
        changes.push({
          field: "Enduring Understandings",
          previous,
          next,
        });
      }
    }

    if (changes.length === 0) {
      setAiApplyMessage("AI output matches current content. No changes to apply.");
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

    const nextDescription = pendingAiDraft.description ?? description;
    const nextEssentialQuestions =
      pendingAiDraft.essential_questions ?? essentialQuestions.filter((value) => value.trim());
    const nextEnduringUnderstandings =
      pendingAiDraft.enduring_understandings ??
      enduringUnderstandings.filter((value) => value.trim());

    try {
      await apiFetch(`/api/v1/unit_plans/${unitId}/create_version`, {
        method: "POST",
        body: JSON.stringify({
          version: {
            title,
            description: nextDescription,
            essential_questions: nextEssentialQuestions,
            enduring_understandings: nextEnduringUnderstandings,
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
              applied_to: { type: "unit_plan", id: Number(unitId) },
            }),
          });
        }
      } catch {
        // Best-effort invocation audit trail.
      }

      await fetchData();
      setAiApplyMessage("AI draft applied and saved as a new unit version.");
      setShowAiApplyModal(false);
      setPendingAiDraft(null);
      setPendingAiChanges([]);
    } catch {
      setAiApplyError("Failed to apply AI draft to this unit.");
    } finally {
      setApplyingAi(false);
    }
  };

  const filteredStandards = allStandards.filter(
    (s) =>
      standardSearch &&
      (s.code.toLowerCase().includes(standardSearch.toLowerCase()) ||
        s.description.toLowerCase().includes(standardSearch.toLowerCase())),
  );

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={TEACHER_ROLES}>
        <AppShell>
          <QuizSkeleton />
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (!unitPlan) {
    return (
      <ProtectedRoute requiredRoles={TEACHER_ROLES}>
        <AppShell>
          <p className="text-gray-500">Unit plan not found.</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  const isEditable = unitPlan.status === "draft";

  return (
    <ProtectedRoute requiredRoles={TEACHER_ROLES}>
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
                <Link
                  href={`/plan/units/${unitId}/preview`}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Preview
                </Link>
                <button
                  onClick={() => setShowAiPanel((prev) => !prev)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {showAiPanel ? "Hide AI Assistant" : "AI Assistant"}
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

            {aiApplyError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{aiApplyError}</div>
            )}
            {aiApplyMessage && (
              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
                {aiApplyMessage}
              </div>
            )}

            {/* Title */}
            <FormField label="Title" htmlFor="unit-title">
              <TextInput
                id="unit-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={!isEditable}
                className="disabled:bg-gray-50"
              />
            </FormField>

            {/* Description */}
            <FormField label="Description" htmlFor="unit-description">
              <TextArea
                id="unit-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                disabled={!isEditable}
                rows={4}
                className="disabled:bg-gray-50"
              />
            </FormField>

            {/* Essential Questions */}
            <div>
              <p className="block text-sm font-medium text-gray-700">Essential Questions</p>
              <div className="mt-1 space-y-2">
                {essentialQuestions.map((q, i) => (
                  <div key={i} className="flex gap-2">
                    <TextInput
                      id={`unit-essential-question-${i}`}
                      type="text"
                      value={q}
                      onChange={(event) =>
                        updateListItem(
                          essentialQuestions,
                          setEssentialQuestions,
                          i,
                          event.target.value,
                        )
                      }
                      disabled={!isEditable}
                      placeholder={`Question ${i + 1}`}
                      className="disabled:bg-gray-50"
                    />
                    {isEditable && essentialQuestions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeListItem(essentialQuestions, setEssentialQuestions, i)}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                {isEditable && (
                  <button
                    type="button"
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
              <p className="block text-sm font-medium text-gray-700">Enduring Understandings</p>
              <div className="mt-1 space-y-2">
                {enduringUnderstandings.map((u, i) => (
                  <div key={i} className="flex gap-2">
                    <TextInput
                      id={`unit-enduring-understanding-${i}`}
                      type="text"
                      value={u}
                      onChange={(event) =>
                        updateListItem(
                          enduringUnderstandings,
                          setEnduringUnderstandings,
                          i,
                          event.target.value,
                        )
                      }
                      disabled={!isEditable}
                      placeholder={`Understanding ${i + 1}`}
                      className="disabled:bg-gray-50"
                    />
                    {isEditable && enduringUnderstandings.length > 1 && (
                      <button
                        type="button"
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
                    type="button"
                    onClick={() => addListItem(enduringUnderstandings, setEnduringUnderstandings)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add Understanding
                  </button>
                )}
              </div>
            </div>

            {/* Standards Alignment */}
            <div className="space-y-1.5">
              <FormField label="Standards Alignment" htmlFor="standards-search">
                <TextInput
                  id="standards-search"
                  type="text"
                  placeholder="Search standards by code or description..."
                  value={standardSearch}
                  onChange={(event) => setStandardSearch(event.target.value)}
                />
              </FormField>
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
                        type="button"
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
                <EmptyState
                  title="No lessons yet"
                  description="Add lessons to build out this unit plan."
                  actionLabel="Add Lesson"
                  actionHref={`/plan/units/${unitId}/lessons/new`}
                />
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

            {showAiPanel && (
              <AiAssistantPanel
                unitId={Number(unitId)}
                onTaskTypeChange={setAiTaskType}
                onApply={handleAiApply}
                applyTargets={[
                  { value: "all", label: "Apply All" },
                  { value: "description", label: "Apply Description Only" },
                  { value: "essential_questions", label: "Apply Essential Questions Only" },
                  { value: "enduring_understandings", label: "Apply Enduring Understandings Only" },
                ]}
              />
            )}
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
                {versions.length === 0 && <p className="text-sm text-gray-400">No versions yet.</p>}
              </div>
            </div>
          </div>
        </div>
        <AiApplyModal
          open={showAiApplyModal}
          title="Apply AI Changes to Unit"
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
