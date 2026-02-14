"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/lib/api";

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
    draft: "bg-yellow-100 text-yellow-800",
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

export default function SubmissionsInboxPage() {
  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterCourse, setFilterCourse] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAssignment, setFilterAssignment] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const coursesData = await apiFetch<Course[]>("/api/v1/courses");
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
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredRows = rows.filter((row) => {
    if (filterCourse && !row.courseName.includes(filterCourse)) return false;
    if (filterStatus && row.status !== filterStatus) return false;
    if (filterAssignment && row.assignmentTitle !== filterAssignment) return false;
    if (search && !row.studentName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pendingCount = rows.filter((r) => r.status === "submitted").length;
  const gradedToday = rows.filter(
    (r) => r.status === "graded" || r.status === "returned",
  ).length;
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
            <p className="mt-1 text-sm text-gray-500">All student submissions across your courses</p>
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
            <div className="text-sm text-gray-500">Loading submissions...</div>
          ) : filteredRows.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <p className="text-sm text-gray-500">No submissions match your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-700">Student</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Assignment</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Course</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Submitted</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/teach/submissions/${row.id}/grade`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {row.studentName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-900">{row.assignmentTitle}</td>
                      <td className="px-4 py-3 text-gray-500">{row.courseName}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {row.submittedAt ? new Date(row.submittedAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-900">{row.grade || "-"}</td>
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
