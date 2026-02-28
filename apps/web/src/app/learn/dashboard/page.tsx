"use client";

import { useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { EmptyState } from "@k12/ui";
import { swrConfig } from "@/lib/swr";

interface Assignment {
  id: number;
  course_id: number;
  title: string;
  due_at: string | null;
  points_possible: string | null;
}

interface Submission {
  id: number;
  assignment_id: number;
  status: string;
  grade: string | null;
  feedback: string | null;
  graded_at: string | null;
  updated_at: string;
}

interface Course {
  id: number;
  name: string;
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

interface CourseModule {
  id: number;
  status: string;
}

interface ModuleProgressResponse {
  total_items: number;
  current_user_completed_count: number;
}

interface CourseCardData {
  course: Course;
  teacherName: string;
  sectionName: string;
  completed: number;
  total: number;
}

interface LearnDashboardData {
  assignments: Assignment[];
  recentGrades: Submission[];
  courses: Course[];
  courseCards: CourseCardData[];
  classesToday: ClassToday[];
}

interface ClassToday {
  section_id: number;
  section_name: string;
  course_id: number;
  course_name: string;
  weekday: number;
  start_at: string;
  end_at: string;
  location: string | null;
  teachers: { id: number; name: string }[];
}

const LEARN_ROLES = ["admin", "teacher", "student"];

function countdownLabel(dateValue: string): string {
  const now = new Date();
  const due = new Date(dateValue);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Due today";
  if (diffDays === 1) return "Due in 1 day";
  return `Due in ${diffDays} days`;
}

function displayName(user: User | undefined): string {
  if (!user) return "Teacher";
  const name = `${user.first_name} ${user.last_name}`.trim();
  return name || "Teacher";
}

const QUICK_LINKS = [
  { label: "To-dos", href: "/learn/todos", description: "Assignments, quizzes, and active goals" },
  { label: "Goals", href: "/learn/goals", description: "Create and track personal goals" },
  { label: "Calendar", href: "/learn/calendar", description: "View your calendar events" },
  { label: "Portfolio", href: "/learn/portfolio", description: "Coming soon placeholder" },
];

export default function LearnDashboardPage() {
  const { user } = useAuth();
  const {
    data,
    error: loadError,
    isLoading,
  } = useSWR<LearnDashboardData>(
    user ? `learn-dashboard-data-${user.id}` : null,
    async () => {
      if (!user) {
        return {
          assignments: [],
          recentGrades: [],
          courses: [],
          courseCards: [],
          classesToday: [],
        } satisfies LearnDashboardData;
      }

      const [courseData, assignmentData, gradedSubmissions, users, classesToday] =
        await Promise.all([
          apiFetch<Course[]>("/api/v1/courses"),
          apiFetch<Assignment[]>("/api/v1/assignments"),
          apiFetch<Submission[]>("/api/v1/submissions?status=graded"),
          apiFetch<User[]>("/api/v1/users"),
          apiFetch<ClassToday[]>(`/api/v1/students/${user.id}/classes_today`),
        ]);

      const usersById = users.reduce<Record<number, User>>((accumulator, entry) => {
        accumulator[entry.id] = entry;
        return accumulator;
      }, {});

      const cards = await Promise.all(
        courseData.map(async (course) => {
          const sections = course.sections || [];
          const enrollmentsPerSection = await Promise.all(
            sections.map((section) =>
              apiFetch<Enrollment[]>(`/api/v1/enrollments?section_id=${section.id}`),
            ),
          );

          const teacherEnrollment = enrollmentsPerSection
            .flat()
            .find((enrollment) => enrollment.role === "teacher");
          const teacherName = displayName(usersById[teacherEnrollment?.user_id || -1]);
          const sectionName = sections.map((section) => section.name).join(", ") || "No section";

          const modules = await apiFetch<CourseModule[]>(
            `/api/v1/courses/${course.id}/course_modules`,
          );
          const publishedModules = modules.filter(
            (moduleEntry) => moduleEntry.status === "published",
          );

          const progressResponses = await Promise.all(
            publishedModules.map((moduleEntry) =>
              apiFetch<ModuleProgressResponse>(`/api/v1/course_modules/${moduleEntry.id}/progress`),
            ),
          );

          const completed = progressResponses.reduce(
            (sum, progress) => sum + progress.current_user_completed_count,
            0,
          );
          const total = progressResponses.reduce((sum, progress) => sum + progress.total_items, 0);

          return {
            course,
            teacherName,
            sectionName,
            completed,
            total,
          } satisfies CourseCardData;
        }),
      );

      return {
        assignments: assignmentData,
        recentGrades: gradedSubmissions,
        courses: courseData,
        courseCards: cards,
        classesToday,
      } satisfies LearnDashboardData;
    },
    swrConfig,
  );

  const assignments = data?.assignments ?? [];
  const recentGrades = data?.recentGrades ?? [];
  const courses = data?.courses ?? [];
  const courseCards = data?.courseCards ?? [];
  const classesToday = data?.classesToday ?? [];
  const loading = isLoading && !data;
  const error = loadError ? "Unable to load student dashboard." : null;

  const assignmentById = useMemo(
    () =>
      assignments.reduce<Record<number, Assignment>>((accumulator, assignment) => {
        accumulator[assignment.id] = assignment;
        return accumulator;
      }, {}),
    [assignments],
  );

  const courseById = useMemo(
    () =>
      courses.reduce<Record<number, Course>>((accumulator, course) => {
        accumulator[course.id] = course;
        return accumulator;
      }, {}),
    [courses],
  );

  const upcomingAssignments = useMemo(() => {
    const now = new Date();
    return assignments
      .filter((assignment) => assignment.due_at && new Date(assignment.due_at) > now)
      .sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime())
      .slice(0, 5);
  }, [assignments]);

  const latestGrades = useMemo(() => {
    return [...recentGrades]
      .sort((a, b) => {
        const aDate = a.graded_at || a.updated_at;
        const bDate = b.graded_at || b.updated_at;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      })
      .slice(0, 5);
  }, [recentGrades]);

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <ProtectedRoute requiredRoles={LEARN_ROLES}>
      <AppShell>
        <div className="space-y-8">
          <header>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.first_name || "Student"}
            </h1>
            <p className="mt-1 text-sm text-gray-500">{todayLabel}</p>
          </header>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Quick Access</h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-sm"
                >
                  <p className="text-sm font-semibold text-gray-900">{link.label}</p>
                  <p className="mt-1 text-xs text-gray-500">{link.description}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Classes</h2>
            {loading ? (
              <DashboardSkeleton />
            ) : classesToday.length === 0 ? (
              <EmptyState
                title="No classes scheduled today"
                description="Enjoy your open study time."
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {classesToday.map((entry) => (
                  <Link
                    key={`${entry.section_id}-${entry.start_at}`}
                    href={`/learn/courses/${entry.course_id}`}
                    className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-sm"
                  >
                    <p className="text-sm font-semibold text-gray-900">{entry.course_name}</p>
                    <p className="mt-1 text-xs text-gray-500">{entry.section_name}</p>
                    <p className="mt-2 text-xs text-gray-600">
                      {new Date(entry.start_at).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date(entry.end_at).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Teacher: {entry.teachers.map((teacher) => teacher.name).join(", ") || "TBD"}
                    </p>
                    {entry.location ? (
                      <p className="mt-1 text-xs text-gray-500">Location: {entry.location}</p>
                    ) : null}
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Assignments</h2>
            </div>
            {loading ? (
              <DashboardSkeleton />
            ) : upcomingAssignments.length === 0 ? (
              <EmptyState title="No upcoming assignments" description="You're all caught up!" />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {upcomingAssignments.map((assignment) => {
                  const course = courseById[assignment.course_id];
                  return (
                    <Link
                      key={assignment.id}
                      href={`/learn/courses/${assignment.course_id}/assignments/${assignment.id}`}
                      className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-sm"
                    >
                      <p className="text-sm font-semibold text-gray-900">{assignment.title}</p>
                      <p className="mt-1 text-xs text-gray-500">{course?.name || "Course"}</p>
                      {assignment.due_at && (
                        <p className="mt-2 text-xs text-amber-700">
                          {new Date(assignment.due_at).toLocaleString()} -{" "}
                          {countdownLabel(assignment.due_at)}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {assignment.points_possible || "-"} points
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Recent Grades</h2>
            {loading ? (
              <DashboardSkeleton />
            ) : latestGrades.length === 0 ? (
              <EmptyState
                title="No graded work yet"
                description="Grades will appear here once assignments are graded."
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {latestGrades.map((submission) => {
                  const assignment = assignmentById[submission.assignment_id];
                  if (!assignment) return null;

                  return (
                    <Link
                      key={submission.id}
                      href={`/learn/courses/${assignment.course_id}/assignments/${assignment.id}`}
                      className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-sm"
                    >
                      <p className="text-sm font-semibold text-gray-900">{assignment.title}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Grade: {submission.grade || "-"}/{assignment.points_possible || "-"}
                      </p>
                      <p className="mt-2 line-clamp-2 text-xs text-gray-600">
                        {submission.feedback || "No feedback provided."}
                      </p>
                      <p className="mt-2 text-xs text-gray-400">
                        {new Date(
                          submission.graded_at || submission.updated_at,
                        ).toLocaleDateString()}
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">My Courses</h2>
              <Link href="/learn/courses" className="text-sm text-blue-600 hover:text-blue-800">
                View all
              </Link>
            </div>
            {loading ? (
              <DashboardSkeleton />
            ) : courseCards.length === 0 ? (
              <EmptyState title="No courses" description="You are not enrolled in any courses." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {courseCards.map((card) => (
                  <Link
                    key={card.course.id}
                    href={`/learn/courses/${card.course.id}`}
                    className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-sm"
                  >
                    <p className="text-sm font-semibold text-gray-900">{card.course.name}</p>
                    <p className="mt-1 text-xs text-gray-500">Teacher: {card.teacherName}</p>
                    <p className="text-xs text-gray-500">Section: {card.sectionName}</p>
                    <p className="mt-2 text-xs text-gray-600">
                      Module progress: {card.completed} of {card.total} complete
                    </p>
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
