"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { EmptyState } from "@k12/ui";
import { Pagination } from "@k12/ui";
import { useCourses } from "@/hooks/useCourses";
import { useAppSWR } from "@/lib/swr";

interface Course {
  id: number;
  name: string;
  code: string;
  description?: string;
}

interface Section {
  id: number;
  name: string;
  course_id: number;
}

interface Enrollment {
  id: number;
  section_id: number;
  user_id: number;
  role: string;
}

interface CourseWithDetails extends Course {
  sectionName?: string;
  role?: string;
}

export default function CourseListPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const { data: courseData, isLoading: coursesLoading } = useCourses({
    page,
    per_page: perPage,
  });
  const { data: sectionsData, isLoading: sectionsLoading } =
    useAppSWR<Section[]>("/api/v1/sections");
  const { data: enrollmentsData, isLoading: enrollmentsLoading } =
    useAppSWR<Enrollment[]>("/api/v1/enrollments");

  const courses = useMemo(() => {
    if (!courseData || !sectionsData || !enrollmentsData) {
      return [];
    }

    const sectionMap = new Map(sectionsData.map((section) => [section.id, section]));
    const enrollmentByCourse = new Map<number, Enrollment>();
    for (const enrollment of enrollmentsData) {
      const section = sectionMap.get(enrollment.section_id);
      if (section) {
        enrollmentByCourse.set(section.course_id, enrollment);
      }
    }

    return courseData.map((course) => {
      const enrollment = enrollmentByCourse.get(course.id);
      const section = enrollment ? sectionMap.get(enrollment.section_id) : undefined;
      return {
        ...course,
        sectionName: section?.name,
        role: enrollment?.role,
      } satisfies CourseWithDetails;
    });
  }, [courseData, enrollmentsData, sectionsData]);

  const loading =
    (coursesLoading && !courseData) ||
    (sectionsLoading && !sectionsData) ||
    (enrollmentsLoading && !enrollmentsData);
  const totalPages = (courseData?.length ?? 0) < perPage ? page : page + 1;

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
            <p className="mt-1 text-sm text-gray-500">Courses you are enrolled in</p>
          </div>

          {loading ? (
            <ListSkeleton />
          ) : courses.length === 0 ? (
            <EmptyState
              title="No courses found"
              description="Courses will appear here once they are created or assigned to you."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/teach/courses/${course.id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <h3 className="text-base font-semibold text-gray-900">{course.name}</h3>
                  {course.code && <p className="mt-0.5 text-xs text-gray-400">{course.code}</p>}
                  {course.sectionName && (
                    <p className="mt-1 text-sm text-gray-500">{course.sectionName}</p>
                  )}
                  {course.role && (
                    <span
                      className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        course.role === "teacher"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {course.role}
                    </span>
                  )}
                  {course.description && (
                    <p className="mt-2 text-sm text-gray-500 line-clamp-2">{course.description}</p>
                  )}
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
