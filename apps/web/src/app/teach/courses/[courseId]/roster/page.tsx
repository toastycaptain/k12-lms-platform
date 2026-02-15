"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch } from "@/lib/api";

interface Course {
  id: number;
  name: string;
  sections?: { id: number; name: string }[];
}

interface Enrollment {
  id: number;
  user_id: number;
  section_id: number;
  role: string;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

const TEACHER_ROLES = ["admin", "curriculum_lead", "teacher"];

export default function CourseRosterPage() {
  const params = useParams();
  const courseId = String(params.courseId);

  const [course, setCourse] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [usersById, setUsersById] = useState<Record<number, User>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const [courseData, users] = await Promise.all([
        apiFetch<Course>(`/api/v1/courses/${courseId}`),
        apiFetch<User[]>("/api/v1/users"),
      ]);
      setCourse(courseData);
      setUsersById(
        users.reduce<Record<number, User>>((accumulator, user) => {
          accumulator[user.id] = user;
          return accumulator;
        }, {}),
      );

      const sections = courseData.sections || [];
      const enrollmentLists = await Promise.all(
        sections.map((section) =>
          apiFetch<Enrollment[]>(`/api/v1/enrollments?section_id=${section.id}`),
        ),
      );
      setEnrollments(enrollmentLists.flat());
    } catch {
      setCourse(null);
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const studentRows = useMemo(() => {
    return enrollments
      .filter((enrollment) => enrollment.role === "student")
      .map((enrollment) => {
        const user = usersById[enrollment.user_id];
        const section = (course?.sections || []).find(
          (entry) => entry.id === enrollment.section_id,
        );
        return {
          id: enrollment.id,
          name: user
            ? `${user.first_name} ${user.last_name}`.trim()
            : `User #${enrollment.user_id}`,
          email: user?.email || "",
          sectionName: section?.name || "Unknown section",
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [course?.sections, enrollments, usersById]);

  return (
    <ProtectedRoute requiredRoles={TEACHER_ROLES}>
      <AppShell>
        <div className="mx-auto max-w-4xl space-y-6">
          <div>
            <Link
              href={`/teach/courses/${courseId}`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              &larr; Back to Course
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              {course?.name || "Course"} Roster
            </h1>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading roster...</p>
          ) : studentRows.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
              No students enrolled.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 font-semibold text-gray-700">Student</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Email</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Section</th>
                  </tr>
                </thead>
                <tbody>
                  {studentRows.map((row) => (
                    <tr key={row.id} className="border-b last:border-b-0">
                      <td className="px-4 py-3 text-gray-900">{row.name}</td>
                      <td className="px-4 py-3 text-gray-600">{row.email}</td>
                      <td className="px-4 py-3 text-gray-600">{row.sectionName}</td>
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
