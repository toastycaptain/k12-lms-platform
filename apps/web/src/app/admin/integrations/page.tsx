"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";

interface IntegrationConfig {
  id: number;
  provider: string;
  status: string;
  settings: {
    domain?: string;
    classroom_enabled?: boolean;
    drive_enabled?: boolean;
    auto_sync_enabled?: boolean;
    sync_interval_hours?: number;
  };
  created_at: string;
  updated_at: string;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-600",
    error: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-600"}`}
    >
      {status}
    </span>
  );
}

export default function IntegrationsPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<IntegrationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Setup form state
  const [domain, setDomain] = useState("");
  const [classroomEnabled, setClassroomEnabled] = useState(true);
  const [driveEnabled, setDriveEnabled] = useState(true);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [syncIntervalHours, setSyncIntervalHours] = useState(24);

  const canAccess = user?.roles?.includes("admin");

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    setLoading(true);
    try {
      const configs = await apiFetch<IntegrationConfig[]>("/api/v1/integration_configs");
      if (configs.length > 0) {
        const c = configs[0];
        setConfig(c);
        setDomain(c.settings.domain || "");
        setClassroomEnabled(c.settings.classroom_enabled ?? true);
        setDriveEnabled(c.settings.drive_enabled ?? true);
        setAutoSyncEnabled(c.settings.auto_sync_enabled ?? false);
        setSyncIntervalHours(c.settings.sync_interval_hours ?? 24);
      }
    } catch {
      // No configs
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    setSaving(true);
    setError(null);
    try {
      const created = await apiFetch<IntegrationConfig>("/api/v1/integration_configs", {
        method: "POST",
        body: JSON.stringify({
          provider: "google_classroom",
          settings: {
            domain,
            classroom_enabled: classroomEnabled,
            drive_enabled: driveEnabled,
            auto_sync_enabled: autoSyncEnabled,
            sync_interval_hours: syncIntervalHours,
          },
        }),
      });
      setConfig(created);
      setSuccess("Integration configured successfully.");
    } catch {
      setError("Failed to create integration configuration.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate() {
    if (!config) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await apiFetch<IntegrationConfig>(
        `/api/v1/integration_configs/${config.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            settings: {
              domain,
              classroom_enabled: classroomEnabled,
              drive_enabled: driveEnabled,
              auto_sync_enabled: autoSyncEnabled,
              sync_interval_hours: syncIntervalHours,
            },
          }),
        },
      );
      setConfig(updated);
      setSuccess("Settings updated.");
    } catch {
      setError("Failed to update settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus() {
    if (!config) return;
    setSaving(true);
    setError(null);
    try {
      const action = config.status === "active" ? "deactivate" : "activate";
      const updated = await apiFetch<IntegrationConfig>(
        `/api/v1/integration_configs/${config.id}/${action}`,
        { method: "POST" },
      );
      setConfig(updated);
      setSuccess(`Integration ${action}d.`);
    } catch {
      setError("Failed to toggle integration status.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSyncCourses() {
    if (!config) return;
    setSyncing(true);
    setError(null);
    try {
      await apiFetch(`/api/v1/integration_configs/${config.id}/sync_courses`, {
        method: "POST",
      });
      setSuccess("Sync triggered. Check the Sync Dashboard for progress.");
    } catch {
      setError("Failed to trigger sync.");
    } finally {
      setSyncing(false);
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
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</div>
          )}

          {/* Connection Status */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Google Account</h2>
            <div className="mt-3">
              {user?.google_connected ? (
                <p className="text-sm text-green-600">Google account connected</p>
              ) : (
                <div>
                  <p className="text-sm text-gray-500">
                    Your Google account is not connected. Connect to enable Google Classroom sync.
                  </p>
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/auth/google_oauth2`}
                    className="mt-2 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Connect Google Account
                  </a>
                </div>
              )}
            </div>
          </div>

          {!config ? (
            /* Setup Form */
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Set Up Google Classroom
              </h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Domain
                  </label>
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="school.edu"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={classroomEnabled}
                      onChange={(e) => setClassroomEnabled(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-gray-700">Enable Classroom sync</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={driveEnabled}
                      onChange={(e) => setDriveEnabled(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-gray-700">Enable Drive integration</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={autoSyncEnabled}
                      onChange={(e) => setAutoSyncEnabled(e.target.checked)}
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
                    onChange={(e) => setSyncIntervalHours(Number(e.target.value))}
                    min={1}
                    className="mt-1 block w-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </div>
          ) : (
            /* Management View */
            <>
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Google Classroom Integration
                  </h2>
                  <StatusBadge status={config.status} />
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Domain
                    </label>
                    <input
                      type="text"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={classroomEnabled}
                        onChange={(e) => setClassroomEnabled(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-gray-700">Classroom sync</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={driveEnabled}
                        onChange={(e) => setDriveEnabled(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-gray-700">Drive integration</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={autoSyncEnabled}
                        onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-gray-700">Automatic sync</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Sync Interval (hours)
                    </label>
                    <input
                      type="number"
                      value={syncIntervalHours}
                      onChange={(e) => setSyncIntervalHours(Number(e.target.value))}
                      min={1}
                      className="mt-1 block w-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleUpdate}
                      disabled={saving}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Settings"}
                    </button>
                    <button
                      onClick={handleToggleStatus}
                      disabled={saving}
                      className={`rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 ${
                        config.status === "active"
                          ? "border border-red-300 text-red-700 hover:bg-red-50"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      {config.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Sync Actions */}
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-gray-900">Sync Actions</h2>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={handleSyncCourses}
                    disabled={syncing || config.status !== "active"}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {syncing ? "Triggering..." : "Sync Courses Now"}
                  </button>
                  <Link
                    href="/admin/integrations/sync"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View Sync History
                  </Link>
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  Last updated: {new Date(config.updated_at).toLocaleString()}
                </p>
              </div>
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
