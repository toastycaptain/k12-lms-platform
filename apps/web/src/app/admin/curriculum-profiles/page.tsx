"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch, ApiError } from "@/lib/api";
import { useToast } from "@k12/ui";

interface CurriculumProfile {
  key: string;
  label: string;
  version: string;
  description: string;
  jurisdiction: string;
  planner_taxonomy: {
    subject_label: string;
    grade_label: string;
    unit_label: string;
  };
  subject_options: string[];
  grade_or_stage_options: string[];
  framework_defaults: string[];
  status: "active" | "deprecated";
}

interface SchoolOverride {
  school_id: number;
  school_name: string;
  curriculum_profile_key: string | null;
  curriculum_profile_version?: string | null;
  effective_curriculum_profile_key: string;
  effective_curriculum_profile_version?: string;
  effective_curriculum_source: "school" | "tenant" | "system" | "course";
  selected_from?: string;
}

interface LifecycleRelease {
  id: number;
  profile_key: string;
  profile_version: string;
  status: string;
  updated_at: string;
}

interface CourseMappingIssue {
  issue_id: number;
  course_id: number;
  course_name: string;
  reason: string;
  candidate_school_ids: number[];
}

interface CurriculumDiagnostics {
  course_id: number;
  effective: {
    profile_key: string;
    resolved_profile_version: string;
    selected_from: string;
    fallback_reason: string | null;
    resolution_trace_id: string;
    source: string;
  };
}

interface CurriculumSettingsResponse {
  tenant_default_profile_key: string;
  tenant_default_profile_version?: string | null;
  available_profile_keys: string[];
  school_overrides: SchoolOverride[];
  lifecycle_releases?: LifecycleRelease[];
  unresolved_course_mappings?: CourseMappingIssue[];
  diagnostics?: CurriculumDiagnostics | null;
}

const ADMIN_ONLY = ["admin"];

export default function AdminCurriculumProfilesPage() {
  const { addToast } = useToast();
  const [profiles, setProfiles] = useState<CurriculumProfile[]>([]);
  const [tenantDefaultProfileKey, setTenantDefaultProfileKey] = useState("");
  const [tenantDefaultProfileVersion, setTenantDefaultProfileVersion] = useState("");
  const [schoolOverrides, setSchoolOverrides] = useState<SchoolOverride[]>([]);
  const [lifecycleReleases, setLifecycleReleases] = useState<LifecycleRelease[]>([]);
  const [courseMappingIssues, setCourseMappingIssues] = useState<CourseMappingIssue[]>([]);
  const [diagnostics, setDiagnostics] = useState<CurriculumDiagnostics | null>(null);
  const [diagnosticsCourseId, setDiagnosticsCourseId] = useState("");
  const [lifecycleProfileKey, setLifecycleProfileKey] = useState("");
  const [lifecycleProfileVersion, setLifecycleProfileVersion] = useState("");
  const [rollbackToVersion, setRollbackToVersion] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [runningLifecycle, setRunningLifecycle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profilesByKey = useMemo(() => {
    const map = new Map<string, CurriculumProfile>();
    profiles.forEach((profile) => map.set(profile.key, profile));
    return map;
  }, [profiles]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [profileRows, settings] = await Promise.all([
        apiFetch<CurriculumProfile[]>("/api/v1/curriculum_profiles"),
        apiFetch<CurriculumSettingsResponse>("/api/v1/admin/curriculum_settings"),
      ]);

      setProfiles(profileRows);
      setTenantDefaultProfileKey(settings.tenant_default_profile_key);
      setTenantDefaultProfileVersion(settings.tenant_default_profile_version || "");
      setSchoolOverrides(settings.school_overrides);
      setLifecycleReleases(settings.lifecycle_releases || []);
      setCourseMappingIssues(settings.unresolved_course_mappings || []);
      setDiagnostics(settings.diagnostics || null);

      if (!lifecycleProfileKey) {
        setLifecycleProfileKey(settings.tenant_default_profile_key);
      }
      if (!lifecycleProfileVersion && settings.tenant_default_profile_version) {
        setLifecycleProfileVersion(settings.tenant_default_profile_version);
      }
    } catch (loadError) {
      const message =
        loadError instanceof ApiError ? loadError.message : "Failed to load curriculum settings.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleSave(): Promise<void> {
    setSaving(true);
    setError(null);

    try {
      await apiFetch<CurriculumSettingsResponse>("/api/v1/admin/curriculum_settings", {
        method: "PUT",
        body: JSON.stringify({
          tenant_default_profile_key: tenantDefaultProfileKey,
          tenant_default_profile_version: tenantDefaultProfileVersion || null,
          school_overrides: schoolOverrides.map((override) => ({
            school_id: override.school_id,
            curriculum_profile_key: override.curriculum_profile_key,
            curriculum_profile_version: override.curriculum_profile_version || null,
          })),
        }),
      });

      addToast("success", "Curriculum settings saved.");
      await loadData();
    } catch (saveError) {
      const message =
        saveError instanceof ApiError ? saveError.message : "Failed to save curriculum settings.";
      setError(message);
      addToast("error", message);
    } finally {
      setSaving(false);
    }
  }

  async function runLifecycleOperation(operation: string): Promise<void> {
    setRunningLifecycle(true);
    setError(null);

    try {
      await apiFetch("/api/v1/admin/curriculum_settings/import", {
        method: "POST",
        body: JSON.stringify({
          operation,
          profile_key: lifecycleProfileKey,
          profile_version: lifecycleProfileVersion,
          rollback_to_version: rollbackToVersion || null,
        }),
      });

      addToast("success", `Lifecycle operation '${operation}' completed.`);
      await loadData();
    } catch (opError) {
      const message =
        opError instanceof ApiError
          ? opError.message
          : `Failed to run lifecycle operation '${operation}'.`;
      setError(message);
      addToast("error", message);
    } finally {
      setRunningLifecycle(false);
    }
  }

  async function runDiagnostics(): Promise<void> {
    if (!diagnosticsCourseId.trim()) return;

    setError(null);
    try {
      const response = await apiFetch<CurriculumSettingsResponse>(
        `/api/v1/admin/curriculum_settings?course_id=${encodeURIComponent(diagnosticsCourseId.trim())}`,
      );
      setDiagnostics(response.diagnostics || null);
    } catch (diagnosticsError) {
      const message =
        diagnosticsError instanceof ApiError
          ? diagnosticsError.message
          : "Failed to load diagnostics.";
      setError(message);
      addToast("error", message);
    }
  }

  async function resolveCourseMapping(issueId: number, schoolId: number): Promise<void> {
    setError(null);
    try {
      await apiFetch<CurriculumSettingsResponse>("/api/v1/admin/curriculum_settings", {
        method: "PUT",
        body: JSON.stringify({
          course_mapping_resolutions: [{ issue_id: issueId, school_id: schoolId }],
        }),
      });
      addToast("success", "Course mapping resolved.");
      await loadData();
    } catch (resolveError) {
      const message =
        resolveError instanceof ApiError
          ? resolveError.message
          : "Failed to resolve course mapping.";
      setError(message);
      addToast("error", message);
    }
  }

  function setSchoolOverride(schoolId: number, key: string): void {
    setSchoolOverrides((current) =>
      current.map((override) =>
        override.school_id === schoolId
          ? {
              ...override,
              curriculum_profile_key: key ? key : null,
            }
          : override,
      ),
    );
  }

  return (
    <ProtectedRoute requiredRoles={ADMIN_ONLY} unauthorizedRedirect="/dashboard">
      <AppShell>
        <div className="mx-auto max-w-6xl space-y-6">
          <header>
            <h1 className="text-2xl font-bold text-gray-900">Curriculum Profiles</h1>
            <p className="mt-1 text-sm text-gray-600">
              Admin-only controls for tenant default profile and school-level overrides.
            </p>
          </header>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {loading ? (
            <p className="text-sm text-gray-500">Loading curriculum settings...</p>
          ) : (
            <>
              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-gray-900">Tenant Default Profile</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Applied when no school or course override exists.
                </p>
                <div className="mt-3 max-w-sm">
                  <div className="grid gap-2">
                    <select
                      value={tenantDefaultProfileKey}
                      onChange={(event) => setTenantDefaultProfileKey(event.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      {profiles.map((profile) => (
                        <option key={profile.key} value={profile.key}>
                          {profile.label} ({profile.version})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={tenantDefaultProfileVersion}
                      onChange={(event) => setTenantDefaultProfileVersion(event.target.value)}
                      placeholder="Default version (optional)"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-gray-900">School Overrides</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Each school can inherit tenant default or use a profile override.
                </p>

                {schoolOverrides.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">
                    No schools available for this tenant.
                  </p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                          <th className="px-3 py-2">School</th>
                          <th className="px-3 py-2">Override</th>
                          <th className="px-3 py-2">Effective</th>
                          <th className="px-3 py-2">Source</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {schoolOverrides.map((override) => (
                          <tr key={override.school_id}>
                            <td className="px-3 py-2 font-medium text-gray-900">
                              {override.school_name}
                            </td>
                            <td className="px-3 py-2">
                              <select
                                value={override.curriculum_profile_key || ""}
                                onChange={(event) =>
                                  setSchoolOverride(override.school_id, event.target.value)
                                }
                                className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                              >
                                <option value="">Inherit tenant default</option>
                                {profiles.map((profile) => (
                                  <option key={profile.key} value={profile.key}>
                                    {profile.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2 text-gray-700">
                              {profilesByKey.get(override.effective_curriculum_profile_key)
                                ?.label || override.effective_curriculum_profile_key}
                              {override.effective_curriculum_profile_version
                                ? ` @${override.effective_curriculum_profile_version}`
                                : ""}
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {override.selected_from || override.effective_curriculum_source}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-gray-900">Profile Pack Ingestion</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Framework/profile import and ingestion are admin-only operations. Use this surface
                  for managed profile pack rollout in future waves.
                </p>
                <div className="mt-4 grid gap-2 md:grid-cols-3">
                  <input
                    type="text"
                    value={lifecycleProfileKey}
                    onChange={(event) => setLifecycleProfileKey(event.target.value)}
                    placeholder="profile key"
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    value={lifecycleProfileVersion}
                    onChange={(event) => setLifecycleProfileVersion(event.target.value)}
                    placeholder="profile version"
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    value={rollbackToVersion}
                    onChange={(event) => setRollbackToVersion(event.target.value)}
                    placeholder="rollback target version"
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={runningLifecycle}
                    onClick={() => void runLifecycleOperation("publish")}
                    className="rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
                  >
                    Publish
                  </button>
                  <button
                    type="button"
                    disabled={runningLifecycle}
                    onClick={() => void runLifecycleOperation("deprecate")}
                    className="rounded-md bg-amber-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
                  >
                    Deprecate
                  </button>
                  <button
                    type="button"
                    disabled={runningLifecycle}
                    onClick={() => void runLifecycleOperation("freeze")}
                    className="rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
                  >
                    Freeze
                  </button>
                  <button
                    type="button"
                    disabled={runningLifecycle}
                    onClick={() => void runLifecycleOperation("rollback")}
                    className="rounded-md bg-rose-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
                  >
                    Rollback
                  </button>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                        <th className="px-3 py-2">Profile</th>
                        <th className="px-3 py-2">Version</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Updated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {lifecycleReleases.map((release) => (
                        <tr key={release.id}>
                          <td className="px-3 py-2">{release.profile_key}</td>
                          <td className="px-3 py-2">{release.profile_version}</td>
                          <td className="px-3 py-2">{release.status}</td>
                          <td className="px-3 py-2">
                            {new Date(release.updated_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-gray-900">Profile Catalog</h2>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {profiles.map((profile) => (
                    <article
                      key={profile.key}
                      className="rounded border border-gray-200 bg-gray-50 p-3"
                    >
                      <h3 className="text-sm font-semibold text-gray-900">
                        {profile.label}{" "}
                        <span className="text-xs text-gray-500">({profile.version})</span>
                      </h3>
                      <p className="mt-1 text-xs text-gray-600">{profile.description}</p>
                      <p className="mt-2 text-xs text-gray-500">
                        Jurisdiction: {profile.jurisdiction}
                      </p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-gray-900">Resolver Diagnostics</h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={diagnosticsCourseId}
                    onChange={(event) => setDiagnosticsCourseId(event.target.value)}
                    placeholder="Course ID"
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => void runDiagnostics()}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Resolve Context
                  </button>
                </div>
                {diagnostics && (
                  <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                    <div>Profile: {diagnostics.effective.profile_key}</div>
                    <div>Version: {diagnostics.effective.resolved_profile_version}</div>
                    <div>Selected from: {diagnostics.effective.selected_from}</div>
                    <div>Fallback reason: {diagnostics.effective.fallback_reason || "none"}</div>
                    <div>Trace: {diagnostics.effective.resolution_trace_id}</div>
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-gray-900">Course Mapping Remediation</h2>
                {courseMappingIssues.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-500">No unresolved course mappings.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {courseMappingIssues.map((issue) => (
                      <div
                        key={issue.issue_id}
                        className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm"
                      >
                        <div className="font-medium text-gray-900">
                          {issue.course_name} (#{issue.course_id})
                        </div>
                        <div className="text-xs text-gray-600">Reason: {issue.reason}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {schoolOverrides
                            .filter((school) =>
                              issue.candidate_school_ids.includes(school.school_id),
                            )
                            .map((school) => (
                              <button
                                key={`${issue.issue_id}-${school.school_id}`}
                                type="button"
                                onClick={() =>
                                  void resolveCourseMapping(issue.issue_id, school.school_id)
                                }
                                className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-white"
                              >
                                Assign {school.school_name}
                              </button>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => void loadData()}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Curriculum Settings"}
                </button>
              </div>
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
