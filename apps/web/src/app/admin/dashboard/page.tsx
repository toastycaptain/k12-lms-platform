"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { EmptyState } from "@k12/ui";

interface UserRow {
  id: number;
}

interface CourseRow {
  id: number;
}

interface IntegrationConfig {
  id: number;
  provider: string;
  status: string;
}

interface SyncRun {
  id: number;
  sync_type: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
}

interface AuditLogRow {
  id: number;
  event_type: string;
  created_at: string;
  actor_id: number | null;
}

interface LtiRegistrationRow {
  id: number;
  status: string;
}

type ProviderKey = "google_classroom" | "oneroster";

const PROVIDER_LABELS: Record<ProviderKey, string> = {
  google_classroom: "Google Classroom",
  oneroster: "OneRoster",
};

function statusClass(status: string) {
  switch (status) {
    case "active":
    case "completed":
      return "bg-green-100 text-green-800";
    case "running":
      return "bg-blue-100 text-blue-800";
    case "failed":
    case "error":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [configs, setConfigs] = useState<IntegrationConfig[]>([]);
  const [ltiRegistrations, setLtiRegistrations] = useState<LtiRegistrationRow[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLogRow[]>([]);
  const [latestRunsByProvider, setLatestRunsByProvider] = useState<Record<string, SyncRun | null>>(
    {},
  );
  const [loading, setLoading] = useState(true);

  const canAccess = user?.roles?.includes("admin") || user?.roles?.includes("curriculum_lead");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [userRows, courseRows, integrationRows, logs, ltiRows] = await Promise.all([
          apiFetch<UserRow[]>("/api/v1/users"),
          apiFetch<CourseRow[]>("/api/v1/courses"),
          apiFetch<IntegrationConfig[]>("/api/v1/integration_configs"),
          apiFetch<AuditLogRow[]>("/api/v1/audit_logs?limit=10"),
          apiFetch<LtiRegistrationRow[]>("/api/v1/lti_registrations"),
        ]);

        setUsers(userRows);
        setCourses(courseRows);
        setConfigs(integrationRows);
        setRecentLogs(logs);
        setLtiRegistrations(ltiRows);

        const runsByProvider: Record<string, SyncRun | null> = {};
        await Promise.all(
          integrationRows.map(async (config) => {
            try {
              const runs = await apiFetch<SyncRun[]>(
                `/api/v1/integration_configs/${config.id}/sync_runs`,
              );
              runsByProvider[config.provider] = runs[0] || null;
            } catch {
              runsByProvider[config.provider] = null;
            }
          }),
        );
        setLatestRunsByProvider(runsByProvider);
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, []);

  const activeIntegrations = useMemo(
    () => configs.filter((row) => row.status === "active").length,
    [configs],
  );

  const ltiStatus = useMemo(() => {
    if (ltiRegistrations.length === 0) return "inactive";
    return ltiRegistrations.some((row) => row.status === "active") ? "active" : "inactive";
  }, [ltiRegistrations]);

  if (!canAccess) {
    return (
      <ProtectedRoute>
        <AppShell>
          <p className="text-gray-500">Access restricted to administrators and curriculum leads.</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

          {loading ? (
            <DashboardSkeleton />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs text-gray-500">Total Users</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{users.length}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs text-gray-500">Total Courses</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{courses.length}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs text-gray-500">Active Integrations</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{activeIntegrations}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs text-gray-500">Recent Audit Events</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{recentLogs.length}</p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-gray-900">Quick Links</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href="/admin/users"
                    className="rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    Users & Roles
                  </Link>
                  <Link
                    href="/admin/school"
                    className="rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    School Setup
                  </Link>
                  <Link
                    href="/admin/integrations"
                    className="rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    Integrations
                  </Link>
                  <Link
                    href="/admin/ai"
                    className="rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    AI Settings
                  </Link>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {(["google_classroom", "oneroster"] as ProviderKey[]).map((provider) => {
                  const config = configs.find((row) => row.provider === provider);
                  const run = latestRunsByProvider[provider];
                  return (
                    <div key={provider} className="rounded-lg border border-gray-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {PROVIDER_LABELS[provider]}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${statusClass(config?.status || "inactive")}`}
                        >
                          {config?.status || "inactive"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        {run
                          ? `Latest sync: ${run.sync_type} (${run.status})`
                          : "No sync history yet."}
                      </p>
                    </div>
                  );
                })}

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">LTI</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${statusClass(ltiStatus)}`}>
                      {ltiStatus}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Registrations: {ltiRegistrations.length}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-gray-900">Recent Audit Logs</h2>
                <div className="mt-3 space-y-2">
                  {recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-700"
                    >
                      <p className="font-medium text-gray-900">{log.event_type}</p>
                      <p className="mt-0.5 text-gray-500">
                        Actor: {log.actor_id || "system"} ·{" "}
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {recentLogs.length === 0 && (
                    <EmptyState
                      title="No audit entries found"
                      description="Recent audit log entries will appear here."
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
