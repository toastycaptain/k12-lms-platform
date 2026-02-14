"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/lib/api";

interface ModuleItem {
  id: number;
  title: string;
  item_type: string;
  position: number;
}

interface CourseModule {
  id: number;
  title: string;
  description: string;
  status: string;
  unlock_at: string | null;
}

const TYPE_ICONS: Record<string, string> = {
  assignment: "A",
  discussion: "D",
  resource: "R",
  url: "U",
};

export default function ModuleEditorPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const moduleId = params.moduleId as string;
  const router = useRouter();

  const [mod, setMod] = useState<CourseModule | null>(null);
  const [items, setItems] = useState<ModuleItem[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [unlockAt, setUnlockAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Add item state
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemType, setNewItemType] = useState("resource");
  const [addingItem, setAddingItem] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [moduleData, itemsData] = await Promise.all([
        apiFetch<CourseModule>(`/api/v1/modules/${moduleId}`),
        apiFetch<ModuleItem[]>(`/api/v1/modules/${moduleId}/module_items`),
      ]);
      setMod(moduleData);
      setTitle(moduleData.title);
      setDescription(moduleData.description || "");
      setUnlockAt(moduleData.unlock_at || "");
      setItems(itemsData.sort((a, b) => a.position - b.position));
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await apiFetch<CourseModule>(`/api/v1/modules/${moduleId}`, {
        method: "PATCH",
        body: JSON.stringify({ title, description, unlock_at: unlockAt || null }),
      });
      setMod(updated);
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    try {
      const updated = await apiFetch<CourseModule>(`/api/v1/modules/${moduleId}/publish`, {
        method: "POST",
      });
      setMod(updated);
    } catch {
      // handle error
    }
  }

  async function handleArchive() {
    try {
      const updated = await apiFetch<CourseModule>(`/api/v1/modules/${moduleId}/archive`, {
        method: "POST",
      });
      setMod(updated);
    } catch {
      // handle error
    }
  }

  async function handleAddItem() {
    setAddingItem(true);
    try {
      await apiFetch(`/api/v1/modules/${moduleId}/module_items`, {
        method: "POST",
        body: JSON.stringify({ title: newItemTitle, item_type: newItemType }),
      });
      setNewItemTitle("");
      setShowAddItem(false);
      fetchData();
    } catch {
      // handle error
    } finally {
      setAddingItem(false);
    }
  }

  async function handleRemoveItem(itemId: number) {
    try {
      await apiFetch(`/api/v1/module_items/${itemId}`, { method: "DELETE" });
      setItems(items.filter((i) => i.id !== itemId));
    } catch {
      // handle error
    }
  }

  async function handleMoveItem(itemIndex: number, direction: "up" | "down") {
    const newItems = [...items];
    const swapIndex = direction === "up" ? itemIndex - 1 : itemIndex + 1;
    if (swapIndex < 0 || swapIndex >= newItems.length) return;
    [newItems[itemIndex], newItems[swapIndex]] = [newItems[swapIndex], newItems[itemIndex]];
    setItems(newItems);

    try {
      await apiFetch(`/api/v1/modules/${moduleId}/reorder_items`, {
        method: "POST",
        body: JSON.stringify({ item_ids: newItems.map((i) => i.id) }),
      });
    } catch {
      // handle error
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="text-sm text-gray-500">Loading module...</div>
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
              <h1 className="mt-1 text-2xl font-bold text-gray-900">Edit Module</h1>
            </div>
            <div className="flex gap-2">
              {mod?.status === "draft" && (
                <button
                  onClick={handlePublish}
                  className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                >
                  Publish
                </button>
              )}
              {mod?.status === "published" && (
                <button
                  onClick={handleArchive}
                  className="rounded-md bg-gray-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
                >
                  Archive
                </button>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Unlock Date (optional)
              </label>
              <input
                type="datetime-local"
                value={unlockAt}
                onChange={(e) => setUnlockAt(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          {/* Module Items */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Module Items</h2>
              <button
                onClick={() => setShowAddItem(true)}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Add Item
              </button>
            </div>

            {showAddItem && (
              <div className="mt-4 space-y-3 rounded-md border border-blue-200 bg-blue-50 p-4">
                <div className="flex gap-3">
                  <select
                    value={newItemType}
                    onChange={(e) => setNewItemType(e.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="assignment">Assignment</option>
                    <option value="discussion">Discussion</option>
                    <option value="resource">Resource</option>
                    <option value="url">URL</option>
                  </select>
                  <input
                    type="text"
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    placeholder="Item title"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddItem}
                    disabled={addingItem || !newItemTitle}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {addingItem ? "Adding..." : "Add"}
                  </button>
                  <button
                    onClick={() => setShowAddItem(false)}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {items.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">No items in this module</p>
            ) : (
              <div className="mt-4 space-y-2">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded bg-gray-100 text-xs font-bold text-gray-600">
                        {TYPE_ICONS[item.item_type] || "?"}
                      </span>
                      <span className="text-sm text-gray-900">{item.title}</span>
                      <span className="text-xs text-gray-400">{item.item_type}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveItem(index, "up")}
                        disabled={index === 0}
                        className="rounded p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        title="Move up"
                      >
                        &#9650;
                      </button>
                      <button
                        onClick={() => handleMoveItem(index, "down")}
                        disabled={index === items.length - 1}
                        className="rounded p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        title="Move down"
                      >
                        &#9660;
                      </button>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="rounded p-1 text-red-400 hover:text-red-600"
                        title="Remove"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
