"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@k12/ui";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";

interface AiProviderConfig {
  id: number;
  provider_name: "anthropic" | "openai";
  display_name: string;
  default_model: string;
  available_models: string[];
  status: "active" | "inactive";
  settings: Record<string, unknown>;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
}

export default function AiSettingsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [configs, setConfigs] = useState<AiProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    id: "",
    provider_name: "anthropic" as "anthropic" | "openai",
    display_name: "",
    default_model: "",
    api_key: "",
  });

  const canAccess = user?.roles?.includes("admin") || false;

  async function loadConfigs() {
    setLoading(true);
    setError(null);

    try {
      const rows = await apiFetch<AiProviderConfig[]>("/api/v1/ai_provider_configs");
      setConfigs(rows);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load AI provider configs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadConfigs();
  }, []);

  async function saveConfig() {
    if (!form.display_name.trim() || !form.default_model.trim()) return;

    setSaving(true);

    try {
      const payload = {
        provider_name: form.provider_name,
        display_name: form.display_name.trim(),
        default_model: form.default_model.trim(),
        api_key: form.api_key.trim() || undefined,
      };

      if (form.id) {
        await apiFetch(`/api/v1/ai_provider_configs/${form.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        addToast("success", "AI provider updated.");
      } else {
        await apiFetch("/api/v1/ai_provider_configs", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        addToast("success", "AI provider created.");
      }

      setForm((prev) => ({ ...prev, api_key: "" }));
      await loadConfigs();
    } catch (e) {
      addToast("error", e instanceof ApiError ? e.message : "Failed to save AI provider config.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(config: AiProviderConfig) {
    try {
      const action = config.status === "active" ? "deactivate" : "activate";
      await apiFetch(`/api/v1/ai_provider_configs/${config.id}/${action}`, { method: "POST" });
      addToast("success", `Provider ${action}d.`);
      await loadConfigs();
    } catch (e) {
      addToast("error", e instanceof ApiError ? e.message : "Failed to update provider status.");
    }
  }

  async function deleteConfig(configId: number) {
    if (!window.confirm("Delete this AI provider config?")) return;

    try {
      await apiFetch(`/api/v1/ai_provider_configs/${configId}`, { method: "DELETE" });
      addToast("success", "Provider deleted.");
      if (form.id === String(configId)) {
        setForm({
          id: "",
          provider_name: "anthropic",
          display_name: "",
          default_model: "",
          api_key: "",
        });
      }
      await loadConfigs();
    } catch (e) {
      addToast("error", e instanceof ApiError ? e.message : "Failed to delete provider config.");
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

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-bold text-gray-900">AI Settings</h1>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/ai/policies"
                className="rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                AI Policies
              </Link>
              <Link
                href="/admin/ai/templates"
                className="rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                AI Templates
              </Link>
            </div>
          </div>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Provider Configurations</h2>
              <button
                onClick={() =>
                  setForm({
                    id: "",
                    provider_name: "anthropic",
                    display_name: "",
                    default_model: "",
                    api_key: "",
                  })
                }
                className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
              >
                New Provider
              </button>
            </div>

            {loading ? (
              <ListSkeleton />
            ) : (
              <div className="mt-3 space-y-2">
                {configs.map((config) => (
                  <div key={config.id} className="rounded border border-gray-200 bg-gray-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        onClick={() =>
                          setForm({
                            id: String(config.id),
                            provider_name: config.provider_name,
                            display_name: config.display_name,
                            default_model: config.default_model,
                            api_key: "",
                          })
                        }
                        className="text-left"
                      >
                        <p className="text-sm font-medium text-gray-900">{config.display_name}</p>
                        <p className="text-xs text-gray-500">
                          {config.provider_name} · {config.default_model}
                        </p>
                      </button>

                      <div className="flex items-center gap-2">
                        <StatusBadge status={config.status} />
                        <button
                          onClick={() => void toggleStatus(config)}
                          className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
                        >
                          {config.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => void deleteConfig(config.id)}
                          className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {configs.length === 0 && (
                  <p className="text-sm text-gray-500">No AI providers configured.</p>
                )}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-gray-900">Create / Edit Provider</h2>

            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <select
                value={form.provider_name}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    provider_name: e.target.value as "anthropic" | "openai",
                  }))
                }
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="anthropic">anthropic</option>
                <option value="openai">openai</option>
              </select>
              <input
                type="text"
                value={form.display_name}
                onChange={(e) => setForm((prev) => ({ ...prev, display_name: e.target.value }))}
                placeholder="Display name"
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={form.default_model}
                onChange={(e) => setForm((prev) => ({ ...prev, default_model: e.target.value }))}
                placeholder="Default model"
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="password"
                value={form.api_key}
                onChange={(e) => setForm((prev) => ({ ...prev, api_key: e.target.value }))}
                placeholder={form.id ? "API key (leave blank to keep current)" : "API key"}
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <button
              onClick={() => void saveConfig()}
              disabled={saving}
              className="mt-3 rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : form.id ? "Update Provider" : "Create Provider"}
            </button>
          </section>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
