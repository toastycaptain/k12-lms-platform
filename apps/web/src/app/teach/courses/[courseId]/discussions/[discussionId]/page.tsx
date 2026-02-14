"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
}

interface DiscussionPost {
  id: number;
  discussion_id: number;
  parent_post_id: number | null;
  created_by_id: number;
  content: string;
  created_at: string;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: "bg-green-100 text-green-800",
    locked: "bg-yellow-100 text-yellow-800",
    archived: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

interface PostNodeProps {
  post: DiscussionPost;
  childrenMap: Map<number, DiscussionPost[]>;
  depth: number;
  isLocked: boolean;
  onReply: (parentId: number) => void;
  replyingTo: number | null;
  replyContent: string;
  onReplyContentChange: (value: string) => void;
  onSubmitReply: () => void;
  submittingReply: boolean;
}

function PostNode({
  post,
  childrenMap,
  depth,
  isLocked,
  onReply,
  replyingTo,
  replyContent,
  onReplyContentChange,
  onSubmitReply,
  submittingReply,
}: PostNodeProps) {
  const children = childrenMap.get(post.id) || [];
  // Cap visual nesting at 3 levels
  const indent = Math.min(depth, 3);

  return (
    <div style={{ marginLeft: indent > 0 ? `${indent * 24}px` : "0" }}>
      <div className="rounded-md border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700">
            User #{post.created_by_id}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(post.created_at).toLocaleString()}
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">{post.content}</p>
        {!isLocked && (
          <button
            onClick={() => onReply(post.id)}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800"
          >
            Reply
          </button>
        )}

        {/* Inline reply form */}
        {replyingTo === post.id && (
          <div className="mt-3 space-y-2">
            <textarea
              value={replyContent}
              onChange={(e) => onReplyContentChange(e.target.value)}
              rows={3}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Write your reply..."
            />
            <div className="flex gap-2">
              <button
                onClick={onSubmitReply}
                disabled={submittingReply || !replyContent.trim()}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submittingReply ? "Posting..." : "Post Reply"}
              </button>
              <button
                onClick={() => onReply(-1)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Child posts */}
      {children.length > 0 && (
        <div className="mt-2 space-y-2">
          {children.map((child) => (
            <PostNode
              key={child.id}
              post={child}
              childrenMap={childrenMap}
              depth={depth + 1}
              isLocked={isLocked}
              onReply={onReply}
              replyingTo={replyingTo}
              replyContent={replyContent}
              onReplyContentChange={onReplyContentChange}
              onSubmitReply={onSubmitReply}
              submittingReply={submittingReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DiscussionThreadPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const discussionId = params.discussionId as string;
  const { user } = useAuth();

  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Reply state
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // Top-level post
  const [topLevelContent, setTopLevelContent] = useState("");
  const [submittingTopLevel, setSubmittingTopLevel] = useState(false);

  const isTeacher = user?.roles?.includes("teacher") || user?.roles?.includes("admin");
  const isLocked = discussion?.status === "locked" || discussion?.status === "archived";

  const fetchData = useCallback(async () => {
    try {
      const [disc, postsData] = await Promise.all([
        apiFetch<Discussion>(`/api/v1/discussions/${discussionId}`),
        apiFetch<DiscussionPost[]>(`/api/v1/discussions/${discussionId}/posts`),
      ]);
      setDiscussion(disc);
      setPosts(postsData);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, [discussionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Build thread tree
  const rootPosts = posts.filter((p) => !p.parent_post_id);
  const childrenMap = new Map<number, DiscussionPost[]>();
  for (const post of posts) {
    if (post.parent_post_id) {
      const existing = childrenMap.get(post.parent_post_id) || [];
      existing.push(post);
      childrenMap.set(post.parent_post_id, existing);
    }
  }

  function handleReply(parentId: number) {
    if (parentId === -1) {
      setReplyingTo(null);
      setReplyContent("");
    } else {
      setReplyingTo(parentId);
      setReplyContent("");
    }
  }

  async function submitReply() {
    if (!replyContent.trim() || !replyingTo) return;
    setSubmittingReply(true);
    try {
      await apiFetch(`/api/v1/discussions/${discussionId}/posts`, {
        method: "POST",
        body: JSON.stringify({
          content: replyContent,
          parent_post_id: replyingTo,
        }),
      });
      setReplyingTo(null);
      setReplyContent("");
      fetchData();
    } catch {
      // handle error
    } finally {
      setSubmittingReply(false);
    }
  }

  async function submitTopLevel() {
    if (!topLevelContent.trim()) return;
    setSubmittingTopLevel(true);
    try {
      await apiFetch(`/api/v1/discussions/${discussionId}/posts`, {
        method: "POST",
        body: JSON.stringify({ content: topLevelContent }),
      });
      setTopLevelContent("");
      fetchData();
    } catch {
      // handle error
    } finally {
      setSubmittingTopLevel(false);
    }
  }

  async function handleLock() {
    try {
      await apiFetch(`/api/v1/discussions/${discussionId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "locked" }),
      });
      fetchData();
    } catch {
      // handle error
    }
  }

  async function handleArchive() {
    try {
      await apiFetch(`/api/v1/discussions/${discussionId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "archived" }),
      });
      fetchData();
    } catch {
      // handle error
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="text-sm text-gray-500">Loading discussion...</div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (!discussion) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="text-sm text-red-500">Discussion not found</div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Header */}
          <div>
            <Link
              href={`/teach/courses/${courseId}/discussions`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              &larr; Back to discussions
            </Link>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">{discussion.title}</h1>
                  <StatusBadge status={discussion.status} />
                </div>
                {discussion.pinned && (
                  <span className="text-xs font-medium text-blue-600">Pinned</span>
                )}
                <p className="mt-0.5 text-xs text-gray-400">
                  Created by #{discussion.created_by_id} &middot;{" "}
                  {new Date(discussion.created_at).toLocaleString()}
                </p>
              </div>
              {isTeacher && discussion.status === "open" && (
                <div className="flex gap-2">
                  <button
                    onClick={handleLock}
                    className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-1.5 text-xs font-medium text-yellow-800 hover:bg-yellow-100"
                  >
                    Lock
                  </button>
                  <button
                    onClick={handleArchive}
                    className="rounded-md border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Archive
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Discussion Description */}
          {discussion.description && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{discussion.description}</p>
            </div>
          )}

          {/* Lock indicator */}
          {isLocked && (
            <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
              This discussion is {discussion.status}. No new posts can be added.
            </div>
          )}

          {/* Posts */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {posts.length} {posts.length === 1 ? "Post" : "Posts"}
            </h2>
            {rootPosts.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">No posts yet. Be the first to respond!</p>
            ) : (
              <div className="mt-3 space-y-3">
                {rootPosts.map((post) => (
                  <PostNode
                    key={post.id}
                    post={post}
                    childrenMap={childrenMap}
                    depth={0}
                    isLocked={isLocked}
                    onReply={handleReply}
                    replyingTo={replyingTo}
                    replyContent={replyContent}
                    onReplyContentChange={setReplyContent}
                    onSubmitReply={submitReply}
                    submittingReply={submittingReply}
                  />
                ))}
              </div>
            )}
          </div>

          {/* New top-level post */}
          {!isLocked && (
            <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Add a Post</h3>
              <textarea
                value={topLevelContent}
                onChange={(e) => setTopLevelContent(e.target.value)}
                rows={4}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Share your thoughts..."
              />
              <button
                onClick={submitTopLevel}
                disabled={submittingTopLevel || !topLevelContent.trim()}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submittingTopLevel ? "Posting..." : "Post"}
              </button>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
