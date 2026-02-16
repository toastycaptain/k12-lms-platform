"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { FocusTrap } from "@/components/FocusTrap";
import ProtectedRoute from "@/components/ProtectedRoute";
import { announce } from "@/components/LiveRegion";
import { ApiError, apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/Toast";
import { Pagination } from "@/components/Pagination";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { EmptyState } from "@/components/EmptyState";

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
  published_at: string | null;
  course_name?: string;
  created_by_name?: string;
}

interface Participant {
  id: number;
  first_name: string;
  last_name: string;
  roles: string[];
}

interface ThreadMessage {
  id: number;
  body: string;
  created_at: string;
}

interface MessageThread {
  id: number;
  subject: string;
  thread_type: string;
  participants: Participant[];
  last_message: ThreadMessage | null;
  unread_count: number;
  updated_at: string;
}

type Tab = "announcements" | "messages";

function formatDate(value: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return "Unknown date";
  return new Date(parsed).toLocaleString();
}

function preview(value: string, max = 140): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}...`;
}

function fullName(participant: Participant): string {
  return `${participant.first_name} ${participant.last_name}`.trim();
}

export default function CommunicatePage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("announcements");

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [threadsPage, setThreadsPage] = useState(1);
  const [threadsPerPage, setThreadsPerPage] = useState(25);
  const [threadsTotalPages, setThreadsTotalPages] = useState(1);

  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementCourseId, setAnnouncementCourseId] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [submittingAnnouncement, setSubmittingAnnouncement] = useState(false);
  const [announcementValidationError, setAnnouncementValidationError] = useState<string | null>(
    null,
  );

  const canCreateAnnouncement = useMemo(
    () => (user?.roles || []).some((role) => role === "admin" || role === "teacher"),
    [user?.roles],
  );

  const loadAnnouncements = useCallback(async () => {
    setLoadingAnnouncements(true);
    try {
      const rows = await apiFetch<Announcement[]>("/api/v1/announcements");
      setAnnouncements(rows);
    } catch (loadError) {
      setError(loadError instanceof ApiError ? loadError.message : "Failed to load announcements.");
    } finally {
      setLoadingAnnouncements(false);
    }
  }, []);

  const loadThreads = useCallback(async () => {
    setLoadingThreads(true);
    try {
      const rows = await apiFetch<MessageThread[]>(
        `/api/v1/message_threads?page=${threadsPage}&per_page=${threadsPerPage}`,
      );
      setThreads(rows);
      setThreadsTotalPages(rows.length < threadsPerPage ? threadsPage : threadsPage + 1);
    } catch (loadError) {
      setError(loadError instanceof ApiError ? loadError.message : "Failed to load messages.");
    } finally {
      setLoadingThreads(false);
    }
  }, [threadsPage, threadsPerPage]);

  useEffect(() => {
    void loadAnnouncements();
    void loadThreads();
  }, [loadAnnouncements, loadThreads]);

  useEffect(() => {
    if (!canCreateAnnouncement) return;

    async function loadCourses() {
      try {
        const rows = await apiFetch<Course[]>("/api/v1/courses");
        setCourses(rows);
        setAnnouncementCourseId((current) => current || String(rows[0]?.id || ""));
      } catch (loadError) {
        setError(loadError instanceof ApiError ? loadError.message : "Failed to load courses.");
      }
    }

    void loadCourses();
  }, [canCreateAnnouncement]);

  async function submitAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !canCreateAnnouncement ||
      !announcementCourseId ||
      !announcementTitle.trim() ||
      !announcementMessage.trim()
    ) {
      setAnnouncementValidationError("Course, title, and message are required.");
      announce("Announcement form has validation errors");
      return;
    }

    setSubmittingAnnouncement(true);
    setAnnouncementValidationError(null);

    try {
      await apiFetch<Announcement>("/api/v1/announcements", {
        method: "POST",
        body: JSON.stringify({
          course_id: Number(announcementCourseId),
          title: announcementTitle.trim(),
          message: announcementMessage.trim(),
          published_at: new Date().toISOString(),
        }),
      });

      setAnnouncementTitle("");
      setAnnouncementMessage("");
      setShowAnnouncementForm(false);
      addToast("success", "Announcement posted.");
      announce("Announcement posted successfully");
      await loadAnnouncements();
    } catch (submitError) {
      announce("Failed to post announcement");
      addToast(
        "error",
        submitError instanceof ApiError ? submitError.message : "Failed to create announcement.",
      );
    } finally {
      setSubmittingAnnouncement(false);
    }
  }

  function activateTab(nextTab: Tab) {
    setActiveTab(nextTab);
    announce(`${nextTab === "announcements" ? "Announcements" : "Messages"} tab selected`);
  }

  function participantPreview(thread: MessageThread): string {
    const currentUserId = user?.id;
    const visibleParticipants = thread.participants.filter(
      (participant) => participant.id !== currentUserId,
    );
    const names = visibleParticipants.slice(0, 3).map(fullName).filter(Boolean);
    if (names.length === 0) return "No participants";
    if (visibleParticipants.length > 3)
      return `${names.join(", ")} +${visibleParticipants.length - 3}`;
    return names.join(", ");
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-5xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Communicate</h1>
            <p className="text-sm text-gray-600">Announcements and direct course messaging.</p>
          </div>

          {error && (
            <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div
            role="tablist"
            aria-label="Communication tabs"
            className="flex items-center gap-2 border-b border-gray-200"
          >
            <button
              id="communicate-tab-announcements"
              role="tab"
              aria-selected={activeTab === "announcements"}
              aria-controls="communicate-panel-announcements"
              tabIndex={activeTab === "announcements" ? 0 : -1}
              onClick={() => activateTab("announcements")}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                  event.preventDefault();
                  activateTab("messages");
                }
              }}
              className={`border-b-2 px-3 py-2 text-sm font-medium ${
                activeTab === "announcements"
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-gray-500"
              }`}
            >
              Announcements
            </button>
            <button
              id="communicate-tab-messages"
              role="tab"
              aria-selected={activeTab === "messages"}
              aria-controls="communicate-panel-messages"
              tabIndex={activeTab === "messages" ? 0 : -1}
              onClick={() => activateTab("messages")}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                  event.preventDefault();
                  activateTab("announcements");
                }
              }}
              className={`border-b-2 px-3 py-2 text-sm font-medium ${
                activeTab === "messages"
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-gray-500"
              }`}
            >
              Messages
            </button>
          </div>

          {activeTab === "announcements" && (
            <section
              id="communicate-panel-announcements"
              role="tabpanel"
              aria-labelledby="communicate-tab-announcements"
              tabIndex={0}
              className="space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Announcements</h2>
                {canCreateAnnouncement && (
                  <button
                    onClick={() => setShowAnnouncementForm((current) => !current)}
                    className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    {showAnnouncementForm ? "Cancel" : "New Announcement"}
                  </button>
                )}
              </div>

              {showAnnouncementForm && canCreateAnnouncement && (
                <FocusTrap active={showAnnouncementForm}>
                  <form
                    onSubmit={(event) => void submitAnnouncement(event)}
                    className="space-y-3 rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor="announcement-course"
                          className="mb-1 block text-sm font-medium text-gray-700"
                        >
                          Course
                        </label>
                        <select
                          id="announcement-course"
                          value={announcementCourseId}
                          onChange={(event) => setAnnouncementCourseId(event.target.value)}
                          required
                          aria-required="true"
                          aria-invalid={Boolean(
                            announcementValidationError && !announcementCourseId,
                          )}
                          aria-describedby={
                            announcementValidationError && !announcementCourseId
                              ? "announcement-form-error"
                              : undefined
                          }
                          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        >
                          {courses.map((course) => (
                            <option key={course.id} value={String(course.id)}>
                              {course.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor="announcement-title"
                          className="mb-1 block text-sm font-medium text-gray-700"
                        >
                          Title
                        </label>
                        <input
                          id="announcement-title"
                          value={announcementTitle}
                          onChange={(event) => setAnnouncementTitle(event.target.value)}
                          required
                          aria-required="true"
                          aria-invalid={Boolean(
                            announcementValidationError && !announcementTitle.trim(),
                          )}
                          aria-describedby={
                            announcementValidationError && !announcementTitle.trim()
                              ? "announcement-form-error"
                              : undefined
                          }
                          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                          placeholder="Announcement title"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="announcement-message"
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        Message
                      </label>
                      <textarea
                        id="announcement-message"
                        value={announcementMessage}
                        onChange={(event) => setAnnouncementMessage(event.target.value)}
                        required
                        aria-required="true"
                        aria-invalid={Boolean(
                          announcementValidationError && !announcementMessage.trim(),
                        )}
                        aria-describedby={
                          announcementValidationError && !announcementMessage.trim()
                            ? "announcement-form-error"
                            : undefined
                        }
                        className="min-h-28 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Write your announcement"
                      />
                    </div>

                    {announcementValidationError && (
                      <p id="announcement-form-error" role="alert" className="text-sm text-red-700">
                        {announcementValidationError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={
                        submittingAnnouncement ||
                        !announcementCourseId ||
                        !announcementTitle.trim() ||
                        !announcementMessage.trim()
                      }
                      className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submittingAnnouncement ? "Posting..." : "Post Announcement"}
                    </button>
                  </form>
                </FocusTrap>
              )}

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                {loadingAnnouncements ? (
                  <ListSkeleton />
                ) : announcements.length === 0 ? (
                  <EmptyState
                    title="No announcements yet"
                    description="Announcements from your courses will appear here."
                  />
                ) : (
                  <div className="space-y-3">
                    {announcements.map((announcement) => (
                      <article
                        key={announcement.id}
                        className="rounded border border-gray-200 bg-gray-50 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold text-gray-900">
                            {announcement.title}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {formatDate(announcement.created_at)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-700">
                          {preview(announcement.message)}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <span>{announcement.created_by_name || "Unknown author"}</span>
                          <span>•</span>
                          <span>
                            {announcement.course_name || `Course #${announcement.course_id}`}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === "messages" && (
            <section
              id="communicate-panel-messages"
              role="tabpanel"
              aria-labelledby="communicate-tab-messages"
              tabIndex={0}
              className="space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Message Threads</h2>
                <Link
                  href="/communicate/compose"
                  className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  New Message
                </Link>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                {loadingThreads ? (
                  <ListSkeleton />
                ) : threads.length === 0 ? (
                  <EmptyState
                    title="No threads yet"
                    description="Start a conversation by creating a new message."
                  />
                ) : (
                  <div className="space-y-2">
                    {threads.map((thread) => (
                      <Link
                        key={thread.id}
                        href={`/communicate/threads/${thread.id}`}
                        className="block rounded border border-gray-200 bg-gray-50 px-4 py-3 hover:bg-gray-100"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900">{thread.subject}</p>
                          <div className="flex items-center gap-2">
                            {thread.unread_count > 0 && (
                              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                                {thread.unread_count}
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {formatDate(thread.last_message?.created_at || thread.updated_at)}
                            </span>
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{participantPreview(thread)}</p>
                        <p className="mt-1 text-sm text-gray-700">
                          {thread.last_message
                            ? preview(thread.last_message.body, 120)
                            : "No messages yet"}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Pagination
                currentPage={threadsPage}
                totalPages={threadsTotalPages}
                onPageChange={setThreadsPage}
                perPage={threadsPerPage}
                onPerPageChange={(nextPerPage) => {
                  setThreadsPerPage(nextPerPage);
                  setThreadsPage(1);
                }}
              />
            </section>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
