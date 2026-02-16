"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import { Pagination } from "@/components/Pagination";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { EmptyState } from "@/components/EmptyState";

interface Course {
  id: number;
  name: string;
  code: string;
  sections?: Section[];
}

interface Section {
  id: number;
  name: string;
  term_id: number;
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
}

interface Term {
  id: number;
  name: string;
}

interface CourseCard {
  id: number;
  name: string;
  code: string;
  teacherName: string;
  sectionLabel: string;
  termLabel: string;
}

const LEARN_ROLES = ["admin", "teacher", "student"];

function displayName(user: User | undefined): string {
  if (!user) return "Teacher";
  const value = `${user.first_name} ${user.last_name}`.trim();
  return value || "Teacher";
}

export default function LearnCoursesPage() {
  const [cards, setCards] = useState<CourseCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [courses, users, terms] = await Promise.all([
        apiFetch<Course[]>(`/api/v1/courses?page=${page}&per_page=${perPage}`),
        apiFetch<User[]>("/api/v1/users"),
        apiFetch<Term[]>("/api/v1/terms"),
      ]);

      const usersById = users.reduce<Record<number, User>>((accumulator, user) => {
        accumulator[user.id] = user;
        return accumulator;
      }, {});

      const termsById = terms.reduce<Record<number, Term>>((accumulator, term) => {
        accumulator[term.id] = term;
        return accumulator;
      }, {});

      const nextCards = await Promise.all(
        courses.map(async (course) => {
          const sections = course.sections || [];
          const enrollmentsPerSection = await Promise.all(
            sections.map((section) =>
              apiFetch<Enrollment[]>(`/api/v1/enrollments?section_id=${section.id}`),
            ),
          );
          const allEnrollments = enrollmentsPerSection.flat();

          const teacherEnrollment = allEnrollments.find(
            (enrollment) => enrollment.role === "teacher",
          );
          const teacherName = displayName(usersById[teacherEnrollment?.user_id || -1]);

          const sectionLabel = sections.map((section) => section.name).join(", ") || "No section";
          const termLabel =
            Array.from(
              new Set(sections.map((section) => termsById[section.term_id]?.name).filter(Boolean)),
            ).join(", ") || "No term";

          return {
            id: course.id,
            name: course.name,
            code: course.code,
            teacherName,
            sectionLabel,
            termLabel,
          } satisfies CourseCard;
        }),
      );

      setCards(nextCards);
      setTotalPages(courses.length < perPage ? page : page + 1);
    } catch {
      setError("Unable to load courses.");
    } finally {
      setLoading(false);
    }
  }, [page, perPage]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return (
    <ProtectedRoute requiredRoles={LEARN_ROLES}>
      <AppShell>
        <div className="space-y-6">
          <header>
            <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
            <p className="mt-1 text-sm text-gray-500">Your enrolled courses.</p>
          </header>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {loading ? (
            <ListSkeleton />
          ) : cards.length === 0 ? (
            <EmptyState
              title="No courses found"
              description="You are not enrolled in any courses."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {cards.map((course) => (
                <Link
                  key={course.id}
                  href={`/learn/courses/${course.id}`}
                  className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-sm"
                >
                  <p className="text-sm font-semibold text-gray-900">{course.name}</p>
                  <p className="mt-1 text-xs text-gray-500">{course.code}</p>
                  <p className="mt-2 text-xs text-gray-600">Teacher: {course.teacherName}</p>
                  <p className="text-xs text-gray-600">Section: {course.sectionLabel}</p>
                  <p className="text-xs text-gray-600">Term: {course.termLabel}</p>
                </Link>
              ))}
            </div>
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
