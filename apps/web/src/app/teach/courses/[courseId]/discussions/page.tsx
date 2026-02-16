"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface Discussion {
  id: number;
  course_id: number;
  created_by_id: number;
  title: string;
  description: string | null;
  status: string;
  pinned: boolean;
  created_at: string;
  post_count?: number;
}

const TEACHER_ROLES = ["admin", "curriculum_lead", "teacher"];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: "bg-green-100 text-green-800",
    locked: "bg-yellow-200 text-yellow-900",
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

export default function DiscussionListPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const router = useRouter();
  const { user } = useAuth();

  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);

  // New discussion form
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const isTeacher = user?.roles?.includes("teacher") || user?.roles?.includes("admin");

  const fetchDiscussions = useCallback(async () => {
    try {
      const data = await apiFetch<Discussion[]>(`/api/v1/courses/${courseId}/discussions`);
      // Pinned first, then by created_at desc
      const sorted = [...data].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      const withPostCounts = await Promise.all(
        sorted.map(async (discussion) => {
          try {
            const posts = await apiFetch<{ id: number }[]>(
              `/api/v1/discussions/${discussion.id}/posts`,
            );
            return { ...discussion, post_count: posts.length };
          } catch {
            return { ...discussion, post_count: 0 };
          }
        }),
      );

      setDiscussions(withPostCounts);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchDiscussions();
  }, [fetchDiscussions]);

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const created = await apiFetch<Discussion>(`/api/v1/courses/${courseId}/discussions`, {
        method: "POST",
        body: JSON.stringify({
          title: newTitle,
          description: newDescription || null,
          status: "open",
        }),
      });
      setShowForm(false);
      setNewTitle("");
      setNewDescription("");
      router.push(`/teach/courses/${courseId}/discussions/${created.id}`);
    } catch {
      // handle error
    } finally {
      setCreating(false);
    }
  }

  // Students only see open discussions
  const visibleDiscussions = isTeacher
    ? discussions
    : discussions.filter((d) => d.status === "open");

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={TEACHER_ROLES}>
        <AppShell>
          <div className="text-sm text-gray-500">Loading discussions...</div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={TEACHER_ROLES}>
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <Link
              href={`/teach/courses/${courseId}`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              &larr; Back to course
            </Link>
            <div className="mt-2 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Discussions</h1>
              {isTeacher && (
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  New Discussion
                </button>
              )}
            </div>
          </div>

          {/* New Discussion Form */}
          {showForm && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Create Discussion</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Discussion title..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description / Prompt
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="What should students discuss?"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={creating || !newTitle.trim()}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Discussion List */}
          {visibleDiscussions.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <p className="text-sm text-gray-500">No discussions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleDiscussions.map((discussion) => (
                <Link
                  key={discussion.id}
                  href={`/teach/courses/${courseId}/discussions/${discussion.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 hover:shadow-sm transition-shadow"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {discussion.pinned && (
                        <span className="text-xs font-medium text-blue-600">Pinned</span>
                      )}
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {discussion.title}
                      </span>
                    </div>
                    {discussion.description && (
                      <p className="mt-0.5 text-xs text-gray-500 truncate">
                        {discussion.description}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-gray-400">
                      Created by #{discussion.created_by_id} &middot;{" "}
                      {new Date(discussion.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {discussion.post_count || 0} posts
                    </span>
                    <StatusBadge status={discussion.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
