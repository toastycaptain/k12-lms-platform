"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Course {
  id: number;
  name: string;
}

interface Announcement {
  id: number;
  course_id: number;
  title: string;
  message: string;
  created_at: string;
  pinned: boolean;
}

type AnnouncementRow = Announcement & { course_name?: string };

function formatDate(value: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return "Unknown date";
  }
  return new Date(parsed).toLocaleString();
}

function previewMessage(message: string): string {
  const trimmed = message.trim();
  if (trimmed.length <= 160) {
    return trimmed;
  }
  return `${trimmed.slice(0, 160)}...`;
}

export default function CommunicatePage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canCreate = useMemo(
    () => (user?.roles ?? []).some((role) => role === "admin" || role === "teacher"),
    [user?.roles],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const availableCourses = await apiFetch<Course[]>("/api/v1/courses");
      setCourses(availableCourses);
      setSelectedCourseId((current) => current || String(availableCourses[0]?.id || ""));

      const nameByCourseId = new Map(availableCourses.map((course) => [course.id, course.name]));
      let rows: AnnouncementRow[];

      try {
        const directRows = await apiFetch<Announcement[]>("/api/v1/announcements");
        rows = directRows.map((row) => ({ ...row, course_name: nameByCourseId.get(row.course_id) }));
      } catch (directError) {
        if (!(directError instanceof ApiError) || (directError.status !== 404 && directError.status !== 405)) {
          throw directError;
        }

        const settled = await Promise.allSettled(
          availableCourses.map(async (course) => {
            const courseRows = await apiFetch<Announcement[]>(`/api/v1/courses/${course.id}/announcements`);
            return courseRows.map((row) => ({ ...row, course_name: course.name }));
          }),
        );

        rows = settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
      }

      rows.sort((a, b) => {
        if (a.pinned !== b.pinned) {
          return a.pinned ? -1 : 1;
        }
        return Date.parse(b.created_at) - Date.parse(a.created_at);
      });

      setAnnouncements(rows);
    } catch (loadError) {
      setError(loadError instanceof ApiError ? loadError.message : "Failed to load communication data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function submitAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canCreate || !selectedCourseId || !title.trim() || !message.trim()) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const courseId = Number(selectedCourseId);

    try {
      try {
        await apiFetch<Announcement>("/api/v1/announcements", {
          method: "POST",
          body: JSON.stringify({
            announcement: {
              title: title.trim(),
              message: message.trim(),
              course_id: courseId,
            },
          }),
        });
      } catch (directError) {
        if (!(directError instanceof ApiError) || (directError.status !== 404 && directError.status !== 405)) {
          throw directError;
        }

        await apiFetch<Announcement>(`/api/v1/courses/${courseId}/announcements`, {
          method: "POST",
          body: JSON.stringify({
            title: title.trim(),
            message: message.trim(),
            published_at: new Date().toISOString(),
          }),
        });
      }

      setTitle("");
      setMessage("");
      setSuccess("Announcement posted.");
      await loadData();
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Failed to post announcement.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-5xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Communicate</h1>
            <p className="text-sm text-gray-600">Announcements and classroom updates.</p>
          </div>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {success && <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</div>}

          {canCreate && (
            <form onSubmit={(event) => void submitAnnouncement(event)} className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-gray-900">Post Announcement</h2>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <select
                  value={selectedCourseId}
                  onChange={(event) => setSelectedCourseId(event.target.value)}
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                  disabled={courses.length === 0}
                >
                  {courses.length === 0 ? (
                    <option value="">No courses available</option>
                  ) : (
                    courses.map((course) => (
                      <option key={course.id} value={String(course.id)}>
                        {course.name}
                      </option>
                    ))
                  )}
                </select>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Announcement title"
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Write your message..."
                className="mt-3 min-h-28 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />

              <button
                type="submit"
                disabled={submitting || !selectedCourseId || !title.trim() || !message.trim()}
                className="mt-3 rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Posting..." : "Post Announcement"}
              </button>
            </form>
          )}

          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Announcements</h2>
              {!loading && <span className="text-xs text-gray-500">{announcements.length} total</span>}
            </div>

            {loading ? (
              <p className="mt-3 text-sm text-gray-500">Loading announcements...</p>
            ) : announcements.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">No announcements yet.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {announcements.map((announcement) => (
                  <article key={announcement.id} className="rounded border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">{announcement.title}</h3>
                      <span className="text-xs text-gray-500">{formatDate(announcement.created_at)}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-700">{previewMessage(announcement.message)}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      {announcement.course_name && <span>{announcement.course_name}</span>}
                      {announcement.pinned && (
                        <span className="rounded bg-blue-100 px-2 py-0.5 font-medium text-blue-700">Pinned</span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
