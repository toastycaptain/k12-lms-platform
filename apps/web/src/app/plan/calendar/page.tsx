"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface Course {
  id: number;
  name: string;
}

interface UnitPlan {
  id: number;
  title: string;
  course_id: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface Assignment {
  id: number;
  title: string;
  course_id: number;
  due_at: string | null;
  due_date?: string | null;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const UNIT_COLOR_CLASSES = [
  "bg-blue-100 text-blue-800",
  "bg-emerald-100 text-emerald-800",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-800",
  "bg-indigo-100 text-indigo-800",
  "bg-cyan-100 text-cyan-800",
];
const TEACHER_ROLES = ["admin", "curriculum_lead", "teacher"];

function toDateOnly(value: string | Date): Date {
  const date = value instanceof Date ? value : new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function startOfWeek(date: Date): Date {
  return addDays(date, -date.getDay());
}

function endOfWeek(date: Date): Date {
  return addDays(date, 6 - date.getDay());
}

function dateInRange(day: Date, start: Date, end: Date): boolean {
  return day >= start && day <= end;
}

function formatMonthTitle(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export default function PlanningCalendarPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [courses, setCourses] = useState<Course[]>([]);
  const [units, setUnits] = useState<UnitPlan[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const query = selectedCourseId ? `?course_id=${selectedCourseId}` : "";

    try {
      const [courseData, unitData, assignmentData] = await Promise.all([
        apiFetch<Course[]>("/api/v1/courses"),
        apiFetch<UnitPlan[]>(`/api/v1/unit_plans${query}`),
        apiFetch<Assignment[]>(`/api/v1/assignments${query}`),
      ]);

      setCourses(courseData);
      setUnits(unitData);
      setAssignments(assignmentData);
    } catch {
      setError("Unable to load planning calendar data.");
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart);
    const gridEnd = endOfWeek(monthEnd);

    const days: Date[] = [];
    let cursor = gridStart;
    while (cursor <= gridEnd) {
      days.push(cursor);
      cursor = addDays(cursor, 1);
    }
    return days;
  }, [currentMonth]);

  const unitsWithRanges = useMemo(() => {
    return units.map((unit) => {
      const fallback = toDateOnly(unit.created_at);
      const startDate = unit.start_date ? toDateOnly(unit.start_date) : fallback;
      const endDate = unit.end_date ? toDateOnly(unit.end_date) : startDate;

      return {
        ...unit,
        startDate,
        endDate: endDate < startDate ? startDate : endDate,
        colorClass: UNIT_COLOR_CLASSES[unit.id % UNIT_COLOR_CLASSES.length],
      };
    });
  }, [units]);

  const assignmentDueDates = useMemo(() => {
    return assignments
      .map((assignment) => {
        const dueSource = assignment.due_at || assignment.due_date;
        if (!dueSource) return null;

        return {
          ...assignment,
          dueDate: toDateOnly(dueSource),
        };
      })
      .filter((assignment): assignment is Assignment & { dueDate: Date } => Boolean(assignment));
  }, [assignments]);

  return (
    <ProtectedRoute requiredRoles={TEACHER_ROLES}>
      <AppShell>
        <div className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Planning Calendar</h1>
              <p className="text-sm text-gray-500">
                {user
                  ? `Timeline for ${user.first_name} ${user.last_name}`
                  : "Timeline for your units and assignments"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedCourseId}
                onChange={(event) => setSelectedCourseId(event.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">All Courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setCurrentMonth(startOfMonth(new Date()))}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Today
              </button>
              <button
                onClick={() =>
                  setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                }
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                }
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-4 py-3">
              <h2 className="text-lg font-semibold text-gray-900">
                {formatMonthTitle(currentMonth)}
              </h2>
            </div>

            {loading ? (
              <div className="p-6 text-sm text-gray-500">Loading calendar...</div>
            ) : error ? (
              <div className="m-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
            ) : (
              <div>
                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                  {WEEKDAY_LABELS.map((label) => (
                    <div
                      key={label}
                      className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      {label}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7">
                  {calendarDays.map((day) => {
                    const dayUnits = unitsWithRanges.filter((unit) =>
                      dateInRange(day, unit.startDate, unit.endDate),
                    );
                    const dayAssignments = assignmentDueDates.filter((assignment) =>
                      isSameDay(assignment.dueDate, day),
                    );
                    const inCurrentMonth = isSameMonth(day, currentMonth);
                    const isToday = isSameDay(day, new Date());

                    return (
                      <div
                        key={day.toISOString()}
                        className={`min-h-32 border-b border-r border-gray-100 px-2 py-2 ${inCurrentMonth ? "bg-white" : "bg-gray-50"}`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                              isToday
                                ? "bg-blue-600 text-white"
                                : inCurrentMonth
                                  ? "text-gray-700"
                                  : "text-gray-400"
                            }`}
                          >
                            {day.getDate()}
                          </span>
                          {dayAssignments.length > 0 && (
                            <div className="flex items-center gap-1">
                              {dayAssignments.slice(0, 4).map((assignment) => (
                                <button
                                  key={assignment.id}
                                  type="button"
                                  title={assignment.title}
                                  onClick={() =>
                                    router.push(
                                      `/teach/courses/${assignment.course_id}/assignments/${assignment.id}`,
                                    )
                                  }
                                  className="h-2.5 w-2.5 rounded-full bg-indigo-500 hover:bg-indigo-600"
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          {dayUnits.slice(0, 3).map((unit) => {
                            const isStart = isSameDay(day, unit.startDate);
                            const isEnd = isSameDay(day, unit.endDate);

                            return (
                              <button
                                key={`${unit.id}-${day.toISOString()}`}
                                type="button"
                                onClick={() => router.push(`/plan/units/${unit.id}`)}
                                className={`w-full truncate px-2 py-1 text-left text-xs font-medium hover:opacity-90 ${unit.colorClass} ${
                                  isStart && isEnd
                                    ? "rounded"
                                    : isStart
                                      ? "rounded-l rounded-r-none"
                                      : isEnd
                                        ? "rounded-r rounded-l-none"
                                        : "rounded-none"
                                }`}
                              >
                                {unit.title}
                              </button>
                            );
                          })}
                          {dayUnits.length > 3 && (
                            <div className="px-1 text-[11px] text-gray-400">
                              +{dayUnits.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" /> Assignment due date
            </span>
            <span>Click a unit bar to open the unit planner.</span>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
