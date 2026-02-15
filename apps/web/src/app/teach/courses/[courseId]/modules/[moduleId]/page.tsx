"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch } from "@/lib/api";

interface CourseModule {
  id: number;
  title: string;
  description: string | null;
  status: string;
}

interface ModuleItem {
  id: number;
  title: string;
  item_type: string;
  itemable_type: string | null;
  itemable_id: number | null;
  position: number;
}

interface Assignment {
  id: number;
  title: string;
  status: string;
}

interface Quiz {
  id: number;
  title: string;
  status: string;
}

interface Discussion {
  id: number;
  title: string;
  status: string;
}

const TEACHER_ROLES = ["admin", "curriculum_lead", "teacher"];

const ITEM_TYPE_OPTIONS = [
  { value: "assignment", label: "Assignment" },
  { value: "quiz", label: "Quiz" },
  { value: "discussion", label: "Discussion" },
  { value: "resource_link", label: "Resource Link" },
  { value: "text_header", label: "Text Header" },
];

const TYPE_ICONS: Record<string, string> = {
  assignment: "A",
  quiz: "Q",
  discussion: "D",
  resource_link: "L",
  resource: "L",
  text_header: "T",
  url: "U",
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-800",
    published: "bg-green-100 text-green-800",
    archived: "bg-gray-100 text-gray-700",
    open: "bg-green-100 text-green-800",
    locked: "bg-amber-100 text-amber-800",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
}

export default function ModuleEditorPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = String(params.courseId);
  const moduleId = String(params.moduleId);

  const [moduleData, setModuleData] = useState<CourseModule | null>(null);
  const [items, setItems] = useState<ModuleItem[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingModule, setSavingModule] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemType, setNewItemType] = useState("assignment");
  const [newItemTitle, setNewItemTitle] = useState("");
  const [addingItem, setAddingItem] = useState(false);

  const [showAddExisting, setShowAddExisting] = useState(false);
  const [existingType, setExistingType] = useState<"assignment" | "quiz">("assignment");
  const [existingSearch, setExistingSearch] = useState("");
  const [addingExisting, setAddingExisting] = useState(false);

  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);

  const assignmentMap = useMemo(
    () =>
      assignments.reduce<Record<number, Assignment>>((accumulator, assignment) => {
        accumulator[assignment.id] = assignment;
        return accumulator;
      }, {}),
    [assignments],
  );

  const quizMap = useMemo(
    () =>
      quizzes.reduce<Record<number, Quiz>>((accumulator, quiz) => {
        accumulator[quiz.id] = quiz;
        return accumulator;
      }, {}),
    [quizzes],
  );

  const discussionMap = useMemo(
    () =>
      discussions.reduce<Record<number, Discussion>>((accumulator, discussion) => {
        accumulator[discussion.id] = discussion;
        return accumulator;
      }, {}),
    [discussions],
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [moduleResponse, itemResponse, assignmentResponse, quizResponse, discussionResponse] =
        await Promise.all([
          apiFetch<CourseModule>(`/api/v1/modules/${moduleId}`),
          apiFetch<ModuleItem[]>(`/api/v1/modules/${moduleId}/module_items`),
          apiFetch<Assignment[]>(`/api/v1/courses/${courseId}/assignments`),
          apiFetch<Quiz[]>(`/api/v1/courses/${courseId}/quizzes`),
          apiFetch<Discussion[]>(`/api/v1/courses/${courseId}/discussions`),
        ]);

      setModuleData(moduleResponse);
      setTitle(moduleResponse.title);
      setDescription(moduleResponse.description || "");
      setItems(itemResponse.sort((a, b) => a.position - b.position));
      setAssignments(assignmentResponse);
      setQuizzes(quizResponse);
      setDiscussions(discussionResponse);
    } catch {
      setError("Unable to load module editor data.");
    } finally {
      setLoading(false);
    }
  }, [courseId, moduleId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  async function saveModuleHeader() {
    setSavingModule(true);
    setError(null);

    try {
      const updated = await apiFetch<CourseModule>(`/api/v1/modules/${moduleId}`, {
        method: "PATCH",
        body: JSON.stringify({ title, description }),
      });
      setModuleData(updated);
    } catch {
      setError("Unable to save module changes.");
    } finally {
      setSavingModule(false);
    }
  }

  async function publishModule() {
    setPublishing(true);
    setError(null);

    try {
      const updated = await apiFetch<CourseModule>(`/api/v1/modules/${moduleId}/publish`, {
        method: "POST",
      });
      setModuleData(updated);
      await fetchData();
    } catch {
      setError("Unable to publish module.");
    } finally {
      setPublishing(false);
    }
  }

  async function persistOrder(nextItems: ModuleItem[]) {
    setItems(nextItems);
    try {
      await apiFetch(`/api/v1/course_modules/${moduleId}/reorder`, {
        method: "PATCH",
        body: JSON.stringify({ item_ids: nextItems.map((item) => item.id) }),
      });
    } catch {
      setError("Unable to reorder module items.");
      void fetchData();
    }
  }

  async function removeItem(itemId: number) {
    try {
      await apiFetch(`/api/v1/module_items/${itemId}`, { method: "DELETE" });
      setItems((previous) => previous.filter((item) => item.id !== itemId));
    } catch {
      setError("Unable to remove item.");
    }
  }

  async function addItem() {
    if (!newItemTitle.trim()) return;

    setAddingItem(true);
    setError(null);

    try {
      const created = await apiFetch<ModuleItem>(`/api/v1/modules/${moduleId}/module_items`, {
        method: "POST",
        body: JSON.stringify({
          title: newItemTitle.trim(),
          item_type: newItemType,
        }),
      });
      setItems((previous) => [...previous, created].sort((a, b) => a.position - b.position));
      setNewItemTitle("");
      setShowAddItem(false);
    } catch {
      setError("Unable to add item.");
    } finally {
      setAddingItem(false);
    }
  }

  async function addExisting(itemId: number, itemTitle: string) {
    setAddingExisting(true);
    setError(null);

    try {
      const created = await apiFetch<ModuleItem>(`/api/v1/modules/${moduleId}/module_items`, {
        method: "POST",
        body: JSON.stringify({
          title: itemTitle,
          item_type: existingType,
          itemable_type: existingType === "assignment" ? "Assignment" : "Quiz",
          itemable_id: itemId,
        }),
      });
      setItems((previous) => [...previous, created].sort((a, b) => a.position - b.position));
      setShowAddExisting(false);
      setExistingSearch("");
    } catch {
      setError("Unable to link existing item.");
    } finally {
      setAddingExisting(false);
    }
  }

  function itemStatus(item: ModuleItem): string {
    if (item.itemable_type === "Assignment" && item.itemable_id) {
      return assignmentMap[item.itemable_id]?.status || "draft";
    }

    if (item.itemable_type === "Quiz" && item.itemable_id) {
      return quizMap[item.itemable_id]?.status || "draft";
    }

    if (item.itemable_type === "Discussion" && item.itemable_id) {
      return discussionMap[item.itemable_id]?.status || "open";
    }

    return "ready";
  }

  function navigateToItem(item: ModuleItem) {
    if (item.itemable_type === "Assignment" && item.itemable_id) {
      router.push(`/teach/courses/${courseId}/assignments/${item.itemable_id}`);
      return;
    }

    if (item.itemable_type === "Quiz" && item.itemable_id) {
      router.push(`/assess/quizzes/${item.itemable_id}`);
      return;
    }

    if (item.itemable_type === "Discussion" && item.itemable_id) {
      router.push(`/teach/courses/${courseId}/discussions/${item.itemable_id}`);
    }
  }

  async function editItem(item: ModuleItem) {
    if (item.itemable_id) {
      navigateToItem(item);
      return;
    }

    const nextTitle = window.prompt("Edit item title", item.title);
    if (!nextTitle || nextTitle.trim() === item.title) return;

    try {
      const updated = await apiFetch<ModuleItem>(`/api/v1/module_items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: nextTitle.trim() }),
      });
      setItems((previous) =>
        previous.map((existing) => (existing.id === item.id ? updated : existing)),
      );
    } catch {
      setError("Unable to update item title.");
    }
  }

  function handleDrop(targetItemId: number) {
    if (!draggedItemId || draggedItemId === targetItemId) return;

    const fromIndex = items.findIndex((item) => item.id === draggedItemId);
    const toIndex = items.findIndex((item) => item.id === targetItemId);
    if (fromIndex < 0 || toIndex < 0) return;

    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);

    void persistOrder(next);
    setDraggedItemId(null);
  }

  const existingSearchResults = useMemo(() => {
    const needle = existingSearch.trim().toLowerCase();
    const source = existingType === "assignment" ? assignments : quizzes;

    if (!needle) return source.slice(0, 8);

    return source.filter((entry) => entry.title.toLowerCase().includes(needle)).slice(0, 8);
  }, [assignments, quizzes, existingSearch, existingType]);

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={TEACHER_ROLES}>
        <AppShell>
          <p className="text-sm text-gray-500">Loading module...</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (!moduleData) {
    return (
      <ProtectedRoute requiredRoles={TEACHER_ROLES}>
        <AppShell>
          <p className="text-sm text-gray-500">Module not found.</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={TEACHER_ROLES}>
      <AppShell>
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link
                href={`/teach/courses/${courseId}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                &larr; Back to Course
              </Link>
              <div className="mt-1 flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">Module Editor</h1>
                <StatusBadge status={moduleData.status} />
              </div>
            </div>
            <button
              onClick={publishModule}
              disabled={publishing || moduleData.status !== "draft"}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {publishing ? "Publishing..." : "Publish Module"}
            </button>
          </div>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={saveModuleHeader}
              disabled={savingModule}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {savingModule ? "Saving..." : "Save Module"}
            </button>
          </section>

          <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Module Items</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddExisting((previous) => !previous)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Add Existing
                </button>
                <button
                  onClick={() => setShowAddItem((previous) => !previous)}
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Add Item
                </button>
              </div>
            </div>

            {showAddItem && (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
                <div className="grid gap-3 sm:grid-cols-[180px_1fr_auto]">
                  <select
                    value={newItemType}
                    onChange={(event) => setNewItemType(event.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    {ITEM_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    value={newItemTitle}
                    onChange={(event) => setNewItemTitle(event.target.value)}
                    placeholder="Item title"
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <button
                    onClick={addItem}
                    disabled={addingItem || !newItemTitle.trim()}
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {addingItem ? "Adding..." : "Add"}
                  </button>
                </div>
              </div>
            )}

            {showAddExisting && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={existingType}
                    onChange={(event) =>
                      setExistingType(event.target.value as "assignment" | "quiz")
                    }
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="assignment">Assignment</option>
                    <option value="quiz">Quiz</option>
                  </select>
                  <input
                    value={existingSearch}
                    onChange={(event) => setExistingSearch(event.target.value)}
                    placeholder="Search by title"
                    className="min-w-60 rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  {existingSearchResults.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => addExisting(entry.id, entry.title)}
                      disabled={addingExisting}
                      className="block w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {entry.title}
                    </button>
                  ))}
                  {existingSearchResults.length === 0 && (
                    <p className="text-sm text-gray-500">No matching items.</p>
                  )}
                </div>
              </div>
            )}

            {items.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                No items in this module.
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => setDraggedItemId(item.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDrop(item.id)}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-gray-200 px-3 py-3 hover:bg-gray-50"
                  >
                    <button
                      type="button"
                      onClick={() => navigateToItem(item)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span className="cursor-grab rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-xs text-gray-500">
                        ::
                      </span>
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-xs font-semibold text-gray-700">
                        {TYPE_ICONS[item.item_type] || "?"}
                      </span>
                      <span className="truncate text-sm font-medium text-gray-900">
                        {item.title}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {item.item_type.replace("_", " ")}
                      </span>
                    </button>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={itemStatus(item)} />
                      <button
                        onClick={() => editItem(item)}
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
