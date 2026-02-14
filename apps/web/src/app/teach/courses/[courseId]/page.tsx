"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface Course {
  id: number;
  name: string;
  code: string;
  description: string;
}

interface CourseModule {
  id: number;
  title: string;
  description: string;
  position: number;
  status: string;
}

interface Announcement {
  id: number;
  title: string;
  message: string;
  published_at: string;
  pinned: boolean;
}

interface Assignment {
  id: number;
  title: string;
  due_at: string | null;
  status: string;
  points_possible: string | null;
}

interface Quiz {
  id: number;
  title: string;
  status: string;
  points_possible: number | null;
  due_at: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-800",
    published: "bg-green-100 text-green-800",
    archived: "bg-gray-100 text-gray-600",
    open: "bg-green-100 text-green-800",
    closed: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-600"}`}
    >
      {status}
    </span>
  );
}

export default function CourseHomePage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  const isTeacher = user?.roles?.includes("teacher") || user?.roles?.includes("admin");

  const fetchData = useCallback(async () => {
    try {
      const [courseData, modulesData, announcementsData, assignmentsData, quizzesData] = await Promise.all([
        apiFetch<Course>(`/api/v1/courses/${courseId}`),
        apiFetch<CourseModule[]>(`/api/v1/courses/${courseId}/modules`),
        apiFetch<Announcement[]>(`/api/v1/courses/${courseId}/announcements`),
        apiFetch<Assignment[]>(`/api/v1/courses/${courseId}/assignments`),
        apiFetch<Quiz[]>(`/api/v1/courses/${courseId}/quizzes`),
      ]);
      setCourse(courseData);
      setModules(modulesData);
      setAnnouncements(announcementsData.slice(0, 3));
      // Upcoming assignments: published, sorted by due date, next 5
      const upcoming = assignmentsData
        .filter((a) => a.status === "published" && a.due_at)
        .sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime())
        .slice(0, 5);
      setAssignments(upcoming);
      setQuizzes(quizzesData);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="text-sm text-gray-500">Loading course...</div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (!course) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="text-sm text-red-500">Course not found</div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  const visibleModules = isTeacher
    ? modules
    : modules.filter((m) => m.status === "published");

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-8">
          {/* Course Header */}
          <div>
            <Link href="/teach/courses" className="text-sm text-blue-600 hover:text-blue-800">
              &larr; Back to courses
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">{course.name}</h1>
            {course.code && <p className="text-sm text-gray-400">{course.code}</p>}
            {course.description && <p className="mt-2 text-sm text-gray-600">{course.description}</p>}
          </div>

          {/* Modules Section */}
          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Modules</h2>
              {isTeacher && (
                <Link
                  href={`/teach/courses/${courseId}/modules/new`}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  New Module
                </Link>
              )}
            </div>
            {visibleModules.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">No modules yet</p>
            ) : (
              <div className="mt-3 space-y-2">
                {visibleModules.map((mod) => (
                  <Link
                    key={mod.id}
                    href={`/teach/courses/${courseId}/modules/${mod.id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 hover:shadow-sm transition-shadow"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-900">{mod.title}</span>
                      <span className="ml-2 text-xs text-gray-400">
                        {mod.position !== undefined ? `Position ${mod.position}` : ""}
                      </span>
                    </div>
                    <StatusBadge status={mod.status} />
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Recent Announcements */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900">Recent Announcements</h2>
            {announcements.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">No announcements</p>
            ) : (
              <div className="mt-3 space-y-2">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      {ann.pinned && (
                        <span className="text-xs font-medium text-blue-600">Pinned</span>
                      )}
                      <h3 className="text-sm font-medium text-gray-900">{ann.title}</h3>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{ann.message}</p>
                    {ann.published_at && (
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(ann.published_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Upcoming Assignments */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Assignments</h2>
            {assignments.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">No upcoming assignments</p>
            ) : (
              <div className="mt-3 space-y-2">
                {assignments.map((asn) => (
                  <Link
                    key={asn.id}
                    href={`/teach/courses/${courseId}/assignments/${asn.id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 hover:shadow-sm transition-shadow"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-900">{asn.title}</span>
                      {asn.points_possible && (
                        <span className="ml-2 text-xs text-gray-400">{asn.points_possible} pts</span>
                      )}
                    </div>
                    {asn.due_at && (
                      <span className="text-xs text-gray-500">
                        Due {new Date(asn.due_at).toLocaleDateString()}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Quizzes */}
          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Quizzes</h2>
              {isTeacher && (
                <Link
                  href={`/assess/quizzes/new?courseId=${courseId}`}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  New Quiz
                </Link>
              )}
            </div>
            {quizzes.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">No quizzes yet</p>
            ) : (
              <div className="mt-3 space-y-2">
                {quizzes.map((qz) => (
                  <Link
                    key={qz.id}
                    href={`/assess/quizzes/${qz.id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 hover:shadow-sm transition-shadow"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-900">{qz.title}</span>
                      {qz.points_possible != null && (
                        <span className="ml-2 text-xs text-gray-400">{qz.points_possible} pts</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {qz.due_at && (
                        <span className="text-xs text-gray-500">
                          Due {new Date(qz.due_at).toLocaleDateString()}
                        </span>
                      )}
                      <StatusBadge status={qz.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
