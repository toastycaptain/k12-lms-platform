"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/lib/api";

interface Assignment {
  id: number;
  title: string;
  description: string;
  instructions: string;
  assignment_type: string;
  points_possible: string | null;
  due_at: string | null;
  unlock_at: string | null;
  lock_at: string | null;
  submission_types: string[];
  allow_late_submission: boolean;
  status: string;
  rubric_id: number | null;
}

interface Rubric {
  id: number;
  title: string;
  points_possible: string;
  rubric_criteria: { id: number; title: string; points: string; rubric_ratings: { description: string; points: string }[] }[];
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-800",
    published: "bg-green-100 text-green-800",
    closed: "bg-red-100 text-red-800",
    archived: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

export default function AssignmentEditorPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const assignmentId = params.assignmentId as string;
  const router = useRouter();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [assignmentType, setAssignmentType] = useState("written");
  const [pointsPossible, setPointsPossible] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [unlockAt, setUnlockAt] = useState("");
  const [lockAt, setLockAt] = useState("");
  const [allowLate, setAllowLate] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Rubric search
  const [rubricSearch, setRubricSearch] = useState("");
  const [rubricResults, setRubricResults] = useState<{ id: number; title: string }[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const data = await apiFetch<Assignment>(`/api/v1/assignments/${assignmentId}`);
      setAssignment(data);
      setTitle(data.title);
      setDescription(data.description || "");
      setInstructions(data.instructions || "");
      setAssignmentType(data.assignment_type);
      setPointsPossible(data.points_possible || "");
      setDueAt(data.due_at || "");
      setUnlockAt(data.unlock_at || "");
      setLockAt(data.lock_at || "");
      setAllowLate(data.allow_late_submission);

      if (data.rubric_id) {
        const rubricData = await apiFetch<Rubric>(`/api/v1/rubrics/${data.rubric_id}`);
        setRubric(rubricData);
      }
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await apiFetch<Assignment>(`/api/v1/assignments/${assignmentId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          description,
          instructions,
          assignment_type: assignmentType,
          points_possible: pointsPossible ? Number(pointsPossible) : null,
          due_at: dueAt || null,
          unlock_at: unlockAt || null,
          lock_at: lockAt || null,
          allow_late_submission: allowLate,
        }),
      });
      setAssignment(updated);
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    try {
      const updated = await apiFetch<Assignment>(`/api/v1/assignments/${assignmentId}/publish`, { method: "POST" });
      setAssignment(updated);
    } catch {
      // handle error
    }
  }

  async function handleClose() {
    try {
      const updated = await apiFetch<Assignment>(`/api/v1/assignments/${assignmentId}/close`, { method: "POST" });
      setAssignment(updated);
    } catch {
      // handle error
    }
  }

  async function searchRubrics() {
    if (!rubricSearch) return;
    try {
      const results = await apiFetch<{ id: number; title: string }[]>("/api/v1/rubrics");
      setRubricResults(results.filter((r) => r.title.toLowerCase().includes(rubricSearch.toLowerCase())));
    } catch {
      // handle error
    }
  }

  async function attachRubric(rubricId: number) {
    try {
      await apiFetch(`/api/v1/assignments/${assignmentId}`, {
        method: "PATCH",
        body: JSON.stringify({ rubric_id: rubricId }),
      });
      const rubricData = await apiFetch<Rubric>(`/api/v1/rubrics/${rubricId}`);
      setRubric(rubricData);
      setRubricResults([]);
      setRubricSearch("");
    } catch {
      // handle error
    }
  }

  async function detachRubric() {
    try {
      await apiFetch(`/api/v1/assignments/${assignmentId}`, {
        method: "PATCH",
        body: JSON.stringify({ rubric_id: null }),
      });
      setRubric(null);
    } catch {
      // handle error
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="text-sm text-gray-500">Loading assignment...</div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push(`/teach/courses/${courseId}`)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                &larr; Back to course
              </button>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">Edit Assignment</h1>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={assignment?.status || "draft"} />
              {assignment?.status === "draft" && (
                <button onClick={handlePublish} className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700">
                  Publish
                </button>
              )}
              {assignment?.status === "published" && (
                <button onClick={handleClose} className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700">
                  Close
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select value={assignmentType} onChange={(e) => setAssignmentType(e.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="written">Written</option>
                <option value="file_upload">File Upload</option>
                <option value="url">URL</option>
                <option value="discussion">Discussion</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Instructions</label>
              <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Points</label>
                <input type="number" value={pointsPossible} onChange={(e) => setPointsPossible(e.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Lock Date</label>
                <input type="datetime-local" value={lockAt} onChange={(e) => setLockAt(e.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={allowLate} onChange={(e) => setAllowLate(e.target.checked)} className="rounded border-gray-300" />
                <span className="text-gray-700">Allow late submission</span>
              </label>
            </div>
            <button onClick={handleSave} disabled={saving} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          {/* Rubric Section */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Rubric</h2>
            {rubric ? (
              <div className="mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{rubric.title}</span>
                  <button onClick={detachRubric} className="text-sm text-red-600 hover:text-red-800">Detach</button>
                </div>
                <table className="mt-3 w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium text-gray-700">Criterion</th>
                      <th className="pb-2 font-medium text-gray-700">Points</th>
                      <th className="pb-2 font-medium text-gray-700">Ratings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rubric.rubric_criteria?.map((c) => (
                      <tr key={c.id} className="border-b">
                        <td className="py-2 text-gray-900">{c.title}</td>
                        <td className="py-2 text-gray-500">{c.points}</td>
                        <td className="py-2 text-gray-500">
                          {c.rubric_ratings?.map((r) => `${r.description} (${r.points})`).join(", ") || "None"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={rubricSearch}
                    onChange={(e) => setRubricSearch(e.target.value)}
                    placeholder="Search rubrics by title..."
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <button onClick={searchRubrics} className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200">
                    Search
                  </button>
                </div>
                {rubricResults.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {rubricResults.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => attachRubric(r.id)}
                        className="block w-full rounded-md border border-gray-200 px-3 py-2 text-left text-sm hover:bg-blue-50"
                      >
                        {r.title}
                      </button>
                    ))}
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
