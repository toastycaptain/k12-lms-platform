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
  effective_curriculum_profile_key: string;
  effective_curriculum_source: "school" | "tenant" | "system" | "course";
}

interface CurriculumSettingsResponse {
  tenant_default_profile_key: string;
  available_profile_keys: string[];
  school_overrides: SchoolOverride[];
}

const ADMIN_ONLY = ["admin"];

export default function AdminCurriculumProfilesPage() {
  const { addToast } = useToast();
  const [profiles, setProfiles] = useState<CurriculumProfile[]>([]);
  const [tenantDefaultProfileKey, setTenantDefaultProfileKey] = useState("");
  const [schoolOverrides, setSchoolOverrides] = useState<SchoolOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      setSchoolOverrides(settings.school_overrides);
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
          school_overrides: schoolOverrides.map((override) => ({
            school_id: override.school_id,
            curriculum_profile_key: override.curriculum_profile_key,
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
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {override.effective_curriculum_source}
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
