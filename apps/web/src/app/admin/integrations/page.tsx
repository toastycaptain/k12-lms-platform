"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
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
    base_url?: string;
    client_id?: string;
    client_secret?: string;
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
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

export default function IntegrationsPage() {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<IntegrationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const [googleForm, setGoogleForm] = useState({
    domain: "",
    classroom_enabled: true,
    drive_enabled: true,
    auto_sync_enabled: false,
    sync_interval_hours: 24,
  });

  const [oneRosterForm, setOneRosterForm] = useState({
    base_url: "",
    client_id: "",
    client_secret: "",
  });

  const canAccess = user?.roles?.includes("admin");

  const googleConfig = useMemo(
    () => configs.find((row) => row.provider === "google_classroom") || null,
    [configs],
  );
  const oneRosterConfig = useMemo(
    () => configs.find((row) => row.provider === "oneroster") || null,
    [configs],
  );

  useEffect(() => {
    async function fetchConfigs() {
      setLoading(true);
      try {
        const rows = await apiFetch<IntegrationConfig[]>("/api/v1/integration_configs");
        setConfigs(rows);

        const google = rows.find((row) => row.provider === "google_classroom");
        if (google) {
          setGoogleForm({
            domain: google.settings.domain || "",
            classroom_enabled: google.settings.classroom_enabled ?? true,
            drive_enabled: google.settings.drive_enabled ?? true,
            auto_sync_enabled: google.settings.auto_sync_enabled ?? false,
            sync_interval_hours: google.settings.sync_interval_hours ?? 24,
          });
        }

        const oneroster = rows.find((row) => row.provider === "oneroster");
        if (oneroster) {
          setOneRosterForm({
            base_url: oneroster.settings.base_url || "",
            client_id: oneroster.settings.client_id || "",
            client_secret: oneroster.settings.client_secret || "",
          });
        }
      } catch {
        setError("Failed to load integrations.");
      } finally {
        setLoading(false);
      }
    }

    void fetchConfigs();
  }, []);

  async function refreshConfigs() {
    const rows = await apiFetch<IntegrationConfig[]>("/api/v1/integration_configs");
    setConfigs(rows);
  }

  async function saveGoogleConfig() {
    setError(null);
    setSuccess(null);
    setBusyKey("save_google");

    try {
      if (googleConfig) {
        await apiFetch(`/api/v1/integration_configs/${googleConfig.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            settings: googleForm,
          }),
        });
        setSuccess("Google Classroom integration updated.");
      } else {
        await apiFetch("/api/v1/integration_configs", {
          method: "POST",
          body: JSON.stringify({
            provider: "google_classroom",
            settings: googleForm,
          }),
        });
        setSuccess("Google Classroom integration created.");
      }

      await refreshConfigs();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to save Google integration.");
    } finally {
      setBusyKey(null);
    }
  }

  async function toggleGoogleStatus() {
    if (!googleConfig) return;

    setError(null);
    setSuccess(null);
    setBusyKey("toggle_google");

    try {
      const action = googleConfig.status === "active" ? "deactivate" : "activate";
      await apiFetch(`/api/v1/integration_configs/${googleConfig.id}/${action}`, { method: "POST" });
      setSuccess(`Google Classroom integration ${action}d.`);
      await refreshConfigs();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to change Google integration status.");
    } finally {
      setBusyKey(null);
    }
  }

  async function triggerGoogleSyncCourses() {
    if (!googleConfig) return;

    setError(null);
    setSuccess(null);
    setBusyKey("sync_google_courses");

    try {
      await apiFetch(`/api/v1/integration_configs/${googleConfig.id}/sync_courses`, { method: "POST" });
      setSuccess("Google Classroom course sync triggered.");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to trigger Google course sync.");
    } finally {
      setBusyKey(null);
    }
  }

  async function saveOneRosterConfig() {
    if (!oneRosterForm.base_url.trim() || !oneRosterForm.client_id.trim()) {
      setError("OneRoster base URL and client ID are required.");
      return;
    }

    setError(null);
    setSuccess(null);
    setBusyKey("save_oneroster");

    const settings: Record<string, string> = {
      base_url: oneRosterForm.base_url.trim(),
      client_id: oneRosterForm.client_id.trim(),
    };
    if (oneRosterForm.client_secret.trim()) {
      settings.client_secret = oneRosterForm.client_secret.trim();
    } else if (oneRosterConfig?.settings.client_secret) {
      settings.client_secret = oneRosterConfig.settings.client_secret;
    }

    try {
      if (oneRosterConfig) {
        await apiFetch(`/api/v1/integration_configs/${oneRosterConfig.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            settings,
          }),
        });
        setSuccess("OneRoster integration updated.");
      } else {
        await apiFetch("/api/v1/integration_configs", {
          method: "POST",
          body: JSON.stringify({
            provider: "oneroster",
            settings,
          }),
        });
        setSuccess("OneRoster integration created.");
      }

      await refreshConfigs();
      setOneRosterForm((prev) => ({ ...prev, client_secret: "" }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to save OneRoster integration.");
    } finally {
      setBusyKey(null);
    }
  }

  async function toggleOneRosterStatus() {
    if (!oneRosterConfig) return;

    setError(null);
    setSuccess(null);
    setBusyKey("toggle_oneroster");

    try {
      const action = oneRosterConfig.status === "active" ? "deactivate" : "activate";
      await apiFetch(`/api/v1/integration_configs/${oneRosterConfig.id}/${action}`, { method: "POST" });
      setSuccess(`OneRoster integration ${action}d.`);
      await refreshConfigs();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to change OneRoster status.");
    } finally {
      setBusyKey(null);
    }
  }

  async function triggerOneRosterOrganizationsSync() {
    if (!oneRosterConfig) return;

    setError(null);
    setSuccess(null);
    setBusyKey("sync_oneroster_orgs");

    try {
      await apiFetch(`/api/v1/integration_configs/${oneRosterConfig.id}/sync_organizations`, {
        method: "POST",
      });
      setSuccess("OneRoster organization sync triggered.");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to trigger organization sync.");
    } finally {
      setBusyKey(null);
    }
  }

  async function triggerOneRosterUsersSync() {
    if (!oneRosterConfig) return;

    setError(null);
    setSuccess(null);
    setBusyKey("sync_oneroster_users");

    try {
      await apiFetch(`/api/v1/integration_configs/${oneRosterConfig.id}/sync_users`, {
        method: "POST",
      });
      setSuccess("OneRoster user and enrollment sync triggered.");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to trigger user sync.");
    } finally {
      setBusyKey(null);
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
          <div className="text-sm text-gray-500">Loading integrations...</div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-4xl space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {success && <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</div>}

          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Google Classroom</h2>
              <StatusBadge status={googleConfig?.status || "inactive"} />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                type="text"
                value={googleForm.domain}
                onChange={(e) => setGoogleForm((prev) => ({ ...prev, domain: e.target.value }))}
                placeholder="Domain (school.edu)"
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                min={1}
                value={googleForm.sync_interval_hours}
                onChange={(e) =>
                  setGoogleForm((prev) => ({ ...prev, sync_interval_hours: Number(e.target.value) || 1 }))
                }
                placeholder="Sync interval hours"
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={googleForm.classroom_enabled}
                  onChange={(e) => setGoogleForm((prev) => ({ ...prev, classroom_enabled: e.target.checked }))}
                />
                Classroom sync enabled
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={googleForm.drive_enabled}
                  onChange={(e) => setGoogleForm((prev) => ({ ...prev, drive_enabled: e.target.checked }))}
                />
                Drive integration enabled
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 md:col-span-2">
                <input
                  type="checkbox"
                  checked={googleForm.auto_sync_enabled}
                  onChange={(e) => setGoogleForm((prev) => ({ ...prev, auto_sync_enabled: e.target.checked }))}
                />
                Automatic sync enabled
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={() => void saveGoogleConfig()}
                disabled={busyKey !== null}
                className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {busyKey === "save_google" ? "Saving..." : "Save Google Settings"}
              </button>
              {googleConfig && (
                <button
                  onClick={() => void toggleGoogleStatus()}
                  disabled={busyKey !== null}
                  className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {busyKey === "toggle_google"
                    ? "Updating..."
                    : googleConfig.status === "active"
                      ? "Deactivate"
                      : "Activate"}
                </button>
              )}
              {googleConfig && (
                <button
                  onClick={() => void triggerGoogleSyncCourses()}
                  disabled={busyKey !== null || googleConfig.status !== "active"}
                  className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {busyKey === "sync_google_courses" ? "Triggering..." : "Sync Courses"}
                </button>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">OneRoster</h2>
              <StatusBadge status={oneRosterConfig?.status || "inactive"} />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                type="text"
                value={oneRosterForm.base_url}
                onChange={(e) => setOneRosterForm((prev) => ({ ...prev, base_url: e.target.value }))}
                placeholder="Base URL"
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={oneRosterForm.client_id}
                onChange={(e) => setOneRosterForm((prev) => ({ ...prev, client_id: e.target.value }))}
                placeholder="Client ID"
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="password"
                value={oneRosterForm.client_secret}
                onChange={(e) => setOneRosterForm((prev) => ({ ...prev, client_secret: e.target.value }))}
                placeholder={oneRosterConfig?.settings.client_secret ? "Client Secret (leave blank to keep current)" : "Client Secret"}
                className="rounded border border-gray-300 px-3 py-2 text-sm md:col-span-2"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={() => void saveOneRosterConfig()}
                disabled={busyKey !== null}
                className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {busyKey === "save_oneroster" ? "Saving..." : "Save OneRoster Settings"}
              </button>
              {oneRosterConfig && (
                <button
                  onClick={() => void toggleOneRosterStatus()}
                  disabled={busyKey !== null}
                  className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {busyKey === "toggle_oneroster"
                    ? "Updating..."
                    : oneRosterConfig.status === "active"
                      ? "Deactivate"
                      : "Activate"}
                </button>
              )}
              {oneRosterConfig && (
                <button
                  onClick={() => void triggerOneRosterOrganizationsSync()}
                  disabled={busyKey !== null || oneRosterConfig.status !== "active"}
                  className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {busyKey === "sync_oneroster_orgs" ? "Triggering..." : "Sync Organizations"}
                </button>
              )}
              {oneRosterConfig && (
                <button
                  onClick={() => void triggerOneRosterUsersSync()}
                  disabled={busyKey !== null || oneRosterConfig.status !== "active"}
                  className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {busyKey === "sync_oneroster_users" ? "Triggering..." : "Sync Users & Enrollments"}
                </button>
              )}
            </div>
          </section>

          <div>
            <Link href="/admin/integrations/sync" className="text-sm text-blue-600 hover:text-blue-800">
              View Sync History
            </Link>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
