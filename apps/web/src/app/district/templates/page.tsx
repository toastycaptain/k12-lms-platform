"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

interface TemplateRow {
  id: number;
  name: string;
  status: string;
  subject: string | null;
  grade_level: string | null;
}

interface SchoolRow {
  id: number;
  name: string;
  tenant_id: number;
}

interface PushResult {
  tenant_id: number;
  school: string;
  template_id: number;
  template_name: string;
}

export default function DistrictTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [selectedTenantIds, setSelectedTenantIds] = useState<number[]>([]);
  const [pushResults, setPushResults] = useState<PushResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [templatesData, schoolsData] = await Promise.all([
          apiFetch<TemplateRow[]>("/api/v1/templates"),
          apiFetch<SchoolRow[]>("/api/v1/district/schools"),
        ]);
        setTemplates(templatesData);
        setSchools(schoolsData);
        setSelectedTemplateId(templatesData[0]?.id || null);
      } catch {
        setError("Unable to load district template data.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const selectedTemplate = useMemo(() => {
    return templates.find((template) => template.id === selectedTemplateId) || null;
  }, [selectedTemplateId, templates]);

  async function pushTemplate() {
    if (!selectedTemplateId || selectedTenantIds.length === 0) {
      setError("Select a template and at least one target school.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const response = await apiFetch<{ pushed: PushResult[] }>("/api/v1/district/push_template", {
        method: "POST",
        body: JSON.stringify({
          template_id: selectedTemplateId,
          target_tenant_ids: selectedTenantIds,
        }),
      });
      setPushResults(response.pushed);
    } catch {
      setError("Unable to push template.");
    } finally {
      setSubmitting(false);
    }
  }

  function toggleTenant(tenantId: number) {
    setSelectedTenantIds((previous) => {
      if (previous.includes(tenantId)) {
        return previous.filter((id) => id !== tenantId);
      }
      return [...previous, tenantId];
    });
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">District Templates</h1>
        <p className="mt-1 text-sm text-gray-600">
          Push district templates to selected schools and track distribution status.
        </p>
      </header>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 rounded-lg border border-gray-200 bg-white p-4 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Template</h2>
          {loading ? (
            <div className="h-28 animate-pulse rounded bg-gray-100" />
          ) : (
            <>
              <select
                value={selectedTemplateId ?? ""}
                onChange={(event) => setSelectedTemplateId(Number(event.target.value))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              {selectedTemplate && (
                <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                  <p className="font-medium text-gray-900">{selectedTemplate.name}</p>
                  <p className="mt-1">
                    {selectedTemplate.subject || "General"} •{" "}
                    {selectedTemplate.grade_level || "All Grades"}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">
                    Status: {selectedTemplate.status}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Target Schools
          </h2>
          {loading ? (
            <div className="h-28 animate-pulse rounded bg-gray-100" />
          ) : (
            <div className="space-y-2">
              {schools.map((school) => {
                const checked = selectedTenantIds.includes(school.tenant_id);
                return (
                  <label
                    key={school.id}
                    className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  >
                    <span>{school.name}</span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTenant(school.tenant_id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <button
        onClick={pushTemplate}
        disabled={submitting || loading}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Pushing..." : "Push Template"}
      </button>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Push History
        </h2>
        {pushResults.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No push activity recorded yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {pushResults.map((result) => (
              <li
                key={`${result.tenant_id}-${result.template_id}`}
                className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
              >
                <span className="font-medium text-gray-900">{result.template_name}</span> pushed to{" "}
                <span className="font-medium text-gray-900">{result.school}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
