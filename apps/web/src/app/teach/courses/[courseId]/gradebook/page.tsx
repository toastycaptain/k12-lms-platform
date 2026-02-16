"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import { GradebookSkeleton } from "@/components/skeletons/GradebookSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { ResponsiveTable } from "@/components/ResponsiveTable";

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

  const columns = useMemo(
    () => [
      {
        key: "student",
        header: "Student",
        primary: true,
        render: (row: GradebookRow) => {
          const user = usersById[row.user_id];
          return user ? `${user.first_name} ${user.last_name}` : `User #${row.user_id}`;
        },
      },
      {
        key: "assignment",
        header: "Assignment",
        render: (row: GradebookRow) =>
          assignmentsById[row.assignment_id]?.title || `Assignment #${row.assignment_id}`,
      },
      {
        key: "status",
        header: "Status",
        render: (row: GradebookRow) => row.status,
      },
      {
        key: "grade",
        header: "Grade",
        render: (row: GradebookRow) => row.grade || "-",
      },
    ],
    [assignmentsById, usersById],
  );

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
            <GradebookSkeleton />
          ) : displayRows.length === 0 ? (
            <EmptyState
              title="No gradebook records yet"
              description="Grades will appear here as students submit assignments."
            />
          ) : (
            <ResponsiveTable
              columns={columns}
              data={displayRows}
              keyExtractor={(row) => `${row.user_id}-${row.assignment_id}-${row.status}`}
              caption="Gradebook records"
            />
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
