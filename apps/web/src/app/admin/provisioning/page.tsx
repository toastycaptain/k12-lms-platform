"use client";

import { useState } from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast, Card, EmptyState, Skeleton } from "@k12/ui";
import { FormActions, FormField, Select, TextInput } from "@k12/ui/forms";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";

interface ProvisionPayload {
  school_name: string;
  admin_email: string;
  admin_first_name: string;
  admin_last_name: string;
  subdomain: string;
  district?: string;
  curriculum_default_profile_key?: string;
}

interface ProvisionResponse {
  tenant_id: number;
  tenant_slug: string;
  school_id: number;
  admin_id: number;
  admin_email: string;
  setup_token: string;
}

interface ProvisionedTenant {
  id: number;
  name: string;
  slug: string;
  completion_percentage: number;
  created_at: string;
}

interface CurriculumProfile {
  key: string;
  label: string;
  version: string;
}

export default function AdminProvisioningPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { user } = useAuth();
  const canAccess = user?.roles?.includes("admin") || false;

  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ProvisionPayload>({
    school_name: "",
    admin_email: "",
    admin_first_name: "",
    admin_last_name: "",
    subdomain: "",
    district: "",
    curriculum_default_profile_key: "",
  });
  const submitDisabled =
    !form.school_name.trim() ||
    !form.admin_email.trim() ||
    !form.admin_first_name.trim() ||
    !form.admin_last_name.trim() ||
    !form.subdomain.trim();

  const {
    data,
    isLoading,
    error: listError,
    mutate,
  } = useSWR<ProvisionedTenant[]>("/api/v1/admin/provisioning/tenants", apiFetch);
  const { data: curriculumProfiles } = useSWR<CurriculumProfile[]>(
    "/api/v1/curriculum_profiles",
    apiFetch,
  );

  const { trigger, isMutating } = useSWRMutation(
    "/api/v1/admin/provisioning/create_school",
    async (url: string, { arg }: { arg: ProvisionPayload }) => {
      return apiFetch<ProvisionResponse>(url, {
        method: "POST",
        body: JSON.stringify({ school: arg }),
      });
    },
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const payload = {
        ...form,
        school_name: form.school_name.trim(),
        admin_email: form.admin_email.trim(),
        admin_first_name: form.admin_first_name.trim(),
        admin_last_name: form.admin_last_name.trim(),
        subdomain: form.subdomain.trim(),
        district: form.district?.trim() || undefined,
        curriculum_default_profile_key:
          form.curriculum_default_profile_key || curriculumProfiles?.[0]?.key || undefined,
      };
      await trigger(payload);
      addToast("success", "School provisioned successfully.");
      await mutate();
      router.push("/admin/users");
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Provisioning failed.";
      setError(message);
      addToast("error", message);
    }
  }

  if (!canAccess) {
    return (
      <ProtectedRoute requiredRoles={["admin"]} unauthorizedRedirect="/dashboard">
        <AppShell>
          <p className="text-gray-500">Access restricted to administrators.</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={["admin"]} unauthorizedRedirect="/dashboard">
      <AppShell>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Provision New School</h1>

          <Card>
            <h2 className="text-lg font-semibold text-gray-900">Provision New School</h2>
            {error && (
              <div className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <FormField label="School Name" htmlFor="provision-school-name" required>
                  <TextInput
                    id="provision-school-name"
                    value={form.school_name}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, school_name: event.target.value }))
                    }
                    required
                  />
                </FormField>

                <FormField label="Subdomain" htmlFor="provision-subdomain" required>
                  <TextInput
                    id="provision-subdomain"
                    value={form.subdomain}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, subdomain: event.target.value }))
                    }
                    placeholder="example-school"
                    required
                  />
                </FormField>

                <FormField label="Admin Email" htmlFor="provision-admin-email" required>
                  <TextInput
                    id="provision-admin-email"
                    type="email"
                    value={form.admin_email}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, admin_email: event.target.value }))
                    }
                    required
                  />
                </FormField>

                <FormField label="District (Optional)" htmlFor="provision-district">
                  <TextInput
                    id="provision-district"
                    value={form.district || ""}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, district: event.target.value }))
                    }
                  />
                </FormField>

                <FormField
                  label="Default Curriculum Profile"
                  htmlFor="provision-curriculum-default-profile"
                >
                  <Select
                    id="provision-curriculum-default-profile"
                    value={
                      form.curriculum_default_profile_key || curriculumProfiles?.[0]?.key || ""
                    }
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        curriculum_default_profile_key: event.target.value,
                      }))
                    }
                  >
                    {(curriculumProfiles || []).map((profile) => (
                      <option key={profile.key} value={profile.key}>
                        {profile.label} ({profile.version})
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Admin First Name" htmlFor="provision-admin-first-name" required>
                  <TextInput
                    id="provision-admin-first-name"
                    value={form.admin_first_name}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, admin_first_name: event.target.value }))
                    }
                    required
                  />
                </FormField>

                <FormField label="Admin Last Name" htmlFor="provision-admin-last-name" required>
                  <TextInput
                    id="provision-admin-last-name"
                    value={form.admin_last_name}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, admin_last_name: event.target.value }))
                    }
                    required
                  />
                </FormField>
              </div>

              <FormActions
                submitLabel="Provision School"
                submittingLabel="Provisioning..."
                submitting={isMutating}
                submitDisabled={submitDisabled}
              />
            </form>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-gray-900">Recently Provisioned Schools</h2>

            {isLoading && (
              <div className="mt-3 space-y-2">
                <Skeleton variant="line" />
                <Skeleton variant="line" />
                <Skeleton variant="line" />
              </div>
            )}

            {!isLoading && listError && (
              <p className="mt-3 text-sm text-gray-600">
                View provisioned schools in the Users section.
              </p>
            )}

            {!isLoading && !listError && data && data.length > 0 && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-2 py-2">School</th>
                      <th className="px-2 py-2">Tenant Slug</th>
                      <th className="px-2 py-2">Onboarding</th>
                      <th className="px-2 py-2">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.map((tenant) => (
                      <tr key={tenant.id}>
                        <td className="px-2 py-2 text-gray-900">{tenant.name}</td>
                        <td className="px-2 py-2 font-mono text-xs text-gray-700">{tenant.slug}</td>
                        <td className="px-2 py-2 text-gray-700">{tenant.completion_percentage}%</td>
                        <td className="px-2 py-2 text-gray-700">
                          {new Date(tenant.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!isLoading && !listError && (!data || data.length === 0) && (
              <div className="mt-3">
                <EmptyState
                  title="No provisioned schools yet"
                  description="Newly provisioned schools will appear here."
                />
              </div>
            )}
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
