"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";

interface AiProviderConfig {
  id: number;
  provider_name: string;
  display_name: string;
  status: string;
  default_model: string;
  available_models: string[];
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

const PROVIDER_OPTIONS = [
  { value: "openai", label: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"] },
  { value: "anthropic", label: "Anthropic", models: ["claude-sonnet-4-5-20250929", "claude-haiku-4-5-20251001"] },
];

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

export default function AiRegistryPage() {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<AiProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add form
  const [showForm, setShowForm] = useState(false);
  const [formProvider, setFormProvider] = useState("openai");
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formApiKey, setFormApiKey] = useState("");
  const [formDefaultModel, setFormDefaultModel] = useState("");
  const [formAvailableModels, setFormAvailableModels] = useState<string[]>([]);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editDefaultModel, setEditDefaultModel] = useState("");
  const [editApiKey, setEditApiKey] = useState("");

  const canAccess = user?.roles?.includes("admin");

  useEffect(() => {
    fetchConfigs();
  }, []);

  async function fetchConfigs() {
    try {
      const data = await apiFetch<AiProviderConfig[]>("/api/v1/ai_provider_configs");
      setConfigs(data);
    } catch {
      // No configs
    } finally {
      setLoading(false);
    }
  }

  const selectedProviderOption = PROVIDER_OPTIONS.find((p) => p.value === formProvider);

  async function handleCreate() {
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/api/v1/ai_provider_configs", {
        method: "POST",
        body: JSON.stringify({
          provider_name: formProvider,
          display_name: formDisplayName || selectedProviderOption?.label || formProvider,
          api_key: formApiKey,
          default_model: formDefaultModel || selectedProviderOption?.models[0] || "",
          available_models: formAvailableModels.length > 0 ? formAvailableModels : selectedProviderOption?.models || [],
        }),
      });
      setSuccess("Provider added.");
      setShowForm(false);
      setFormProvider("openai");
      setFormDisplayName("");
      setFormApiKey("");
      setFormDefaultModel("");
      setFormAvailableModels([]);
      await fetchConfigs();
    } catch {
      setError("Failed to create provider configuration.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id: number) {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { display_name: editDisplayName, default_model: editDefaultModel };
      if (editApiKey) body.api_key = editApiKey;
      await apiFetch(`/api/v1/ai_provider_configs/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setSuccess("Provider updated.");
      setEditingId(null);
      await fetchConfigs();
    } catch {
      setError("Failed to update provider.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(config: AiProviderConfig) {
    setSaving(true);
    setError(null);
    try {
      const action = config.status === "active" ? "deactivate" : "activate";
      await apiFetch(`/api/v1/ai_provider_configs/${config.id}/${action}`, { method: "POST" });
      setSuccess(`Provider ${action}d.`);
      await fetchConfigs();
    } catch {
      setError("Failed to toggle provider. Ensure an API key is set before activating.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this provider configuration?")) return;
    try {
      await apiFetch(`/api/v1/ai_provider_configs/${id}`, { method: "DELETE" });
      setSuccess("Provider deleted.");
      await fetchConfigs();
    } catch {
      setError("Failed to delete provider.");
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
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">AI Registry</h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {showForm ? "Cancel" : "Add Provider"}
            </button>
          </div>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {success && <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</div>}

          {showForm && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Add AI Provider</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700">Provider</label>
                <select
                  value={formProvider}
                  onChange={(e) => {
                    setFormProvider(e.target.value);
                    setFormDefaultModel("");
                    setFormAvailableModels([]);
                  }}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  {PROVIDER_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Display Name</label>
                <input
                  type="text"
                  value={formDisplayName}
                  onChange={(e) => setFormDisplayName(e.target.value)}
                  placeholder={selectedProviderOption?.label}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">API Key</label>
                <input
                  type="password"
                  value={formApiKey}
                  onChange={(e) => setFormApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Default Model</label>
                <select
                  value={formDefaultModel}
                  onChange={(e) => setFormDefaultModel(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Select model...</option>
                  {selectedProviderOption?.models.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleCreate}
                disabled={saving || !formApiKey}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Provider"}
              </button>
            </div>
          )}

          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : configs.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
              No AI providers configured. Click &quot;Add Provider&quot; to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {configs.map((config) => (
                <div key={config.id} className="rounded-lg border border-gray-200 bg-white p-6">
                  {editingId === config.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editDisplayName}
                        onChange={(e) => setEditDisplayName(e.target.value)}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                      <select
                        value={editDefaultModel}
                        onChange={(e) => setEditDefaultModel(e.target.value)}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      >
                        {config.available_models.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <div>
                        <label className="block text-xs text-gray-500">Change API Key (leave blank to keep current)</label>
                        <input
                          type="password"
                          value={editApiKey}
                          onChange={(e) => setEditApiKey(e.target.value)}
                          placeholder="Leave blank to keep current key"
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdate(config.id)} disabled={saving} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50">Save</button>
                        <button onClick={() => setEditingId(null)} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{config.display_name}</h3>
                          <p className="text-xs text-gray-400">{config.provider_name}</p>
                        </div>
                        <StatusBadge status={config.status} />
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                        <span>Model: <strong>{config.default_model}</strong></span>
                        <span>{config.available_models.length} models available</span>
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingId(config.id);
                            setEditDisplayName(config.display_name);
                            setEditDefaultModel(config.default_model);
                            setEditApiKey("");
                          }}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggle(config)}
                          disabled={saving}
                          className={`rounded-md px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
                            config.status === "active"
                              ? "border border-red-300 text-red-700 hover:bg-red-50"
                              : "bg-green-600 text-white hover:bg-green-700"
                          }`}
                        >
                          {config.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDelete(config.id)}
                          className="rounded-md border border-red-300 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
