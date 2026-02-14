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
}

interface AiTaskPolicyRecord {
  id: number;
  task_type: string;
  allowed_roles: string[];
  ai_provider_config_id: number;
  model_override: string | null;
  max_tokens_limit: number;
  temperature_limit: number;
  requires_approval: boolean;
  enabled: boolean;
  settings: Record<string, unknown>;
}

const TASK_TYPES = [
  { value: "lesson_generation", label: "Lesson Generation" },
  { value: "unit_generation", label: "Unit Generation" },
  { value: "differentiation", label: "Differentiation" },
  { value: "assessment_generation", label: "Assessment Generation" },
  { value: "rewrite", label: "Rewrite" },
];

const ROLES = ["admin", "curriculum_lead", "teacher"];

function TaskTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    lesson_generation: "bg-blue-100 text-blue-800",
    unit_generation: "bg-purple-100 text-purple-800",
    differentiation: "bg-yellow-100 text-yellow-800",
    assessment_generation: "bg-green-100 text-green-800",
    rewrite: "bg-orange-100 text-orange-800",
  };
  const label = TASK_TYPES.find((t) => t.value === type)?.label || type;
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[type] || "bg-gray-100 text-gray-600"}`}>
      {label}
    </span>
  );
}

export default function AiPoliciesPage() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<AiTaskPolicyRecord[]>([]);
  const [providers, setProviders] = useState<AiProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formTaskType, setFormTaskType] = useState("lesson_generation");
  const [formRoles, setFormRoles] = useState<string[]>(["admin", "curriculum_lead", "teacher"]);
  const [formProviderId, setFormProviderId] = useState<number | "">("");
  const [formModelOverride, setFormModelOverride] = useState("");
  const [formMaxTokens, setFormMaxTokens] = useState(4096);
  const [formTempLimit, setFormTempLimit] = useState(1.0);
  const [formRequiresApproval, setFormRequiresApproval] = useState(false);
  const [formEnabled, setFormEnabled] = useState(true);

  const canAccess = user?.roles?.includes("admin");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [policiesData, providersData] = await Promise.all([
        apiFetch<AiTaskPolicyRecord[]>("/api/v1/ai_task_policies"),
        apiFetch<AiProviderConfig[]>("/api/v1/ai_provider_configs"),
      ]);
      setPolicies(policiesData);
      setProviders(providersData);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!formProviderId) {
      setError("Please select a provider.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/api/v1/ai_task_policies", {
        method: "POST",
        body: JSON.stringify({
          task_type: formTaskType,
          allowed_roles: formRoles,
          ai_provider_config_id: formProviderId,
          model_override: formModelOverride || null,
          max_tokens_limit: formMaxTokens,
          temperature_limit: formTempLimit,
          requires_approval: formRequiresApproval,
          enabled: formEnabled,
        }),
      });
      setSuccess("Policy created.");
      setShowForm(false);
      await fetchData();
    } catch {
      setError("Failed to create policy. Each task type can only have one policy.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleEnabled(policy: AiTaskPolicyRecord) {
    try {
      await apiFetch(`/api/v1/ai_task_policies/${policy.id}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: !policy.enabled }),
      });
      await fetchData();
    } catch {
      setError("Failed to update policy.");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this AI policy?")) return;
    try {
      await apiFetch(`/api/v1/ai_task_policies/${id}`, { method: "DELETE" });
      setSuccess("Policy deleted.");
      await fetchData();
    } catch {
      setError("Failed to delete policy.");
    }
  }

  function getProviderName(id: number) {
    return providers.find((p) => p.id === id)?.display_name || "Unknown";
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
            <h1 className="text-2xl font-bold text-gray-900">AI Policies</h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {showForm ? "Cancel" : "Add Policy"}
            </button>
          </div>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {success && <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</div>}

          {showForm && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Add AI Policy</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700">Task Type</label>
                <select value={formTaskType} onChange={(e) => setFormTaskType(e.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                  {TASK_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Allowed Roles</label>
                <div className="mt-1 space-y-1">
                  {ROLES.map((role) => (
                    <label key={role} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formRoles.includes(role)}
                        onChange={(e) => {
                          if (e.target.checked) setFormRoles([...formRoles, role]);
                          else setFormRoles(formRoles.filter((r) => r !== role));
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-gray-700">{role}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">AI Provider</label>
                <select value={formProviderId} onChange={(e) => setFormProviderId(e.target.value ? Number(e.target.value) : "")} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                  <option value="">Select provider...</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>{p.display_name} ({p.provider_name})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Tokens</label>
                  <input type="number" value={formMaxTokens} onChange={(e) => setFormMaxTokens(Number(e.target.value))} min={1} max={16384} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Temperature Limit</label>
                  <input type="number" value={formTempLimit} onChange={(e) => setFormTempLimit(Number(e.target.value))} min={0} max={2} step={0.1} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={formRequiresApproval} onChange={(e) => setFormRequiresApproval(e.target.checked)} className="rounded border-gray-300" />
                  <span className="text-gray-700">Requires approval before use</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={formEnabled} onChange={(e) => setFormEnabled(e.target.checked)} className="rounded border-gray-300" />
                  <span className="text-gray-700">Enabled</span>
                </label>
              </div>
              <button onClick={handleCreate} disabled={saving} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Saving..." : "Create Policy"}
              </button>
            </div>
          )}

          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : policies.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
              No AI policies configured. Add policies to control which AI features are available.
            </div>
          ) : (
            <div className="space-y-3">
              {policies.map((policy) => (
                <div key={policy.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TaskTypeBadge type={policy.task_type} />
                      <span className={`text-xs ${policy.enabled ? "text-green-600" : "text-gray-400"}`}>
                        {policy.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleEnabled(policy)}
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        {policy.enabled ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => handleDelete(policy.id)}
                        className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                    <span>Provider: {getProviderName(policy.ai_provider_config_id)}</span>
                    {policy.model_override && <span>Model: {policy.model_override}</span>}
                    <span>Max tokens: {policy.max_tokens_limit}</span>
                    <span>Temp: {policy.temperature_limit}</span>
                    {policy.requires_approval && <span className="text-orange-600">Requires approval</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {policy.allowed_roles.map((role) => (
                      <span key={role} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">{role}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
