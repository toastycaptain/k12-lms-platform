"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { QuizSkeleton } from "@/components/skeletons/QuizSkeleton";

interface Template {
  id: number;
  name: string;
  subject: string | null;
  grade_level: string | null;
  description: string | null;
  status: string;
  current_version_id: number | null;
}

interface TemplateVersion {
  id: number;
  version_number: number;
  title: string;
  description: string | null;
  essential_questions: string[];
  enduring_understandings: string[];
  suggested_duration_weeks: number | null;
  created_at: string;
}

interface Standard {
  id: number;
  code: string;
  description: string;
}

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

export default function TemplateEditorPage() {
  const params = useParams();
  const templateId = params.id as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<TemplateVersion | null>(null);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [allStandards, setAllStandards] = useState<Standard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [archiving, setArchiving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [description, setDescription] = useState("");
  const [essentialQuestions, setEssentialQuestions] = useState<string[]>([""]);
  const [enduringUnderstandings, setEnduringUnderstandings] = useState<string[]>([""]);
  const [suggestedDurationWeeks, setSuggestedDurationWeeks] = useState("");
  const [standardSearch, setStandardSearch] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [tmpl, vers, stdList] = await Promise.all([
        apiFetch<Template>(`/api/v1/templates/${templateId}`),
        apiFetch<TemplateVersion[]>(`/api/v1/templates/${templateId}/versions`),
        apiFetch<Standard[]>("/api/v1/standards"),
      ]);

      setTemplate(tmpl);
      setVersions(vers);
      setAllStandards(stdList);
      setName(tmpl.name);
      setSubject(tmpl.subject || "");
      setGradeLevel(tmpl.grade_level || "");
      setDescription(tmpl.description || "");

      if (vers.length > 0) {
        const cv = vers[0];
        setCurrentVersion(cv);
        setEssentialQuestions(cv.essential_questions.length > 0 ? cv.essential_questions : [""]);
        setEnduringUnderstandings(
          cv.enduring_understandings.length > 0 ? cv.enduring_understandings : [""],
        );
        setSuggestedDurationWeeks(
          cv.suggested_duration_weeks ? String(cv.suggested_duration_weeks) : "",
        );

        // Fetch aligned standards
        try {
          const aligned = await apiFetch<Standard[]>(
            `/api/v1/template_versions/${cv.id}/standards`,
          );
          setStandards(aligned);
        } catch {
          // May not have standards
        }
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update template metadata
      await apiFetch(`/api/v1/templates/${templateId}`, {
        method: "PATCH",
        body: JSON.stringify({
          template: {
            name,
            subject: subject || null,
            grade_level: gradeLevel || null,
            description: description || null,
          },
        }),
      });

      // Create new version
      const newVersion = await apiFetch<TemplateVersion>(
        `/api/v1/templates/${templateId}/create_version`,
        {
          method: "POST",
          body: JSON.stringify({
            version: {
              title: name,
              description,
              essential_questions: essentialQuestions.filter((q) => q.trim()),
              enduring_understandings: enduringUnderstandings.filter((u) => u.trim()),
              suggested_duration_weeks: suggestedDurationWeeks
                ? parseInt(suggestedDurationWeeks)
                : null,
            },
          }),
        },
      );

      // Sync standards alignment on the new version
      for (const std of standards) {
        try {
          await apiFetch(`/api/v1/template_versions/${newVersion.id}/standards`, {
            method: "POST",
            body: JSON.stringify({ standard_id: std.id }),
          });
        } catch {
          // May already be attached
        }
      }

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
      await apiFetch(`/api/v1/templates/${templateId}/publish`, { method: "POST" });
      await fetchData();
    } catch {
      // Handle error
    } finally {
      setPublishing(false);
    }
  };

  const handleArchive = async () => {
    setArchiving(true);
    try {
      await apiFetch(`/api/v1/templates/${templateId}/archive`, { method: "POST" });
      await fetchData();
    } catch {
      // Handle error
    } finally {
      setArchiving(false);
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
          <QuizSkeleton />
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (!template) {
    return (
      <ProtectedRoute>
        <AppShell>
          <p className="text-gray-500">Template not found.</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  const isEditable = template.status === "draft";

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="min-w-0 flex-1 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/plan/templates" className="text-sm text-gray-400 hover:text-gray-600">
                  &larr; Back
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Template Editor</h1>
                <StatusBadge status={template.status} />
                {currentVersion && (
                  <span className="text-sm text-gray-400">v{currentVersion.version_number}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
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
                {template.status === "published" && (
                  <button
                    onClick={handleArchive}
                    disabled={archiving}
                    className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                  >
                    {archiving ? "Archiving..." : "Archive"}
                  </button>
                )}
              </div>
            </div>

            {/* Template Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Template Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isEditable}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>

            {/* Subject and Grade Level */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={!isEditable}
                  placeholder="e.g., Math, ELA, Science"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Grade Level</label>
                <input
                  type="text"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  disabled={!isEditable}
                  placeholder="e.g., K-2, 3-5, 6-8, 9-12"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>
            </div>

            {/* Suggested Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Suggested Duration (weeks)
              </label>
              <input
                type="number"
                value={suggestedDurationWeeks}
                onChange={(e) => setSuggestedDurationWeeks(e.target.value)}
                disabled={!isEditable}
                min={1}
                placeholder="e.g., 4"
                className="mt-1 block w-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
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
                        updateListItem(essentialQuestions, setEssentialQuestions, i, e.target.value)
                      }
                      disabled={!isEditable}
                      placeholder={`Question ${i + 1}`}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
                    />
                    {isEditable && essentialQuestions.length > 1 && (
                      <button
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
                    onClick={() => addListItem(enduringUnderstandings, setEnduringUnderstandings)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add Understanding
                  </button>
                )}
              </div>
            </div>

            {/* Standards Alignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Standards Alignment</label>
              {isEditable && (
                <input
                  type="text"
                  placeholder="Search standards by code or description..."
                  value={standardSearch}
                  onChange={(e) => setStandardSearch(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              )}
              {filteredStandards.length > 0 && (
                <ul className="mt-2 max-h-40 overflow-auto rounded-md border border-gray-200 bg-white">
                  {filteredStandards.slice(0, 10).map((std) => (
                    <li
                      key={std.id}
                      className="cursor-pointer border-b border-gray-100 px-3 py-2 text-sm hover:bg-blue-50 last:border-0"
                      onClick={() => {
                        if (!standards.find((s) => s.id === std.id)) {
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
                      {isEditable && (
                        <button
                          onClick={() => setStandards(standards.filter((s) => s.id !== std.id))}
                          className="ml-1 text-blue-600 hover:text-blue-900"
                        >
                          &times;
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Context Panel — Version History */}
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
      </AppShell>
    </ProtectedRoute>
  );
}
