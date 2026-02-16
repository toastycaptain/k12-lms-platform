"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch } from "@/lib/api";

interface Course {
  id: number;
  name: string;
}

interface Quiz {
  id: number;
  title: string;
  status: string;
  due_at: string | null;
  points_possible: number | null;
}

interface QuizRow {
  id: number;
  title: string;
  status: string;
  dueAt: string | null;
  pointsPossible: number | null;
  courseId: number;
  courseName: string;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-yellow-200 text-yellow-900",
    published: "bg-green-100 text-green-800",
    closed: "bg-red-100 text-red-800",
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

export default function QuizLibraryPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [rows, setRows] = useState<QuizRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const courseList = await apiFetch<Course[]>("/api/v1/courses");
        setCourses(courseList);

        const byCourse = await Promise.all(
          courseList.map(async (course) => {
            try {
              const quizzes = await apiFetch<Quiz[]>(`/api/v1/courses/${course.id}/quizzes`);
              return quizzes.map((quiz) => ({
                id: quiz.id,
                title: quiz.title,
                status: quiz.status,
                dueAt: quiz.due_at,
                pointsPossible: quiz.points_possible,
                courseId: course.id,
                courseName: course.name,
              }));
            } catch {
              return [];
            }
          }),
        );

        setRows(byCourse.flat());
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (courseFilter !== "all" && row.courseId !== Number(courseFilter)) return false;
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (searchQuery && !row.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [courseFilter, rows, searchQuery, statusFilter]);

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Quiz Library</h1>
            <Link
              href="/assess/quizzes/new"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              New Quiz
            </Link>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="all">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </select>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search quizzes..."
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading quizzes...</p>
          ) : filteredRows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
              <p className="text-sm text-gray-500">No quizzes found for the current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-700">Title</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Course</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Due</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/assess/quizzes/${row.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {row.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{row.courseName}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {row.dueAt ? new Date(row.dueAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {row.pointsPossible != null ? row.pointsPossible : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
