"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ResponsiveTable } from "@/components/ResponsiveTable";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";

interface IntegrationConfig {
  id: number;
  provider: string;
  status: string;
}

interface SyncRun {
  id: number;
  sync_type: string;
  direction: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  records_processed: number;
  records_succeeded: number;
  records_failed: number;
  error_message: string | null;
  triggered_by_id: number | null;
  created_at: string;
}

interface SyncLog {
  id: number;
  level: string;
  message: string;
  entity_type: string | null;
  entity_id: number | null;
  external_id: string | null;
  created_at: string;
}

interface SyncMapping {
  id: number;
  local_type: string;
  local_id: number;
  external_type: string;
  external_id: string;
  last_synced_at: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-gray-100 text-gray-600",
    running: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-600"}`}
    >
      {status}
    </span>
  );
}

function SyncTypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    course_sync: "Course",
    roster_sync: "Roster",
    coursework_push: "Coursework",
    grade_passback: "Grades",
  };
  return (
    <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
      {labels[type] || type}
    </span>
  );
}

function LevelIcon({ level }: { level: string }) {
  const colors: Record<string, string> = {
    info: "text-blue-500",
    warn: "text-yellow-500",
    error: "text-red-500",
  };
  return (
    <span className={`text-xs font-bold ${colors[level] || "text-gray-400"}`}>
      {level.toUpperCase()}
    </span>
  );
}

export default function SyncDashboardPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<IntegrationConfig | null>(null);
  const [runs, setRuns] = useState<SyncRun[]>([]);
  const [mappings, setMappings] = useState<SyncMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"runs" | "mappings">("runs");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [syncTypeFilter, setSyncTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [localTypeFilter, setLocalTypeFilter] = useState("all");

  // Expanded run for logs
  const [expandedRunId, setExpandedRunId] = useState<number | null>(null);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logLevelFilter, setLogLevelFilter] = useState("all");

  const canAccess = user?.roles?.includes("admin");

  useEffect(() => {
    fetchData();
  }, [page, perPage]);

  async function fetchData() {
    setLoading(true);
    try {
      const configs = await apiFetch<IntegrationConfig[]>("/api/v1/integration_configs");
      if (configs.length > 0) {
        const c = configs[0];
        setConfig(c);
        const [runsData, mappingsData] = await Promise.all([
          apiFetch<SyncRun[]>(
            `/api/v1/integration_configs/${c.id}/sync_runs?page=${page}&per_page=${perPage}`,
          ),
          apiFetch<SyncMapping[]>(`/api/v1/integration_configs/${c.id}/sync_mappings`),
        ]);
        setRuns(runsData);
        setMappings(mappingsData);
        setTotalPages(runsData.length < perPage ? page : page + 1);
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }

  async function fetchLogs(runId: number) {
    if (expandedRunId === runId) {
      setExpandedRunId(null);
      return;
    }
    setExpandedRunId(runId);
    setLogsLoading(true);
    try {
      const logsData = await apiFetch<SyncLog[]>(`/api/v1/sync_runs/${runId}/sync_logs`);
      setLogs(logsData);
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }

  async function handleDeleteMapping(mappingId: number) {
    if (!confirm("Delete this sync mapping?")) return;
    try {
      await apiFetch(`/api/v1/sync_mappings/${mappingId}`, { method: "DELETE" });
      setMappings(mappings.filter((m) => m.id !== mappingId));
    } catch {
      // Handle error
    }
  }

  const filteredRuns = runs.filter((r) => {
    if (syncTypeFilter !== "all" && r.sync_type !== syncTypeFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  });

  const filteredMappings = mappings.filter((m) => {
    if (localTypeFilter !== "all" && m.local_type !== localTypeFilter) return false;
    return true;
  });

  const filteredLogs = logs.filter((l) => {
    if (logLevelFilter !== "all" && l.level !== logLevelFilter) return false;
    return true;
  });

  // Summary stats
  const totalRuns = runs.length;
  const completedRuns = runs.filter((r) => r.status === "completed").length;
  const successRate = totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 0;
  const lastSuccess = runs.find((r) => r.status === "completed");
  const lastFailed = runs.find((r) => r.status === "failed");

  if (!canAccess) {
    return (
      <ProtectedRoute>
        <AppShell>
          <p className="text-gray-500">Access restricted to administrators.</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <ListSkeleton />
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (!config) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">Sync Dashboard</h1>
            <p className="text-sm text-gray-500">
              No integration configured.{" "}
              <Link href="/admin/integrations" className="text-blue-600 hover:text-blue-800">
                Set up an integration
              </Link>{" "}
              first.
            </p>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/admin/integrations"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                &larr; Back to Integrations
              </Link>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">Sync Dashboard</h1>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-500">Total Runs</p>
              <p className="text-2xl font-bold text-gray-900">{totalRuns}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-500">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{successRate}%</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-500">Last Success</p>
              <p className="text-sm font-medium text-gray-900">
                {lastSuccess?.completed_at
                  ? new Date(lastSuccess.completed_at).toLocaleString()
                  : "Never"}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-500">Last Failure</p>
              <p className="text-sm font-medium text-gray-900">
                {lastFailed?.completed_at
                  ? new Date(lastFailed.completed_at).toLocaleString()
                  : "None"}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("runs")}
              className={`pb-2 text-sm font-medium ${
                activeTab === "runs"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sync Runs
            </button>
            <button
              onClick={() => setActiveTab("mappings")}
              className={`pb-2 text-sm font-medium ${
                activeTab === "mappings"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sync Mappings
            </button>
          </div>

          {activeTab === "runs" && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex items-center gap-4">
                <select
                  value={syncTypeFilter}
                  onChange={(e) => setSyncTypeFilter(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="course_sync">Course Sync</option>
                  <option value="roster_sync">Roster Sync</option>
                  <option value="coursework_push">Coursework Push</option>
                  <option value="grade_passback">Grade Passback</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="running">Running</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Runs Table */}
              {filteredRuns.length === 0 ? (
                <EmptyState
                  title="No sync runs found"
                  description="Sync runs will appear after you configure and trigger a sync."
                />
              ) : (
                <div className="space-y-2">
                  {filteredRuns.map((run) => (
                    <div key={run.id}>
                      <button
                        onClick={() => fetchLogs(run.id)}
                        className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <SyncTypeBadge type={run.sync_type} />
                            <span className="text-xs text-gray-400">
                              {run.direction === "push" ? "\u2191" : "\u2193"} {run.direction}
                            </span>
                            <StatusBadge status={run.status} />
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>
                              {run.records_processed} processed / {run.records_succeeded} ok /{" "}
                              {run.records_failed} failed
                            </span>
                            <span>
                              {run.started_at
                                ? new Date(run.started_at).toLocaleString()
                                : "Not started"}
                            </span>
                          </div>
                        </div>
                        {run.error_message && (
                          <p className="mt-2 text-xs text-red-600">{run.error_message}</p>
                        )}
                      </button>

                      {/* Expanded Logs */}
                      {expandedRunId === run.id && (
                        <div className="ml-4 mt-2 rounded-lg border border-gray-100 bg-gray-50 p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-700">Sync Logs</h3>
                            <select
                              value={logLevelFilter}
                              onChange={(e) => setLogLevelFilter(e.target.value)}
                              className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                            >
                              <option value="all">All Levels</option>
                              <option value="info">Info</option>
                              <option value="warn">Warn</option>
                              <option value="error">Error</option>
                            </select>
                          </div>
                          {logsLoading ? (
                            <p className="text-xs text-gray-500">Loading logs...</p>
                          ) : filteredLogs.length === 0 ? (
                            <p className="text-xs text-gray-500">No logs.</p>
                          ) : (
                            <div className="space-y-1">
                              {filteredLogs.map((log) => (
                                <div key={log.id} className="flex items-start gap-2 text-xs">
                                  <LevelIcon level={log.level} />
                                  <span className="text-gray-400">
                                    {new Date(log.created_at).toLocaleTimeString()}
                                  </span>
                                  <span className="text-gray-700">{log.message}</span>
                                  {log.entity_type && (
                                    <span className="text-gray-400">
                                      [{log.entity_type}#{log.entity_id}]
                                    </span>
                                  )}
                                  {log.external_id && (
                                    <span className="text-gray-400">ext:{log.external_id}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "runs" && (
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
          )}

          {activeTab === "mappings" && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <select
                  value={localTypeFilter}
                  onChange={(e) => setLocalTypeFilter(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="Course">Course</option>
                  <option value="Section">Section</option>
                  <option value="Enrollment">Enrollment</option>
                  <option value="Assignment">Assignment</option>
                  <option value="Submission">Submission</option>
                </select>
              </div>

              {filteredMappings.length === 0 ? (
                <EmptyState
                  title="No sync mappings found"
                  description="Sync mappings will appear after a successful sync run."
                />
              ) : (
                <ResponsiveTable
                  caption="Synchronization mappings"
                  data={filteredMappings}
                  keyExtractor={(mapping) => mapping.id}
                  columns={[
                    {
                      key: "local_type",
                      header: "Local Type",
                      primary: true,
                      render: (mapping) => mapping.local_type,
                    },
                    {
                      key: "local_id",
                      header: "Local ID",
                      render: (mapping) => mapping.local_id,
                    },
                    {
                      key: "external_type",
                      header: "External Type",
                      render: (mapping) => mapping.external_type,
                    },
                    {
                      key: "external_id",
                      header: "External ID",
                      render: (mapping) => (
                        <span className="font-mono text-xs">{mapping.external_id}</span>
                      ),
                    },
                    {
                      key: "last_synced",
                      header: "Last Synced",
                      render: (mapping) =>
                        mapping.last_synced_at
                          ? new Date(mapping.last_synced_at).toLocaleString()
                          : "Never",
                    },
                    {
                      key: "actions",
                      header: "Actions",
                      render: (mapping) => (
                        <button
                          onClick={() => handleDeleteMapping(mapping.id)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      ),
                    },
                  ]}
                />
              )}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
