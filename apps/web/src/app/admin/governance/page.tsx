"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";

/* ---------- Types ---------- */

interface AuditLog {
  id: number;
  user_id: number | null;
  user_email: string | null;
  action: string;
  auditable_type: string;
  auditable_id: number;
  changes: Record<string, unknown> | null;
  created_at: string;
}

interface AuditLogSummary {
  counts_by_action: Record<string, number>;
}

interface AuditLogPage {
  audit_logs: AuditLog[];
  meta: { total: number; page: number; per_page: number };
}

interface DataRetentionPolicy {
  id: number;
  name: string;
  entity_type: string;
  retention_days: number;
  action: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface ExportStatus {
  status: string;
  download_url: string | null;
  file_size: number | null;
  created_at: string | null;
}

/* ---------- Constants ---------- */

type Tab = "audit" | "retention" | "export";

const AUDITABLE_TYPES = [
  "User",
  "Course",
  "Unit",
  "Lesson",
  "Assignment",
  "Submission",
  "Quiz",
  "AiInvocation",
  "IntegrationConfig",
];

const ACTION_TYPES = ["create", "update", "delete", "login", "logout", "sync"];

const ENTITY_TYPES = ["audit_log", "sync_log", "ai_invocation"];

const RETENTION_ACTIONS = ["archive", "anonymize", "delete"];

/* ---------- Helpers ---------- */

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    processing: "bg-blue-100 text-blue-800",
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

/* ---------- Main Component ---------- */

export default function GovernancePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("audit");

  const canAccess = user?.roles?.includes("admin");

  if (!canAccess) {
    return (
      <ProtectedRoute>
        <AppShell>
          <p className="text-gray-500">Access restricted to administrators.</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-5xl space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Governance</h1>

          {/* Tab navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex gap-6">
              {(
                [
                  { key: "audit", label: "Audit Log" },
                  { key: "retention", label: "Data Retention" },
                  { key: "export", label: "Data Export" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`border-b-2 pb-3 text-sm font-medium ${
                    activeTab === tab.key
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {activeTab === "audit" && <AuditLogTab />}
          {activeTab === "retention" && <RetentionTab />}
          {activeTab === "export" && <ExportTab />}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

/* ---------- Audit Log Tab ---------- */

function AuditLogTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [summary, setSummary] = useState<AuditLogSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Filters
  const [filterAction, setFilterAction] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const fetchLogs = useCallback(
    async (currentPage: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(currentPage));
        params.set("per_page", "50");
        if (filterAction) params.set("action", filterAction);
        if (filterType) params.set("auditable_type", filterType);
        if (filterUser) params.set("user_search", filterUser);
        if (filterStartDate) params.set("start_date", filterStartDate);
        if (filterEndDate) params.set("end_date", filterEndDate);

        const data = await apiFetch<AuditLogPage>(
          `/api/v1/audit_logs?${params.toString()}`,
        );
        setLogs(data.audit_logs);
        setTotalPages(Math.ceil(data.meta.total / data.meta.per_page));
      } catch {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    },
    [filterAction, filterType, filterUser, filterStartDate, filterEndDate],
  );

  const fetchSummary = useCallback(async () => {
    try {
      const data = await apiFetch<AuditLogSummary>(
        "/api/v1/audit_logs/summary",
      );
      setSummary(data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchLogs(page);
  }, [page, fetchLogs]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filterAction, filterType, filterUser, filterStartDate, filterEndDate]);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Object.entries(summary.counts_by_action).map(([action, count]) => (
            <div
              key={action}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <p className="text-xs text-gray-500">{action} (30d)</p>
              <p className="text-2xl font-bold text-gray-900">
                {(count as number).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">All actions</option>
          {ACTION_TYPES.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">All types</option>
          {AUDITABLE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          placeholder="Search user..."
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
        <input
          type="date"
          value={filterStartDate}
          onChange={(e) => setFilterStartDate(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
        <input
          type="date"
          value={filterEndDate}
          onChange={(e) => setFilterEndDate(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : logs.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          No audit logs found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                  Timestamp
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                  User
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                  Action
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                  Entity Type
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                  Entity ID
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <AuditLogRow
                  key={log.id}
                  log={log}
                  expanded={expandedId === log.id}
                  onToggle={() =>
                    setExpandedId(expandedId === log.id ? null : log.id)
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function AuditLogRow({
  log,
  expanded,
  onToggle,
}: {
  log: AuditLog;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr>
        <td className="px-4 py-2 text-gray-400">
          {new Date(log.created_at).toLocaleString()}
        </td>
        <td className="px-4 py-2 text-gray-600">
          {log.user_email || "-"}
        </td>
        <td className="px-4 py-2 text-gray-700">{log.action}</td>
        <td className="px-4 py-2 text-gray-600">{log.auditable_type}</td>
        <td className="px-4 py-2 text-gray-600">{log.auditable_id}</td>
        <td className="px-4 py-2">
          {log.changes && (
            <button
              onClick={onToggle}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {expanded ? "Hide" : "Show"}
            </button>
          )}
        </td>
      </tr>
      {expanded && log.changes && (
        <tr>
          <td colSpan={6} className="bg-gray-50 px-4 py-3">
            <pre className="max-h-48 overflow-auto rounded bg-gray-100 p-2 text-xs text-gray-700">
              {JSON.stringify(log.changes, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}

/* ---------- Data Retention Tab ---------- */

function RetentionTab() {
  const [policies, setPolicies] = useState<DataRetentionPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEntityType, setFormEntityType] = useState("audit_log");
  const [formRetentionDays, setFormRetentionDays] = useState(90);
  const [formAction, setFormAction] = useState("archive");
  const [formEnabled, setFormEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  // Running policy
  const [runningId, setRunningId] = useState<number | null>(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<DataRetentionPolicy[]>(
        "/api/v1/data_retention_policies",
      );
      setPolicies(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  function clearMessages() {
    setError(null);
    setSuccess(null);
  }

  async function handleAddPolicy() {
    clearMessages();
    setSaving(true);
    try {
      const created = await apiFetch<DataRetentionPolicy>(
        "/api/v1/data_retention_policies",
        {
          method: "POST",
          body: JSON.stringify({
            name: formName,
            entity_type: formEntityType,
            retention_days: Math.max(30, formRetentionDays),
            action: formAction,
            enabled: formEnabled,
          }),
        },
      );
      setPolicies((prev) => [...prev, created]);
      setFormName("");
      setFormRetentionDays(90);
      setShowAddForm(false);
      setSuccess("Policy created.");
    } catch {
      setError("Failed to create policy.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleEnabled(policy: DataRetentionPolicy) {
    clearMessages();
    try {
      const updated = await apiFetch<DataRetentionPolicy>(
        `/api/v1/data_retention_policies/${policy.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ enabled: !policy.enabled }),
        },
      );
      setPolicies((prev) =>
        prev.map((p) => (p.id === policy.id ? updated : p)),
      );
    } catch {
      setError("Failed to update policy.");
    }
  }

  async function handleRunPolicy(id: number) {
    clearMessages();
    setRunningId(id);
    try {
      await apiFetch(`/api/v1/data_retention_policies/${id}/run`, {
        method: "POST",
      });
      setSuccess("Policy run triggered.");
    } catch {
      setError("Failed to run policy.");
    } finally {
      setRunningId(null);
    }
  }

  async function handleDeletePolicy(id: number) {
    clearMessages();
    try {
      await apiFetch(`/api/v1/data_retention_policies/${id}`, {
        method: "DELETE",
      });
      setPolicies((prev) => prev.filter((p) => p.id !== id));
      setDeletingId(null);
      setSuccess("Policy deleted.");
    } catch {
      setError("Failed to delete policy.");
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Retention Policies
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showAddForm ? "Cancel" : "Add Policy"}
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Policy Name
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Archive old audit logs"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Entity Type
            </label>
            <select
              value={formEntityType}
              onChange={(e) => setFormEntityType(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Retention Days (min 30)
            </label>
            <input
              type="number"
              value={formRetentionDays}
              onChange={(e) => setFormRetentionDays(Number(e.target.value))}
              min={30}
              className="mt-1 block w-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Action
            </label>
            <select
              value={formAction}
              onChange={(e) => setFormAction(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {RETENTION_ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formEnabled}
              onChange={(e) => setFormEnabled(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-gray-700">Enabled</span>
          </label>
          <button
            onClick={handleAddPolicy}
            disabled={saving || !formName}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Policy"}
          </button>
        </div>
      )}

      {/* Policies list */}
      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : policies.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          No retention policies configured.
        </div>
      ) : (
        <div className="space-y-3">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {policy.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {policy.entity_type.replace(/_/g, " ")} &middot;{" "}
                    {policy.retention_days} days &middot; {policy.action}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={policy.enabled}
                      onChange={() => handleToggleEnabled(policy)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-gray-600">Enabled</span>
                  </label>
                  <button
                    onClick={() => handleRunPolicy(policy.id)}
                    disabled={runningId === policy.id}
                    className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {runningId === policy.id ? "Running..." : "Run Now"}
                  </button>
                  {deletingId === policy.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-red-600">Confirm?</span>
                      <button
                        onClick={() => handleDeletePolicy(policy.id)}
                        className="text-xs font-medium text-red-600 hover:text-red-800"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingId(policy.id)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Data Export Tab ---------- */

function ExportTab() {
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<ExportStatus | null>(null);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchExportStatus = useCallback(async () => {
    try {
      const data = await apiFetch<ExportStatus>(
        "/api/v1/tenant/export_status",
      );
      setExportStatus(data);
      return data;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    fetchExportStatus();
  }, [fetchExportStatus]);

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(async () => {
      const status = await fetchExportStatus();
      if (status && status.status !== "processing") {
        setPolling(false);
        if (status.status === "completed") {
          setSuccess("Export completed. Download link is available below.");
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [polling, fetchExportStatus]);

  async function handleExport() {
    setError(null);
    setSuccess(null);
    setExporting(true);
    try {
      await apiFetch("/api/v1/tenant/export", { method: "POST" });
      setPolling(true);
      setExportStatus({
        status: "processing",
        download_url: null,
        file_size: null,
        created_at: null,
      });
      setSuccess("Export started. This may take a few minutes.");
    } catch {
      setError("Failed to start export.");
    } finally {
      setExporting(false);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Tenant Data Export
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Export all tenant data for compliance or migration purposes.
        </p>

        <div className="mt-4">
          <button
            onClick={handleExport}
            disabled={exporting || exportStatus?.status === "processing"}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {exporting
              ? "Starting export..."
              : exportStatus?.status === "processing"
                ? "Export in progress..."
                : "Export All Data"}
          </button>
        </div>

        {exportStatus && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                Status:
              </span>
              <StatusBadge status={exportStatus.status} />
              {exportStatus.status === "processing" && (
                <span className="text-xs text-gray-400">
                  (checking every few seconds...)
                </span>
              )}
            </div>

            {exportStatus.created_at && (
              <div className="text-sm text-gray-500">
                <span className="font-medium text-gray-700">
                  Last export:
                </span>{" "}
                {new Date(exportStatus.created_at).toLocaleString()}
              </div>
            )}

            {exportStatus.file_size !== null && (
              <div className="text-sm text-gray-500">
                <span className="font-medium text-gray-700">
                  File size:
                </span>{" "}
                {formatFileSize(exportStatus.file_size)}
              </div>
            )}

            {exportStatus.status === "completed" &&
              exportStatus.download_url && (
                <a
                  href={exportStatus.download_url}
                  className="inline-block rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                  download
                >
                  Download Export
                </a>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
