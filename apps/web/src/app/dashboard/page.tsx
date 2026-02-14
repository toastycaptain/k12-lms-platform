"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";

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
    draft: "bg-yellow-100 text-yellow-800",
    published: "bg-green-100 text-green-800",
    archived: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-600"}`}>
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
      } catch {
        // API may not be available in dev
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
            <p className="mt-1 text-sm text-gray-500">Here&apos;s an overview of your planning activity.</p>
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
              <p className="text-sm text-gray-500">Loading...</p>
            ) : unitPlans.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                <p className="text-sm text-gray-500">No unit plans yet.</p>
                <Link
                  href="/plan/units"
                  className="mt-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  Create your first unit plan
                </Link>
              </div>
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
              <p className="text-sm text-gray-500">Loading...</p>
            ) : courses.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                <p className="text-sm text-gray-500">No courses found.</p>
              </div>
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
