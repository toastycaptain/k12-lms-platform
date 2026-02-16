"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";

interface AiTemplate {
  id: number;
  name: string;
  task_type: string;
  status: "draft" | "active" | "archived";
  system_prompt: string;
  user_prompt_template: string;
  variables: string[];
}

const TASK_TYPES = ["lesson_plan", "unit_plan", "differentiation", "assessment", "rewrite"];
const STATUS_OPTIONS = ["draft", "active", "archived"];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    active: "bg-green-100 text-green-800",
    archived: "bg-yellow-200 text-yellow-900",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
}

export default function AiTemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<AiTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    id: "",
    name: "",
    task_type: "lesson_plan",
    status: "draft",
    system_prompt: "",
    user_prompt_template: "",
    variables: "",
  });

  const canAccess = user?.roles?.includes("admin") || false;

  async function loadTemplates() {
    setLoading(true);
    setError(null);

    try {
      const rows = await apiFetch<AiTemplate[]>("/api/v1/ai_templates");
      setTemplates(rows);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load AI templates.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTemplates();
  }, []);

  async function saveTemplate() {
    if (!form.name.trim() || !form.system_prompt.trim() || !form.user_prompt_template.trim()) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const variables = form.variables
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      const payload = {
        name: form.name.trim(),
        task_type: form.task_type,
        status: form.status,
        system_prompt: form.system_prompt,
        user_prompt_template: form.user_prompt_template,
        variables,
      };

      if (form.id) {
        await apiFetch(`/api/v1/ai_templates/${form.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setSuccess("AI template updated.");
      } else {
        await apiFetch("/api/v1/ai_templates", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setSuccess("AI template created.");
      }

      await loadTemplates();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to save AI template.");
    }
  }

  async function deleteTemplate(templateId: number) {
    if (!window.confirm("Delete this AI template?")) return;

    setError(null);
    setSuccess(null);

    try {
      await apiFetch(`/api/v1/ai_templates/${templateId}`, { method: "DELETE" });
      setSuccess("AI template deleted.");
      if (form.id === String(templateId)) {
        setForm({
          id: "",
          name: "",
          task_type: "lesson_plan",
          status: "draft",
          system_prompt: "",
          user_prompt_template: "",
          variables: "",
        });
      }
      await loadTemplates();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to delete AI template.");
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
            <h1 className="text-2xl font-bold text-gray-900">AI Templates</h1>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/ai"
                className="rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                Providers
              </Link>
              <Link
                href="/admin/ai/policies"
                className="rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                Policies
              </Link>
            </div>
          </div>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {success && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</div>
          )}

          {loading ? (
            <p className="text-sm text-gray-500">Loading AI templates...</p>
          ) : (
            <>
              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-gray-900">Templates</h2>
                <div className="mt-3 space-y-2">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="rounded border border-gray-200 bg-gray-50 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() =>
                            setForm({
                              id: String(template.id),
                              name: template.name,
                              task_type: template.task_type,
                              status: template.status,
                              system_prompt: template.system_prompt,
                              user_prompt_template: template.user_prompt_template,
                              variables: (template.variables || []).join(", "),
                            })
                          }
                          className="text-left"
                        >
                          <p className="text-sm font-medium text-gray-900">{template.name}</p>
                          <p className="text-xs text-gray-500">{template.task_type}</p>
                        </button>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={template.status} />
                          <button
                            onClick={() => void deleteTemplate(template.id)}
                            className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {templates.length === 0 && (
                    <p className="text-sm text-gray-500">No templates configured.</p>
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-gray-900">Create / Edit Template</h2>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <input
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Template name"
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                  />
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
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  <input
                    value={form.variables}
                    onChange={(e) => setForm((prev) => ({ ...prev, variables: e.target.value }))}
                    placeholder="Variables (comma-separated)"
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                  />

                  <textarea
                    value={form.system_prompt}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, system_prompt: e.target.value }))
                    }
                    placeholder="System prompt"
                    rows={4}
                    className="rounded border border-gray-300 px-3 py-2 text-sm md:col-span-2"
                  />

                  <textarea
                    value={form.user_prompt_template}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, user_prompt_template: e.target.value }))
                    }
                    placeholder="User prompt template"
                    rows={4}
                    className="rounded border border-gray-300 px-3 py-2 text-sm md:col-span-2"
                  />
                </div>

                <button
                  onClick={() => void saveTemplate()}
                  className="mt-3 rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                >
                  {form.id ? "Update Template" : "Create Template"}
                </button>
              </section>
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
