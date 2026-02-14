"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { StatusBadge } from "@/components/StatusBadge";

interface IntegrationConfig {
  id: number;
  provider: string;
  status: string;
  settings: {
    base_url?: string;
    client_id?: string;
    client_secret?: string;
    auto_sync?: boolean;
    sync_interval_hours?: number;
  };
  created_at: string;
  updated_at: string;
}

interface SyncRun {
  id: number;
  integration_config_id: number;
  sync_type: string;
  status: string;
  records_synced: number;
  records_failed: number;
  error_message: string | null;
  log: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

interface SyncCounts {
  users: number;
  courses: number;
  enrollments: number;
}

export default function OneRosterPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<IntegrationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [baseUrl, setBaseUrl] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [autoSync, setAutoSync] = useState(false);
  const [syncIntervalHours, setSyncIntervalHours] = useState(24);

  // Sync history
  const [syncRuns, setSyncRuns] = useState<SyncRun[]>([]);
  const [syncCounts, setSyncCounts] = useState<SyncCounts | null>(null);
  const [expandedRunId, setExpandedRunId] = useState<number | null>(null);

  const canAccess = user?.roles?.includes("admin");

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const configs = await apiFetch<IntegrationConfig[]>(
        "/api/v1/integration_configs?provider=oneroster",
      );
      if (configs.length > 0) {
        const c = configs[0];
        setConfig(c);
        setBaseUrl(c.settings.base_url || "");
        setClientId(c.settings.client_id || "");
        setClientSecret(c.settings.client_secret || "");
        setAutoSync(c.settings.auto_sync ?? false);
        setSyncIntervalHours(c.settings.sync_interval_hours ?? 24);

        // Fetch sync runs
        try {
          const runs = await apiFetch<SyncRun[]>(
            `/api/v1/integration_configs/${c.id}/sync_runs`,
          );
          setSyncRuns(runs);
        } catch {
          // No sync runs yet
        }

        // Fetch sync counts
        try {
          const counts = await apiFetch<SyncCounts>(
            `/api/v1/integration_configs/${c.id}/sync_counts`,
          );
          setSyncCounts(counts);
        } catch {
          // No counts available
        }
      }
    } catch {
      // No config yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canAccess) {
      fetchConfig();
    } else {
      setLoading(false);
    }
  }, [canAccess, fetchConfig]);

  function clearMessages() {
    setError(null);
    setSuccess(null);
  }

  async function handleSave() {
    clearMessages();
    setSaving(true);
    try {
      if (config) {
        const updated = await apiFetch<IntegrationConfig>(
          `/api/v1/integration_configs/${config.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              settings: {
                base_url: baseUrl,
                client_id: clientId,
                client_secret: clientSecret,
                auto_sync: autoSync,
                sync_interval_hours: syncIntervalHours,
              },
            }),
          },
        );
        setConfig(updated);
        setSuccess("Configuration updated successfully.");
      } else {
        const created = await apiFetch<IntegrationConfig>(
          "/api/v1/integration_configs",
          {
            method: "POST",
            body: JSON.stringify({
              provider: "oneroster",
              settings: {
                base_url: baseUrl,
                client_id: clientId,
                client_secret: clientSecret,
                auto_sync: autoSync,
                sync_interval_hours: syncIntervalHours,
              },
            }),
          },
        );
        setConfig(created);
        setSuccess("Configuration created successfully.");
      }
    } catch {
      setError("Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    if (!config) return;
    clearMessages();
    setTesting(true);
    try {
      const result = await apiFetch<{ success: boolean; message: string }>(
        `/api/v1/integration_configs/${config.id}/test_connection`,
        { method: "POST" },
      );
      if (result.success) {
        setSuccess(result.message || "Connection successful.");
      } else {
        setError(result.message || "Connection test failed.");
      }
    } catch {
      setError("Connection test failed.");
    } finally {
      setTesting(false);
    }
  }

  async function handleSync(syncType: string, endpoint: string) {
    if (!config) return;
    clearMessages();
    setSyncing(syncType);
    try {
      await apiFetch(`/api/v1/integration_configs/${config.id}/${endpoint}`, {
        method: "POST",
      });
      setSuccess(`${syncType} sync triggered successfully.`);
      // Refresh sync runs
      try {
        const runs = await apiFetch<SyncRun[]>(
          `/api/v1/integration_configs/${config.id}/sync_runs`,
        );
        setSyncRuns(runs);
      } catch {
        // ignore
      }
    } catch {
      setError(`Failed to trigger ${syncType} sync.`);
    } finally {
      setSyncing(null);
    }
  }

  async function handleCsvImport(file: File) {
    if (!config) return;
    clearMessages();
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/v1/integration_configs/${config.id}/import_csv`;
      const response = await fetch(url, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      setSuccess("CSV import started successfully.");
    } catch {
      setError("Failed to import CSV file.");
    } finally {
      setUploading(false);
    }
  }

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
          <div className="text-sm text-gray-500">Loading...</div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-4xl space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">
            SIS / OneRoster Configuration
          </h1>

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

          {/* Configuration Form */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              OneRoster Connection
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Base URL
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://sis.example.com/ims/oneroster/v1p1"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Client ID
                </label>
                <input
                  type="password"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Enter client ID"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Client Secret
                </label>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Enter client secret"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-gray-700">Enable automatic sync</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Sync Interval (hours)
                </label>
                <input
                  type="number"
                  value={syncIntervalHours}
                  onChange={(e) =>
                    setSyncIntervalHours(Number(e.target.value))
                  }
                  min={1}
                  className="mt-1 block w-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Configuration"}
                </button>
                {config && (
                  <button
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {testing ? "Testing..." : "Test Connection"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sync Actions */}
          {config && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Sync Actions
              </h2>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleSync("Organizations", "sync_orgs")}
                  disabled={syncing !== null}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {syncing === "Organizations"
                    ? "Syncing..."
                    : "Sync Organizations"}
                </button>
                <button
                  onClick={() => handleSync("Users", "sync_users")}
                  disabled={syncing !== null}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {syncing === "Users" ? "Syncing..." : "Sync Users"}
                </button>
                <button
                  onClick={() => handleSync("Classes", "sync_classes")}
                  disabled={syncing !== null}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {syncing === "Classes" ? "Syncing..." : "Sync Classes"}
                </button>
                <button
                  onClick={() =>
                    handleSync("Enrollments", "sync_enrollments")
                  }
                  disabled={syncing !== null}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {syncing === "Enrollments"
                    ? "Syncing..."
                    : "Sync Enrollments"}
                </button>
              </div>
            </div>
          )}

          {/* Sync Mapping Counts */}
          {syncCounts && (
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs text-gray-500">Users Synced</p>
                <p className="text-2xl font-bold text-gray-900">
                  {syncCounts.users.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs text-gray-500">Courses Synced</p>
                <p className="text-2xl font-bold text-gray-900">
                  {syncCounts.courses.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs text-gray-500">Enrollments Synced</p>
                <p className="text-2xl font-bold text-gray-900">
                  {syncCounts.enrollments.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* CSV Import */}
          {config && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                CSV Import
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Upload a OneRoster-compliant ZIP file containing CSV data.
              </p>
              <div className="mt-4">
                <input
                  type="file"
                  accept=".zip"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleCsvImport(file);
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploading && (
                  <p className="mt-2 text-sm text-gray-500">Uploading...</p>
                )}
              </div>
            </div>
          )}

          {/* Sync History */}
          {syncRuns.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Sync History
              </h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        Type
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        Records
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        Failed
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        Started
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        Completed
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {syncRuns.map((run) => (
                      <SyncRunRow
                        key={run.id}
                        run={run}
                        expanded={expandedRunId === run.id}
                        onToggle={() =>
                          setExpandedRunId(
                            expandedRunId === run.id ? null : run.id,
                          )
                        }
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

function SyncRunRow({
  run,
  expanded,
  onToggle,
}: {
  run: SyncRun;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr>
        <td className="px-4 py-2 text-gray-700">{run.sync_type}</td>
        <td className="px-4 py-2">
          <StatusBadge status={run.status} />
        </td>
        <td className="px-4 py-2 text-gray-600">{run.records_synced}</td>
        <td className="px-4 py-2 text-gray-600">{run.records_failed}</td>
        <td className="px-4 py-2 text-gray-400">
          {new Date(run.started_at).toLocaleString()}
        </td>
        <td className="px-4 py-2 text-gray-400">
          {run.completed_at
            ? new Date(run.completed_at).toLocaleString()
            : "-"}
        </td>
        <td className="px-4 py-2">
          <button
            onClick={onToggle}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {expanded ? "Hide" : "Show"}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="bg-gray-50 px-4 py-3">
            {run.error_message && (
              <div className="mb-2">
                <span className="text-xs font-medium text-red-700">
                  Error:{" "}
                </span>
                <span className="text-xs text-red-600">
                  {run.error_message}
                </span>
              </div>
            )}
            {run.log && (
              <pre className="max-h-48 overflow-auto rounded bg-gray-100 p-2 text-xs text-gray-700">
                {run.log}
              </pre>
            )}
            {!run.error_message && !run.log && (
              <p className="text-xs text-gray-400">
                No additional details available.
              </p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
