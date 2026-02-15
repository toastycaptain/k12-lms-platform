"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";

interface AiProviderConfig {
  id: number;
  display_name: string;
  provider_name: string;
}

interface AiTaskPolicy {
  id: number;
  ai_provider_config_id: number;
  task_type: string;
  enabled: boolean;
  allowed_roles: string[];
  max_tokens_limit: number | null;
  temperature_limit: number | null;
  model_override: string | null;
  requires_approval: boolean;
}

const TASK_TYPES = ["lesson_plan", "unit_plan", "differentiation", "assessment", "rewrite"];
const ROLE_OPTIONS = ["admin", "curriculum_lead", "teacher"];

export default function AiPoliciesPage() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<AiTaskPolicy[]>([]);
  const [providers, setProviders] = useState<AiProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    id: "",
    ai_provider_config_id: "",
    task_type: "lesson_plan",
    enabled: true,
    requires_approval: false,
    allowed_roles: ["teacher"] as string[],
    max_tokens_limit: "4096",
    temperature_limit: "0.7",
    model_override: "",
  });

  const canAccess = user?.roles?.includes("admin") || false;

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const [policyRows, providerRows] = await Promise.all([
        apiFetch<AiTaskPolicy[]>("/api/v1/ai_task_policies"),
        apiFetch<AiProviderConfig[]>("/api/v1/ai_provider_configs"),
      ]);
      setPolicies(policyRows);
      setProviders(providerRows);
      if (!form.ai_provider_config_id && providerRows[0]) {
        setForm((prev) => ({ ...prev, ai_provider_config_id: String(providerRows[0].id) }));
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load AI policies.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function toggleRole(roleName: string) {
    setForm((prev) => {
      const exists = prev.allowed_roles.includes(roleName);
      return {
        ...prev,
        allowed_roles: exists
          ? prev.allowed_roles.filter((r) => r !== roleName)
          : [...prev.allowed_roles, roleName],
      };
    });
  }

  async function savePolicy() {
    if (!form.ai_provider_config_id) return;

    setError(null);
    setSuccess(null);

    try {
      const payload = {
        ai_provider_config_id: Number(form.ai_provider_config_id),
        task_type: form.task_type,
        enabled: form.enabled,
        requires_approval: form.requires_approval,
        allowed_roles: form.allowed_roles,
        max_tokens_limit: form.max_tokens_limit ? Number(form.max_tokens_limit) : null,
        temperature_limit: form.temperature_limit ? Number(form.temperature_limit) : null,
        model_override: form.model_override.trim() || null,
      };

      if (form.id) {
        await apiFetch(`/api/v1/ai_task_policies/${form.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setSuccess("AI policy updated.");
      } else {
        await apiFetch("/api/v1/ai_task_policies", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setSuccess("AI policy created.");
      }

      await loadData();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to save AI policy.");
    }
  }

  async function deletePolicy(policyId: number) {
    if (!window.confirm("Delete this AI policy?")) return;

    setError(null);
    setSuccess(null);

    try {
      await apiFetch(`/api/v1/ai_task_policies/${policyId}`, { method: "DELETE" });
      setSuccess("AI policy deleted.");
      if (form.id === String(policyId)) {
        setForm((prev) => ({ ...prev, id: "" }));
      }
      await loadData();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to delete AI policy.");
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
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">AI Policies</h1>
            <div className="flex items-center gap-2">
              <Link href="/admin/ai" className="rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                Providers
              </Link>
              <Link href="/admin/ai/templates" className="rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                Templates
              </Link>
            </div>
          </div>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {success && <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</div>}

          {loading ? (
            <p className="text-sm text-gray-500">Loading AI policies...</p>
          ) : (
            <>
              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-gray-900">Task Policies</h2>
                <div className="mt-3 space-y-2">
                  {policies.map((policy) => {
                    const provider = providers.find((p) => p.id === policy.ai_provider_config_id);
                    return (
                      <div key={policy.id} className="rounded border border-gray-200 bg-gray-50 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <button
                            onClick={() =>
                              setForm({
                                id: String(policy.id),
                                ai_provider_config_id: String(policy.ai_provider_config_id),
                                task_type: policy.task_type,
                                enabled: policy.enabled,
                                requires_approval: policy.requires_approval,
                                allowed_roles: policy.allowed_roles || [],
                                max_tokens_limit: String(policy.max_tokens_limit || ""),
                                temperature_limit: String(policy.temperature_limit || ""),
                                model_override: policy.model_override || "",
                              })
                            }
                            className="text-left"
                          >
                            <p className="text-sm font-medium text-gray-900">{policy.task_type}</p>
                            <p className="text-xs text-gray-500">
                              {provider ? `${provider.display_name} (${provider.provider_name})` : `Provider #${policy.ai_provider_config_id}`}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              max_tokens: {policy.max_tokens_limit || "-"} · temperature: {policy.temperature_limit ?? "-"}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {(policy.allowed_roles || []).map((role) => (
                                <span key={`${policy.id}-${role}`} className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                                  {role}
                                </span>
                              ))}
                            </div>
                          </button>

                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-xs ${policy.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                              {policy.enabled ? "enabled" : "disabled"}
                            </span>
                            <button
                              onClick={() => void deletePolicy(policy.id)}
                              className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {policies.length === 0 && <p className="text-sm text-gray-500">No task policies configured.</p>}
                </div>
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-gray-900">Create / Edit Policy</h2>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <select
                    value={form.task_type}
                    onChange={(e) => setForm((prev) => ({ ...prev, task_type: e.target.value }))}
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                  >
                    {TASK_TYPES.map((taskType) => (
                      <option key={taskType} value={taskType}>
                        {taskType}
                      </option>
                    ))}
                  </select>

                  <select
                    value={form.ai_provider_config_id}
                    onChange={(e) => setForm((prev) => ({ ...prev, ai_provider_config_id: e.target.value }))}
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">Select provider</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.display_name} ({provider.provider_name})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min={1}
                    value={form.max_tokens_limit}
                    onChange={(e) => setForm((prev) => ({ ...prev, max_tokens_limit: e.target.value }))}
                    placeholder="Max tokens"
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                  />

                  <input
                    type="number"
                    min={0}
                    max={2}
                    step={0.1}
                    value={form.temperature_limit}
                    onChange={(e) => setForm((prev) => ({ ...prev, temperature_limit: e.target.value }))}
                    placeholder="Temperature"
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                  />

                  <input
                    type="text"
                    value={form.model_override}
                    onChange={(e) => setForm((prev) => ({ ...prev, model_override: e.target.value }))}
                    placeholder="Model override (optional)"
                    className="rounded border border-gray-300 px-3 py-2 text-sm md:col-span-2"
                  />

                  <div className="md:col-span-2">
                    <p className="mb-1 text-xs font-medium text-gray-700">Allowed roles</p>
                    <div className="flex flex-wrap gap-2">
                      {ROLE_OPTIONS.map((role) => (
                        <label key={role} className="inline-flex items-center gap-1 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={form.allowed_roles.includes(role)}
                            onChange={() => toggleRole(role)}
                          />
                          {role}
                        </label>
                      ))}
                    </div>
                  </div>

                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.enabled}
                      onChange={(e) => setForm((prev) => ({ ...prev, enabled: e.target.checked }))}
                    />
                    Enabled
                  </label>

                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.requires_approval}
                      onChange={(e) => setForm((prev) => ({ ...prev, requires_approval: e.target.checked }))}
                    />
                    Requires approval
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
