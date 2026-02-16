"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { ResponsiveTable } from "@/components/ResponsiveTable";
import { apiFetch } from "@/lib/api";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { Pagination } from "@/components/Pagination";

interface Course {
  id: number;
  name: string;
}

interface Assignment {
  id: number;
  title: string;
  course_id: number;
}

interface Submission {
  id: number;
  assignment_id: number;
  user_id: number;
  status: string;
  grade: string | null;
  submitted_at: string | null;
}

interface SubmissionRow {
  id: number;
  studentName: string;
  assignmentTitle: string;
  courseName: string;
  submittedAt: string | null;
  status: string;
  grade: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    submitted: "bg-blue-100 text-blue-800",
    graded: "bg-purple-100 text-purple-800",
    returned: "bg-green-100 text-green-800",
    draft: "bg-yellow-200 text-yellow-900",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-600"}`}
    >
      {status}
    </span>
  );
}

export default function SubmissionsInboxPage() {
  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [filterCourse, setFilterCourse] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAssignment, setFilterAssignment] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const coursesData = await apiFetch<Course[]>(
          `/api/v1/courses?page=${page}&per_page=${perPage}`,
        );
        setCourses(coursesData);

        const allRows: SubmissionRow[] = [];
        const allAssignments: Assignment[] = [];

        for (const course of coursesData) {
          const courseAssignments = await apiFetch<Assignment[]>(
            `/api/v1/courses/${course.id}/assignments`,
          );
          allAssignments.push(...courseAssignments);

          for (const assignment of courseAssignments) {
            const submissions = await apiFetch<Submission[]>(
              `/api/v1/assignments/${assignment.id}/submissions`,
            );
            for (const sub of submissions) {
              allRows.push({
                id: sub.id,
                studentName: `Student #${sub.user_id}`,
                assignmentTitle: assignment.title,
                courseName: course.name,
                submittedAt: sub.submitted_at,
                status: sub.status,
                grade: sub.grade,
              });
            }
          }
        }

        setAssignments(allAssignments);
        setRows(allRows);
        setTotalPages(coursesData.length < perPage ? page : page + 1);
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [page, perPage]);

  const filteredRows = rows.filter((row) => {
    if (filterCourse && !row.courseName.includes(filterCourse)) return false;
    if (filterStatus && row.status !== filterStatus) return false;
    if (filterAssignment && row.assignmentTitle !== filterAssignment) return false;
    if (search && !row.studentName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pendingCount = rows.filter((r) => r.status === "submitted").length;
  const gradedToday = rows.filter((r) => r.status === "graded" || r.status === "returned").length;
  const needsReview = rows.filter((r) => r.status === "submitted").length;

  const filteredAssignments = filterCourse
    ? assignments.filter((a) => {
        const course = courses.find((c) => c.name === filterCourse);
        return course && a.course_id === course.id;
      })
    : assignments;

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Submissions Inbox</h1>
            <p className="mt-1 text-sm text-gray-500">
              All student submissions across your courses
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{pendingCount}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{gradedToday}</p>
              <p className="text-xs text-gray-500">Graded</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{needsReview}</p>
              <p className="text-xs text-gray-500">Needs Review</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filterCourse}
              onChange={(e) => {
                setFilterCourse(e.target.value);
                setFilterAssignment("");
              }}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={filterAssignment}
              onChange={(e) => setFilterAssignment(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All Assignments</option>
              {filteredAssignments.map((a) => (
                <option key={a.id} value={a.title}>
                  {a.title}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="graded">Graded</option>
              <option value="returned">Returned</option>
            </select>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name..."
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          {/* Table */}
          {loading ? (
            <ListSkeleton />
          ) : filteredRows.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <p className="text-sm text-gray-500">No submissions match your filters</p>
            </div>
          ) : (
            <ResponsiveTable
              caption="Submission inbox rows"
              data={filteredRows}
              keyExtractor={(row) => row.id}
              columns={[
                {
                  key: "student",
                  header: "Student",
                  primary: true,
                  render: (row) => (
                    <Link
                      href={`/teach/submissions/${row.id}/grade`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {row.studentName}
                    </Link>
                  ),
                },
                {
                  key: "assignment",
                  header: "Assignment",
                  render: (row) => row.assignmentTitle,
                },
                {
                  key: "course",
                  header: "Course",
                  render: (row) => row.courseName,
                },
                {
                  key: "submitted_at",
                  header: "Submitted",
                  render: (row) =>
                    row.submittedAt ? new Date(row.submittedAt).toLocaleDateString() : "-",
                },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => <StatusBadge status={row.status} />,
                },
                {
                  key: "grade",
                  header: "Grade",
                  render: (row) => row.grade || "-",
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
