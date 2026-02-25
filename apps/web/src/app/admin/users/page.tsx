"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@k12/ui";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { EmptyState } from "@k12/ui";
import { Pagination } from "@k12/ui";
import { FormActions, FormField, Select, TextInput } from "@k12/ui/forms";

interface UserRow {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  roles: string[];
}

interface IntegrationConfig {
  id: number;
  provider: string;
  status: string;
}

interface GuardianLinkRow {
  id: number;
  guardian_id: number;
  student_id: number;
  relationship: string;
  status: string;
  guardian?: { id: number; first_name: string; last_name: string; email: string };
  student?: { id: number; first_name: string; last_name: string; email: string };
}

const ROLE_OPTIONS = ["admin", "curriculum_lead", "teacher", "student", "guardian"];

export default function UsersAndRolesPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [configs, setConfigs] = useState<IntegrationConfig[]>([]);
  const [guardianLinks, setGuardianLinks] = useState<GuardianLinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [totalPages, setTotalPages] = useState(1);

  const [form, setForm] = useState({
    id: "",
    email: "",
    first_name: "",
    last_name: "",
    role: "teacher",
  });
  const [linkForm, setLinkForm] = useState({
    guardian_id: "",
    student_id: "",
  });

  const isAdmin = user?.roles?.includes("admin") || false;
  const canAccess = isAdmin || user?.roles?.includes("curriculum_lead");

  const oneRosterConfigured = useMemo(
    () => configs.some((row) => row.provider === "oneroster" && row.status === "active"),
    [configs],
  );
  const userFormInvalid =
    !form.email.trim() || !form.first_name.trim() || !form.last_name.trim() || !form.role.trim();
  const guardianUsers = useMemo(
    () => users.filter((candidate) => candidate.roles.includes("guardian")),
    [users],
  );
  const studentUsers = useMemo(
    () => users.filter((candidate) => candidate.roles.includes("student")),
    [users],
  );

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [userRows, integrationRows] = await Promise.all([
          apiFetch<UserRow[]>(`/api/v1/users?page=${page}&per_page=${perPage}`),
          apiFetch<IntegrationConfig[]>("/api/v1/integration_configs"),
        ]);
        setUsers(userRows);
        setConfigs(integrationRows);
        setTotalPages(userRows.length < perPage ? page : page + 1);
      } catch {
        setError("Failed to load users.");
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, [page, perPage]);

  const fetchGuardianLinks = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const rows = await apiFetch<GuardianLinkRow[]>("/api/v1/guardian_links?per_page=200");
      setGuardianLinks(rows);
    } catch {
      setError("Failed to load guardian links.");
    }
  }, [isAdmin]);

  useEffect(() => {
    void fetchGuardianLinks();
  }, [fetchGuardianLinks]);

  useEffect(() => {
    async function refetchUsers() {
      try {
        const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
        if (roleFilter) params.set("role", roleFilter);
        const userRows = await apiFetch<UserRow[]>(`/api/v1/users?${params.toString()}`);
        setUsers(userRows);
        setTotalPages(userRows.length < perPage ? page : page + 1);
      } catch {
        setError("Failed to refresh users.");
      }
    }

    void refetchUsers();
  }, [roleFilter, page, perPage]);

  async function saveUser() {
    if (!form.email.trim() || !form.first_name.trim() || !form.last_name.trim()) {
      return;
    }

    try {
      if (form.id) {
        await apiFetch(`/api/v1/users/${form.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            user: {
              email: form.email.trim(),
              first_name: form.first_name.trim(),
              last_name: form.last_name.trim(),
              roles: form.role ? [form.role] : [],
            },
          }),
        });
        addToast("success", "User updated.");
      } else {
        await apiFetch("/api/v1/users", {
          method: "POST",
          body: JSON.stringify({
            user: {
              email: form.email.trim(),
              first_name: form.first_name.trim(),
              last_name: form.last_name.trim(),
              roles: form.role ? [form.role] : [],
            },
          }),
        });
        addToast("success", "User created.");
      }

      const saveParams = new URLSearchParams({ page: String(page), per_page: String(perPage) });
      if (roleFilter) saveParams.set("role", roleFilter);
      setUsers(await apiFetch<UserRow[]>(`/api/v1/users?${saveParams.toString()}`));
      if (!form.id) {
        setForm({ id: "", email: "", first_name: "", last_name: "", role: "teacher" });
      }
    } catch (e) {
      addToast("error", e instanceof ApiError ? e.message : "Failed to save user.");
    }
  }

  async function createGuardianLink() {
    if (!linkForm.guardian_id || !linkForm.student_id) {
      return;
    }

    try {
      await apiFetch("/api/v1/guardian_links", {
        method: "POST",
        body: JSON.stringify({
          guardian_id: Number(linkForm.guardian_id),
          student_id: Number(linkForm.student_id),
          relationship: "guardian",
          status: "active",
        }),
      });
      await fetchGuardianLinks();
      setLinkForm({ guardian_id: "", student_id: "" });
      addToast("success", "Guardian linked.");
    } catch (e) {
      addToast("error", e instanceof ApiError ? e.message : "Unable to link guardian.");
    }
  }

  async function removeGuardianLink(id: number) {
    try {
      await apiFetch(`/api/v1/guardian_links/${id}`, { method: "DELETE" });
      await fetchGuardianLinks();
      addToast("success", "Guardian link removed.");
    } catch (e) {
      addToast("error", e instanceof ApiError ? e.message : "Unable to remove guardian link.");
    }
  }

  if (!canAccess) {
    return (
      <ProtectedRoute>
        <AppShell>
          <p className="text-gray-500">Access restricted to administrators and curriculum leads.</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Users & Roles</h1>

          {!isAdmin && (
            <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
              Read-only mode: only administrators can create or edit users.
            </div>
          )}
          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {loading ? (
            <ListSkeleton />
          ) : (
            <>
              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">User Directory</h2>
                  <div className="w-full sm:w-52">
                    <FormField label="Filter by Role" htmlFor="role-filter">
                      <Select
                        id="role-filter"
                        value={roleFilter}
                        onChange={(event) => setRoleFilter(event.target.value)}
                      >
                        <option value="">All Roles</option>
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {users.map((row) => (
                    <button
                      key={row.id}
                      onClick={() =>
                        setForm({
                          id: String(row.id),
                          email: row.email,
                          first_name: row.first_name,
                          last_name: row.last_name,
                          role: row.roles[0] || "teacher",
                        })
                      }
                      className="block w-full rounded border border-gray-200 bg-gray-50 px-3 py-2 text-left hover:bg-gray-100"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-gray-900">
                          {row.first_name} {row.last_name}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {row.roles.map((role) => (
                            <span
                              key={`${row.id}-${role}`}
                              className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800"
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">{row.email}</p>
                    </button>
                  ))}
                  {users.length === 0 && (
                    <EmptyState
                      title="No users found"
                      description="Users matching the current filter will appear here."
                    />
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Create / Edit User</h2>
                  <button
                    onClick={() =>
                      setForm({ id: "", email: "", first_name: "", last_name: "", role: "teacher" })
                    }
                    className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    New User
                  </button>
                </div>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void saveUser();
                  }}
                  className="mt-3 space-y-3"
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <FormField label="Email" htmlFor="user-email" required>
                      <TextInput
                        id="user-email"
                        type="email"
                        value={form.email}
                        onChange={(event) =>
                          setForm((previous) => ({ ...previous, email: event.target.value }))
                        }
                        placeholder="Email"
                        required
                      />
                    </FormField>

                    <FormField label="First Name" htmlFor="user-first-name" required>
                      <TextInput
                        id="user-first-name"
                        value={form.first_name}
                        onChange={(event) =>
                          setForm((previous) => ({ ...previous, first_name: event.target.value }))
                        }
                        placeholder="First name"
                        required
                      />
                    </FormField>

                    <FormField label="Last Name" htmlFor="user-last-name" required>
                      <TextInput
                        id="user-last-name"
                        value={form.last_name}
                        onChange={(event) =>
                          setForm((previous) => ({ ...previous, last_name: event.target.value }))
                        }
                        placeholder="Last name"
                        required
                      />
                    </FormField>

                    <FormField label="Role" htmlFor="user-role" required>
                      <Select
                        id="user-role"
                        value={form.role}
                        onChange={(event) =>
                          setForm((previous) => ({ ...previous, role: event.target.value }))
                        }
                        required
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  </div>

                  <FormActions
                    submitLabel={form.id ? "Update User" : "Create User"}
                    submitDisabled={!isAdmin || userFormInvalid}
                  />
                </form>
              </section>

              {isAdmin && (
                <section className="rounded-lg border border-gray-200 bg-white p-5">
                  <h2 className="text-lg font-semibold text-gray-900">Guardian Links</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Link guardian accounts to student records for read-only portal access.
                  </p>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <FormField label="Guardian" htmlFor="guardian-link-guardian" required>
                      <Select
                        id="guardian-link-guardian"
                        value={linkForm.guardian_id}
                        onChange={(event) =>
                          setLinkForm((previous) => ({
                            ...previous,
                            guardian_id: event.target.value,
                          }))
                        }
                      >
                        <option value="">Select guardian</option>
                        {guardianUsers.map((row) => (
                          <option key={row.id} value={row.id}>
                            {row.first_name} {row.last_name} ({row.email})
                          </option>
                        ))}
                      </Select>
                    </FormField>

                    <FormField label="Student" htmlFor="guardian-link-student" required>
                      <Select
                        id="guardian-link-student"
                        value={linkForm.student_id}
                        onChange={(event) =>
                          setLinkForm((previous) => ({
                            ...previous,
                            student_id: event.target.value,
                          }))
                        }
                      >
                        <option value="">Select student</option>
                        {studentUsers.map((row) => (
                          <option key={row.id} value={row.id}>
                            {row.first_name} {row.last_name} ({row.email})
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  </div>

                  <button
                    type="button"
                    onClick={() => void createGuardianLink()}
                    disabled={!linkForm.guardian_id || !linkForm.student_id}
                    className="mt-3 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-60"
                  >
                    Link Guardian
                  </button>

                  <div className="mt-4 space-y-2">
                    {guardianLinks.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center justify-between rounded border border-gray-200 px-3 py-2 text-sm"
                      >
                        <div className="text-gray-700">
                          {link.guardian?.first_name || "Guardian"} {link.guardian?.last_name || ""}
                          {" → "}
                          {link.student?.first_name || "Student"} {link.student?.last_name || ""}
                        </div>
                        <button
                          type="button"
                          className="text-xs text-red-700 hover:text-red-800"
                          onClick={() => void removeGuardianLink(link.id)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {guardianLinks.length === 0 && (
                      <p className="text-sm text-gray-500">No guardian links created yet.</p>
                    )}
                  </div>
                </section>
              )}

              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-gray-900">Bulk Import</h2>
                <p className="mt-2 text-sm text-gray-600">
                  {oneRosterConfigured
                    ? "OneRoster sync available. Use Integrations to run user and enrollment sync."
                    : "Configure OneRoster integration to enable SIS user import."}
                </p>
              </section>
            </>
          )}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            perPage={perPage}
            onPerPageChange={(nextPerPage) => {
              setPerPage(nextPerPage);
              setPage(1);
            }}
          />
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
