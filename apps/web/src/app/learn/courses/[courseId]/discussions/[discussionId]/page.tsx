"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { EmptyState } from "@k12/ui";

interface Discussion {
  id: number;
  title: string;
  description: string | null;
  status: string;
  created_by_id: number;
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
}

const LEARN_ROLES = ["admin", "teacher", "student"];

function userName(user: User | undefined, fallbackId: number): string {
  if (!user) return `User #${fallbackId}`;
  return `${user.first_name} ${user.last_name}`.trim() || `User #${fallbackId}`;
}

function buildThread(posts: DiscussionPost[]): Record<number, DiscussionPost[]> {
  return posts.reduce<Record<number, DiscussionPost[]>>((acc, post) => {
    if (!post.parent_post_id) return acc;
    if (!acc[post.parent_post_id]) {
      acc[post.parent_post_id] = [];
    }
    acc[post.parent_post_id].push(post);
    return acc;
  }, {});
}

interface ThreadPostProps {
  post: DiscussionPost;
  childrenByParentId: Record<number, DiscussionPost[]>;
  usersById: Record<number, User>;
  depth: number;
  replyingToId: number | null;
  replyContent: string;
  locked: boolean;
  currentUserId?: number;
  setReplyingToId: (id: number | null) => void;
  setReplyContent: (content: string) => void;
  submitReply: (parentId: number) => Promise<void>;
}

function ThreadPost({
  post,
  childrenByParentId,
  usersById,
  depth,
  replyingToId,
  replyContent,
  locked,
  currentUserId,
  setReplyingToId,
  setReplyContent,
  submitReply,
}: ThreadPostProps) {
  const children = childrenByParentId[post.id] || [];
  const marginLeft = Math.min(depth, 4) * 16;
  const isOwnPost = post.created_by_id === currentUserId;

  return (
    <div style={{ marginLeft }} className="space-y-2">
      <article
        className={`rounded-lg border p-4 ${isOwnPost ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-white"}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900">
            {userName(usersById[post.created_by_id], post.created_by_id)}
          </p>
          <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleString()}</p>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{post.content}</p>
        {!locked && (
          <button
            onClick={() => {
              setReplyingToId(post.id);
              setReplyContent("");
            }}
            className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            Reply
          </button>
        )}

        {replyingToId === post.id && !locked && (
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
                  setReplyingToId(null);
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
              childrenByParentId={childrenByParentId}
              usersById={usersById}
              depth={depth + 1}
              replyingToId={replyingToId}
              replyContent={replyContent}
              locked={locked}
              currentUserId={currentUserId}
              setReplyingToId={setReplyingToId}
              setReplyContent={setReplyContent}
              submitReply={submitReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LearnDiscussionPage() {
  const params = useParams();
  const { user } = useAuth();
  const courseId = String(params.courseId);
  const discussionId = String(params.discussionId);

  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [usersById, setUsersById] = useState<Record<number, User>>({});
  const [newPost, setNewPost] = useState("");
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [discussionData, postData, users] = await Promise.all([
        apiFetch<Discussion>(`/api/v1/discussions/${discussionId}`),
        apiFetch<DiscussionPost[]>(`/api/v1/discussions/${discussionId}/posts`),
        apiFetch<User[]>("/api/v1/users"),
      ]);

      setDiscussion(discussionData);
      setPosts(postData);
      setUsersById(
        users.reduce<Record<number, User>>((acc, entry) => {
          acc[entry.id] = entry;
          return acc;
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

  const roots = useMemo(() => posts.filter((post) => post.parent_post_id === null), [posts]);
  const childrenByParentId = useMemo(() => buildThread(posts), [posts]);
  const locked = discussion?.status === "locked" || discussion?.status === "archived";

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
      setError("Unable to post message.");
    }
  }

  async function submitTopLevelPost() {
    const trimmed = newPost.trim();
    if (!trimmed) return;
    await createPost(trimmed);
    setNewPost("");
  }

  async function submitReply(parentId: number) {
    const trimmed = replyContent.trim();
    if (!trimmed) return;
    await createPost(trimmed, parentId);
    setReplyingToId(null);
    setReplyContent("");
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={LEARN_ROLES}>
        <AppShell>
          <ListSkeleton />
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (!discussion) {
    return (
      <ProtectedRoute requiredRoles={LEARN_ROLES}>
        <AppShell>
          <p className="text-sm text-gray-500">Discussion not found.</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={LEARN_ROLES}>
      <AppShell>
        <div className="mx-auto max-w-4xl space-y-6">
          <header className="rounded-lg border border-gray-200 bg-white p-6">
            <Link
              href={`/learn/courses/${courseId}`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              &larr; Back to Course
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">{discussion.title}</h1>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
              {discussion.description || "No prompt provided."}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Posted on {new Date(discussion.created_at).toLocaleString()}
            </p>
          </header>

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
              <EmptyState
                title="No posts yet"
                description="Be the first to post in this discussion."
              />
            ) : (
              <div className="space-y-2">
                {roots.map((post) => (
                  <ThreadPost
                    key={post.id}
                    post={post}
                    childrenByParentId={childrenByParentId}
                    usersById={usersById}
                    depth={0}
                    replyingToId={replyingToId}
                    replyContent={replyContent}
                    locked={locked}
                    currentUserId={user?.id}
                    setReplyingToId={setReplyingToId}
                    setReplyContent={setReplyContent}
                    submitReply={submitReply}
                  />
                ))}
              </div>
            )}
          </section>

          {!locked && (
            <section className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Add Post</h3>
              <textarea
                value={newPost}
                onChange={(event) => setNewPost(event.target.value)}
                rows={4}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Share your thoughts..."
              />
              <button
                onClick={() => void submitTopLevelPost()}
                disabled={!newPost.trim()}
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
