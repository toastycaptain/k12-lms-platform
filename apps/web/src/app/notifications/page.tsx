"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { EmptyState } from "@/components/EmptyState";

interface Notification {
  id: number;
  title: string;
  message: string | null;
  url: string | null;
  read_at: string | null;
  created_at: string;
}

const PER_PAGE = 20;

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

export default function NotificationsPage() {
  const router = useRouter();

  const [items, setItems] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loadNotifications = useCallback(
    async (nextPage: number, append: boolean) => {
      const params = new URLSearchParams({
        page: String(nextPage),
        per_page: String(PER_PAGE),
      });
      if (filter === "unread") {
        params.set("unread_only", "true");
      }

      const response = await apiFetch<Notification[]>(`/api/v1/notifications?${params.toString()}`);
      setHasMore(response.length === PER_PAGE);
      setPage(nextPage);
      setItems((previous) => (append ? [...previous, ...response] : response));
    },
    [filter],
  );

  const reloadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      await loadNotifications(1, false);
    } finally {
      setLoading(false);
    }
  }, [loadNotifications]);

  useEffect(() => {
    void reloadNotifications();
  }, [reloadNotifications]);

  async function markAsRead(notificationId: number) {
    await apiFetch(`/api/v1/notifications/${notificationId}/read`, { method: "PATCH" });
    setItems((previous) =>
      previous.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read_at: new Date().toISOString() }
          : notification,
      ),
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-4xl space-y-6">
          <header>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="mt-1 text-sm text-gray-600">
              Stay up to date with course and grading activity.
            </p>
          </header>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-md px-3 py-1.5 text-sm ${
                filter === "all"
                  ? "bg-blue-100 text-blue-800"
                  : "border border-gray-300 text-gray-700"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`rounded-md px-3 py-1.5 text-sm ${
                filter === "unread"
                  ? "bg-blue-100 text-blue-800"
                  : "border border-gray-300 text-gray-700"
              }`}
            >
              Unread
            </button>
          </div>

          {loading ? (
            <ListSkeleton />
          ) : items.length === 0 ? (
            <EmptyState
              title="No notifications to show"
              description="You're all caught up! New notifications will appear here."
            />
          ) : (
            <div className="space-y-2">
              {items.map((notification) => (
                <article
                  key={notification.id}
                  className={`rounded-lg border p-4 ${
                    notification.read_at
                      ? "border-gray-200 bg-white"
                      : "border-blue-200 bg-blue-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">{notification.title}</h2>
                      {notification.message && (
                        <p className="mt-1 text-sm text-gray-700">{notification.message}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {formatDate(notification.created_at)}
                      </p>
                    </div>
                    {!notification.read_at && (
                      <span className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    {!notification.read_at && (
                      <button
                        type="button"
                        onClick={() => void markAsRead(notification.id)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Mark as read
                      </button>
                    )}
                    {notification.url && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!notification.read_at) {
                            await markAsRead(notification.id);
                          }
                          router.push(notification.url || "/dashboard");
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Open
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          {hasMore && (
            <button
              type="button"
              disabled={loadingMore}
              onClick={async () => {
                setLoadingMore(true);
                await loadNotifications(page + 1, true);
                setLoadingMore(false);
              }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          )}

          <Link
            href="/dashboard"
            className="inline-block text-sm text-blue-600 hover:text-blue-800"
          >
            &larr; Back to Dashboard
          </Link>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
