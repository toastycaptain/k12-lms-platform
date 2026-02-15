"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";

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

const ROLE_OPTIONS = ["admin", "curriculum_lead", "teacher", "student", "guardian"];

export default function UsersAndRolesPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [configs, setConfigs] = useState<IntegrationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState("");

  const [form, setForm] = useState({
    id: "",
    email: "",
    first_name: "",
    last_name: "",
    role: "teacher",
  });

  const isAdmin = user?.roles?.includes("admin") || false;
  const canAccess = isAdmin || user?.roles?.includes("curriculum_lead");

  const oneRosterConfigured = useMemo(
    () => configs.some((row) => row.provider === "oneroster" && row.status === "active"),
    [configs],
  );

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [userRows, integrationRows] = await Promise.all([
          apiFetch<UserRow[]>("/api/v1/users"),
          apiFetch<IntegrationConfig[]>("/api/v1/integration_configs"),
        ]);
        setUsers(userRows);
        setConfigs(integrationRows);
      } catch {
        setError("Failed to load users.");
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, []);

  useEffect(() => {
    async function refetchUsers() {
      try {
        const path = roleFilter ? `/api/v1/users?role=${encodeURIComponent(roleFilter)}` : "/api/v1/users";
        const userRows = await apiFetch<UserRow[]>(path);
        setUsers(userRows);
      } catch {
        setError("Failed to refresh users.");
      }
    }

    void refetchUsers();
  }, [roleFilter]);

  async function saveUser() {
    if (!form.email.trim() || !form.first_name.trim() || !form.last_name.trim()) {
      return;
    }

    setError(null);
    setSuccess(null);

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
        setSuccess("User updated.");
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
        setSuccess("User created.");
      }

      const path = roleFilter ? `/api/v1/users?role=${encodeURIComponent(roleFilter)}` : "/api/v1/users";
      setUsers(await apiFetch<UserRow[]>(path));
      if (!form.id) {
        setForm({ id: "", email: "", first_name: "", last_name: "", role: "teacher" });
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to save user.");
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
          {success && <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</div>}

          {loading ? (
            <p className="text-sm text-gray-500">Loading users...</p>
          ) : (
            <>
              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">User Directory</h2>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="rounded border border-gray-300 px-2 py-1.5 text-sm"
                  >
                    <option value="">All Roles</option>
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
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
                            <span key={`${row.id}-${role}`} className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">{row.email}</p>
                    </button>
                  ))}
                  {users.length === 0 && <p className="text-sm text-gray-500">No users found.</p>}
                </div>
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Create / Edit User</h2>
                  <button
                    onClick={() => setForm({ id: "", email: "", first_name: "", last_name: "", role: "teacher" })}
                    className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    New User
                  </button>
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <input
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="Email"
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                  <input
                    value={form.first_name}
                    onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))}
                    placeholder="First name"
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                  <input
                    value={form.last_name}
                    onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Last name"
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                  <select
                    value={form.role}
                    onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => void saveUser()}
                  disabled={!isAdmin}
                  className="mt-3 rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {form.id ? "Update User" : "Create User"}
                </button>
              </section>

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
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
