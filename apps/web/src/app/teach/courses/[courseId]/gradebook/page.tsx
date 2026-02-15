"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch } from "@/lib/api";

interface GradebookRow {
  user_id: number;
  assignment_id: number;
  grade: string | null;
  status: string;
}

interface Assignment {
  id: number;
  title: string;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
}

const TEACHER_ROLES = ["admin", "curriculum_lead", "teacher"];

export default function GradebookPage() {
  const params = useParams();
  const courseId = String(params.courseId);

  const [rows, setRows] = useState<GradebookRow[]>([]);
  const [assignmentsById, setAssignmentsById] = useState<Record<number, Assignment>>({});
  const [usersById, setUsersById] = useState<Record<number, User>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [gradebook, assignments, users] = await Promise.all([
        apiFetch<GradebookRow[]>(`/api/v1/courses/${courseId}/gradebook`),
        apiFetch<Assignment[]>(`/api/v1/courses/${courseId}/assignments`),
        apiFetch<User[]>("/api/v1/users"),
      ]);

      setRows(gradebook);
      setAssignmentsById(
        assignments.reduce<Record<number, Assignment>>((accumulator, assignment) => {
          accumulator[assignment.id] = assignment;
          return accumulator;
        }, {}),
      );
      setUsersById(
        users.reduce<Record<number, User>>((accumulator, user) => {
          accumulator[user.id] = user;
          return accumulator;
        }, {}),
      );
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const displayRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const userA = usersById[a.user_id];
      const userB = usersById[b.user_id];
      const nameA = userA ? `${userA.last_name} ${userA.first_name}` : String(a.user_id);
      const nameB = userB ? `${userB.last_name} ${userB.first_name}` : String(b.user_id);
      return nameA.localeCompare(nameB);
    });
  }, [rows, usersById]);

  return (
    <ProtectedRoute requiredRoles={TEACHER_ROLES}>
      <AppShell>
        <div className="mx-auto max-w-5xl space-y-6">
          <div>
            <Link
              href={`/teach/courses/${courseId}`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              &larr; Back to Course
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">Gradebook</h1>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading gradebook...</p>
          ) : displayRows.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
              No gradebook records yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 font-semibold text-gray-700">Student</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Assignment</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row, index) => {
                    const user = usersById[row.user_id];
                    const assignment = assignmentsById[row.assignment_id];
                    return (
                      <tr
                        key={`${row.user_id}-${row.assignment_id}-${index}`}
                        className="border-b last:border-b-0"
                      >
                        <td className="px-4 py-3 text-gray-900">
                          {user ? `${user.first_name} ${user.last_name}` : `User #${row.user_id}`}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {assignment?.title || `Assignment #${row.assignment_id}`}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{row.status}</td>
                        <td className="px-4 py-3 text-gray-600">{row.grade || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
