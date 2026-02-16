"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/Toast";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";

interface RetentionPolicy {
  id: number;
  name: string;
  entity_type: string;
  action: string;
  retention_days: number;
  enabled: boolean;
}

const ENTITY_OPTIONS = [
  "AuditLog",
  "AiInvocation",
  "SyncLog",
  "SyncRun",
  "QuizAttempt",
  "Submission",
];
const ACTION_OPTIONS = ["archive", "delete", "anonymize"];

export default function DataRetentionPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    id: "",
    name: "",
    entity_type: "AuditLog",
    action: "delete",
    retention_days: "30",
    enabled: true,
  });

  const isAdmin = user?.roles?.includes("admin") || false;

  useEffect(() => {
    async function fetchPolicies() {
      setLoading(true);
      try {
        const rows = await apiFetch<RetentionPolicy[]>("/api/v1/data_retention_policies");
        setPolicies(rows);
      } catch {
        setError("Failed to load retention policies.");
      } finally {
        setLoading(false);
      }
    }

    void fetchPolicies();
  }, []);

  async function refreshPolicies() {
    setPolicies(await apiFetch<RetentionPolicy[]>("/api/v1/data_retention_policies"));
  }

  async function savePolicy() {
    if (!form.name.trim() || !form.retention_days.trim()) return;

    const payload = {
      data_retention_policy: {
        name: form.name.trim(),
        entity_type: form.entity_type,
        action: form.action,
        retention_days: Number(form.retention_days),
        enabled: form.enabled,
        settings: {},
      },
    };

    try {
      if (form.id) {
        await apiFetch(`/api/v1/data_retention_policies/${form.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        addToast("success", "Policy updated.");
      } else {
        await apiFetch("/api/v1/data_retention_policies", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        addToast("success", "Policy created.");
      }
      await refreshPolicies();
    } catch (e) {
      addToast("error", e instanceof ApiError ? e.message : "Failed to save policy.");
    }
  }

  async function runNow(policyId: number) {
    try {
      await apiFetch(`/api/v1/data_retention_policies/${policyId}/enforce`, { method: "POST" });
      addToast("success", "Retention enforcement queued.");
    } catch (e) {
      addToast(
        "error",
        e instanceof ApiError ? e.message : "Failed to enqueue policy enforcement.",
      );
    }
  }

  if (!isAdmin) {
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
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Data Retention Policies</h1>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {loading ? (
            <ListSkeleton />
          ) : (
            <>
              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Policies</h2>
                  <button
                    onClick={() =>
                      setForm({
                        id: "",
                        name: "",
                        entity_type: "AuditLog",
                        action: "delete",
                        retention_days: "30",
                        enabled: true,
                      })
                    }
                    className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    New Policy
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  {policies.map((row) => (
                    <div
                      key={row.id}
                      className="rounded border border-gray-200 bg-gray-50 px-3 py-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                          onClick={() =>
                            setForm({
                              id: String(row.id),
                              name: row.name,
                              entity_type: row.entity_type,
                              action: row.action,
                              retention_days: String(row.retention_days),
                              enabled: row.enabled,
                            })
                          }
                          className="text-left"
                        >
                          <p className="text-sm font-medium text-gray-900">{row.name}</p>
                          <p className="text-xs text-gray-500">
                            {row.entity_type} · {row.action} · {row.retention_days} days
                          </p>
                        </button>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${row.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}
                          >
                            {row.enabled ? "enabled" : "disabled"}
                          </span>
                          <button
                            onClick={() => void runNow(row.id)}
                            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
                          >
                            Run Now
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {policies.length === 0 && (
                    <p className="text-sm text-gray-500">No policies configured.</p>
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-gray-900">Create / Edit Policy</h2>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <input
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Policy name"
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    min={1}
                    value={form.retention_days}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, retention_days: e.target.value }))
                    }
                    placeholder="Retention days"
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                  <select
                    value={form.entity_type}
                    onChange={(e) => setForm((prev) => ({ ...prev, entity_type: e.target.value }))}
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                  >
                    {ENTITY_OPTIONS.map((entity) => (
                      <option key={entity} value={entity}>
                        {entity}
                      </option>
                    ))}
                  </select>
                  <select
                    value={form.action}
                    onChange={(e) => setForm((prev) => ({ ...prev, action: e.target.value }))}
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                  >
                    {ACTION_OPTIONS.map((action) => (
                      <option key={action} value={action}>
                        {action}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm text-gray-700 md:col-span-2">
                    <input
                      type="checkbox"
                      checked={form.enabled}
                      onChange={(e) => setForm((prev) => ({ ...prev, enabled: e.target.checked }))}
                    />
                    Enabled
                  </label>
                </div>

                <button
                  onClick={() => void savePolicy()}
                  className="mt-3 rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                >
                  {form.id ? "Update Policy" : "Create Policy"}
                </button>
              </section>
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
