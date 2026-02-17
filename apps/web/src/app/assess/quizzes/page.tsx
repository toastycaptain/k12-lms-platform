"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ResponsiveTable } from "@/components/ResponsiveTable";
import { apiFetch } from "@/lib/api";
import { Pagination } from "@/components/Pagination";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { type Course, useCourses } from "@/hooks/useCourses";
import { swrConfig } from "@/lib/swr";

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
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: courseData, isLoading: coursesLoading } = useCourses({
    page,
    per_page: perPage,
  });
  const courses: Course[] = courseData ?? [];
  const totalPages = courses.length < perPage ? page : page + 1;

  const courseKey = courses.map((course) => course.id).join(",");
  const { data: rowData, isLoading: rowsLoading } = useSWR<QuizRow[]>(
    courses.length > 0 ? ["quiz-library-rows", courseKey] : null,
    async () => {
      const byCourse = await Promise.all(
        courses.map(async (course) => {
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

      return byCourse.flat();
    },
    swrConfig,
  );
  const rows = rowData ?? [];
  const loading =
    (coursesLoading && !courseData) || (courses.length > 0 && rowsLoading && !rowData);

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
            <ListSkeleton />
          ) : filteredRows.length === 0 ? (
            <EmptyState
              title="No quizzes found"
              description="No quizzes found for the current filters."
            />
          ) : (
            <ResponsiveTable
              caption="Quiz library rows"
              data={filteredRows}
              keyExtractor={(row) => row.id}
              columns={[
                {
                  key: "title",
                  header: "Title",
                  primary: true,
                  render: (row) => (
                    <Link
                      href={`/assess/quizzes/${row.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {row.title}
                    </Link>
                  ),
                },
                {
                  key: "course",
                  header: "Course",
                  render: (row) => row.courseName,
                },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => <StatusBadge status={row.status} />,
                },
                {
                  key: "due",
                  header: "Due",
                  render: (row) => (row.dueAt ? new Date(row.dueAt).toLocaleDateString() : "-"),
                },
                {
                  key: "points",
                  header: "Points",
                  render: (row) => (row.pointsPossible != null ? row.pointsPossible : "-"),
                },
              ]}
            />
          )}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            perPage={perPage}
            onPerPageChange={(nextPerPage) => {
              setPerPage(nextPerPage);
              setPage(1);
            }}
          />
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
