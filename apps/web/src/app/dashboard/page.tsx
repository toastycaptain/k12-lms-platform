"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { EmptyState } from "@/components/EmptyState";

interface UnitPlan {
  id: number;
  title: string;
  status: string;
  course_id: number;
  created_at: string;
}

interface Course {
  id: number;
  name: string;
  code: string;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-yellow-200 text-yellow-900",
    published: "bg-green-100 text-green-800",
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

export default function DashboardPage() {
  const { user } = useAuth();
  const [unitPlans, setUnitPlans] = useState<UnitPlan[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [units, allCourses] = await Promise.all([
          apiFetch<UnitPlan[]>("/api/v1/unit_plans"),
          apiFetch<Course[]>("/api/v1/courses"),
        ]);
        setUnitPlans(units.slice(0, 5));
        setCourses(allCourses);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {user?.first_name} {user?.last_name}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Here&apos;s an overview of your planning activity.
            </p>
          </div>

          {/* Recent Unit Plans */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Unit Plans</h2>
              <Link href="/plan/units" className="text-sm text-blue-600 hover:text-blue-800">
                View all
              </Link>
            </div>
            {loading ? (
              <DashboardSkeleton />
            ) : unitPlans.length === 0 ? (
              <EmptyState
                title="No unit plans yet."
                description="Create your first unit plan to get started."
                actionLabel="Create Unit Plan"
                actionHref="/plan/units/new"
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {unitPlans.map((unit) => (
                  <Link
                    key={unit.id}
                    href={`/plan/units/${unit.id}`}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md"
                  >
                    <h3 className="font-medium text-gray-900">{unit.title}</h3>
                    <div className="mt-2">
                      <StatusBadge status={unit.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Courses */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Your Courses</h2>
            {loading ? (
              <DashboardSkeleton />
            ) : courses.length === 0 ? (
              <EmptyState
                title="No courses found."
                description="Courses will appear here once they are assigned."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <h3 className="font-medium text-gray-900">{course.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{course.code}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
