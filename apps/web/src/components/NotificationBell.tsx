"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { announce } from "@/components/LiveRegion";

interface Notification {
  id: number;
  title: string;
  message: string | null;
  url: string | null;
  read_at: string | null;
  created_at: string;
}

export default function NotificationBell() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bellButtonRef = useRef<HTMLButtonElement | null>(null);

  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await apiFetch<{ count: number }>("/api/v1/notifications/unread_count");
      setCount(response.count);
    } catch {
      setCount(0);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch<Notification[]>("/api/v1/notifications");
      setNotifications(response);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUnreadCount();

    const interval = setInterval(() => {
      void loadUnreadCount();
    }, 30000);

    const onFocus = () => {
      void loadUnreadCount();
    };

    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadUnreadCount]);

  useEffect(() => {
    function onDocumentMouseDown(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        bellButtonRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", onDocumentMouseDown);
    return () => document.removeEventListener("mousedown", onDocumentMouseDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadNotifications();
  }, [loadNotifications, open]);

  useEffect(() => {
    if (!open) return;

    function onEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      bellButtonRef.current?.focus();
    }

    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [open]);

  async function markAsRead(notificationId: number) {
    try {
      await apiFetch(`/api/v1/notifications/${notificationId}/read`, { method: "PATCH" });
      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read_at: new Date().toISOString() }
            : notification,
        ),
      );
      setCount((previous) => Math.max(0, previous - 1));
      announce("Notification marked as read");
    } catch {
      // noop
    }
  }

  async function markAllRead() {
    try {
      await apiFetch("/api/v1/notifications/mark_all_read", { method: "POST" });
      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          read_at: notification.read_at || new Date().toISOString(),
        })),
      );
      setCount(0);
      announce("All notifications marked as read");
    } catch {
      // noop
    }
  }

  function timeAgo(dateValue: string): string {
    const elapsedSeconds = Math.max(
      1,
      Math.floor((Date.now() - new Date(dateValue).getTime()) / 1000),
    );
    if (elapsedSeconds < 60) return `${elapsedSeconds}s ago`;
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) return `${elapsedHours}h ago`;
    const elapsedDays = Math.floor(elapsedHours / 24);
    return `${elapsedDays}d ago`;
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={bellButtonRef}
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className="relative rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        aria-label={`Notifications, ${count} unread`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="notifications-menu"
      >
        <span>🔔</span>
        {count > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1 text-center text-[10px] font-semibold text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <aside
          id="notifications-menu"
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-2 w-96 max-w-[85vw] rounded-md border border-gray-200 bg-white shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Mark all read
            </button>
          </div>

          {loading ? (
            <p className="px-3 py-4 text-sm text-gray-500">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="px-3 py-4 text-sm text-gray-500">No notifications yet.</p>
          ) : (
            <ul role="menu" className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <li key={notification.id} className="border-b border-gray-100 last:border-b-0">
                  <button
                    type="button"
                    role="menuitem"
                    className={`w-full px-3 py-3 text-left hover:bg-gray-50 ${
                      notification.read_at ? "bg-white" : "bg-blue-50/50"
                    }`}
                    onClick={async () => {
                      if (!notification.read_at) {
                        await markAsRead(notification.id);
                      }
                      if (notification.url) {
                        setOpen(false);
                        bellButtonRef.current?.focus();
                        router.push(notification.url);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                      {!notification.read_at && (
                        <span className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    {notification.message && (
                      <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                        {notification.message}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-gray-500">
                      {timeAgo(notification.created_at)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-gray-100 px-3 py-2">
            <Link
              href="/notifications"
              onClick={() => {
                setOpen(false);
                bellButtonRef.current?.focus();
              }}
              role="menuitem"
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              View all
            </Link>
          </div>
        </aside>
      )}
    </div>
  );
}
