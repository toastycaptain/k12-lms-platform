"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";

interface Discussion {
  id: number;
  title: string;
  description: string | null;
  created_by_id: number;
  status: string;
  created_at: string;
}

interface DiscussionPost {
  id: number;
  parent_post_id: number | null;
  created_by_id: number;
  content: string;
  created_at: string;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  roles: string[];
}

const TEACHER_ROLES = ["admin", "curriculum_lead", "teacher"];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: "bg-green-100 text-green-800",
    locked: "bg-amber-100 text-amber-800",
    archived: "bg-gray-100 text-gray-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
}

function nameFor(user: User | undefined, fallbackId: number): string {
  if (!user) return `User #${fallbackId}`;
  const fullName = `${user.first_name} ${user.last_name}`.trim();
  return fullName || `User #${fallbackId}`;
}

function roleFor(user: User | undefined): string {
  if (!user) return "student";
  if (user.roles.includes("teacher") || user.roles.includes("admin")) return "teacher";
  return "student";
}

interface ThreadPostProps {
  post: DiscussionPost;
  depth: number;
  childrenMap: Record<number, DiscussionPost[]>;
  usersById: Record<number, User>;
  locked: boolean;
  replyingTo: number | null;
  replyContent: string;
  setReplyingTo: (value: number | null) => void;
  setReplyContent: (value: string) => void;
  submitReply: (parentId: number) => Promise<void>;
}

function ThreadPost({
  post,
  depth,
  childrenMap,
  usersById,
  locked,
  replyingTo,
  replyContent,
  setReplyingTo,
  setReplyContent,
  submitReply,
}: ThreadPostProps) {
  const user = usersById[post.created_by_id];
  const role = roleFor(user);
  const children = childrenMap[post.id] || [];
  const marginLeft = Math.min(depth, 4) * 20;

  return (
    <div style={{ marginLeft }} className="space-y-2">
      <article className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900">
              {nameFor(user, post.created_by_id)}
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                role === "teacher" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
              }`}
            >
              {role}
            </span>
          </div>
          <p className="text-xs text-gray-400">{new Date(post.created_at).toLocaleString()}</p>
        </div>

        <p className="mt-2 text-sm leading-6 text-gray-700 whitespace-pre-wrap">{post.content}</p>

        {!locked && (
          <button
            onClick={() => {
              setReplyingTo(post.id);
              setReplyContent("");
            }}
            className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            Reply
          </button>
        )}

        {replyingTo === post.id && !locked && (
          <div className="mt-3 space-y-2">
            <textarea
              value={replyContent}
              onChange={(event) => setReplyContent(event.target.value)}
              rows={3}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Write your reply..."
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => void submitReply(post.id)}
                disabled={!replyContent.trim()}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Post Reply
              </button>
              <button
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent("");
                }}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </article>

      {children.length > 0 && (
        <div className="space-y-2">
          {children.map((child) => (
            <ThreadPost
              key={child.id}
              post={child}
              depth={depth + 1}
              childrenMap={childrenMap}
              usersById={usersById}
              locked={locked}
              replyingTo={replyingTo}
              replyContent={replyContent}
              setReplyingTo={setReplyingTo}
              setReplyContent={setReplyContent}
              submitReply={submitReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DiscussionThreadPage() {
  const params = useParams();
  const { addToast } = useToast();
  const courseId = String(params.courseId);
  const discussionId = String(params.discussionId);

  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [usersById, setUsersById] = useState<Record<number, User>>({});
  const [newPostContent, setNewPostContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [discussionResponse, postsResponse, usersResponse] = await Promise.all([
        apiFetch<Discussion>(`/api/v1/discussions/${discussionId}`),
        apiFetch<DiscussionPost[]>(`/api/v1/discussions/${discussionId}/posts`),
        apiFetch<User[]>("/api/v1/users"),
      ]);

      setDiscussion(discussionResponse);
      setPosts(postsResponse);
      setUsersById(
        usersResponse.reduce<Record<number, User>>((accumulator, user) => {
          accumulator[user.id] = user;
          return accumulator;
        }, {}),
      );
    } catch {
      setError("Unable to load discussion.");
    } finally {
      setLoading(false);
    }
  }, [discussionId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const locked = discussion?.status === "locked" || discussion?.status === "archived";
  const roots = posts.filter((post) => post.parent_post_id == null);
  const childrenMap = useMemo(() => {
    return posts.reduce<Record<number, DiscussionPost[]>>((accumulator, post) => {
      if (!post.parent_post_id) return accumulator;
      if (!accumulator[post.parent_post_id]) {
        accumulator[post.parent_post_id] = [];
      }
      accumulator[post.parent_post_id].push(post);
      return accumulator;
    }, {});
  }, [posts]);

  async function createPost(content: string, parentPostId?: number) {
    try {
      await apiFetch(`/api/v1/discussions/${discussionId}/posts`, {
        method: "POST",
        body: JSON.stringify({
          content,
          parent_post_id: parentPostId,
        }),
      });
      await fetchData();
    } catch {
      addToast("error", "Unable to post reply.");
    }
  }

  async function submitTopLevelPost() {
    if (!newPostContent.trim()) return;
    await createPost(newPostContent.trim());
    setNewPostContent("");
  }

  async function submitReply(parentId: number) {
    if (!replyContent.trim()) return;
    await createPost(replyContent.trim(), parentId);
    setReplyingTo(null);
    setReplyContent("");
  }

  async function setDiscussionLock(nextLocked: boolean) {
    try {
      await apiFetch(`/api/v1/discussions/${discussionId}/${nextLocked ? "lock" : "unlock"}`, {
        method: "POST",
      });
      await fetchData();
    } catch {
      addToast("error", "Unable to update discussion status.");
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={TEACHER_ROLES}>
        <AppShell>
          <ListSkeleton />
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (!discussion) {
    return (
      <ProtectedRoute requiredRoles={TEACHER_ROLES}>
        <AppShell>
          <p className="text-sm text-gray-500">Discussion not found.</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  const discussionOwner = usersById[discussion.created_by_id];

  return (
    <ProtectedRoute requiredRoles={TEACHER_ROLES}>
      <AppShell>
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Link
                href={`/teach/courses/${courseId}/discussions`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                &larr; Back to Discussions
              </Link>
              <div className="mt-1 flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{discussion.title}</h1>
                <StatusBadge status={discussion.status} />
              </div>
              <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
                {discussion.description || "No prompt provided."}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Created by {nameFor(discussionOwner, discussion.created_by_id)} on{" "}
                {new Date(discussion.created_at).toLocaleString()}
              </p>
            </div>

            <button
              onClick={() => void setDiscussionLock(!locked)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              {locked ? "Unlock Discussion" : "Lock Discussion"}
            </button>
          </div>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {locked && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              This discussion is locked.
            </div>
          )}

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
              Posts ({posts.length})
            </h2>
            {roots.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                No posts yet.
              </div>
            ) : (
              <div className="space-y-3">
                {roots.map((post) => (
                  <ThreadPost
                    key={post.id}
                    post={post}
                    depth={0}
                    childrenMap={childrenMap}
                    usersById={usersById}
                    locked={locked}
                    replyingTo={replyingTo}
                    replyContent={replyContent}
                    setReplyingTo={setReplyingTo}
                    setReplyContent={setReplyContent}
                    submitReply={submitReply}
                  />
                ))}
              </div>
            )}
          </section>

          {!locked && (
            <section className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">New Post</h3>
              <textarea
                value={newPostContent}
                onChange={(event) => setNewPostContent(event.target.value)}
                rows={4}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Write your post..."
              />
              <button
                onClick={() => void submitTopLevelPost()}
                disabled={!newPostContent.trim()}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Post
              </button>
            </section>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
