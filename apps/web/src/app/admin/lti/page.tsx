"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError, getApiOrigin } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/Toast";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";

interface LtiRegistration {
  id: number;
  name: string;
  issuer: string;
  client_id: string;
  deployment_id: string;
  auth_login_url: string;
  auth_token_url: string;
  jwks_url: string;
  description: string | null;
  status: string;
}

interface LtiResourceLink {
  id: number;
  title: string;
  description: string | null;
  url: string | null;
  course_id: number | null;
}

interface CourseRow {
  id: number;
  name: string;
}

function statusClass(status: string) {
  return status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700";
}

function platformBaseUrl() {
  return getApiOrigin();
}

export default function LtiManagementPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [registrations, setRegistrations] = useState<LtiRegistration[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [links, setLinks] = useState<LtiResourceLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [totalPages, setTotalPages] = useState(1);

  const [registrationForm, setRegistrationForm] = useState({
    id: "",
    name: "",
    issuer: "",
    client_id: "",
    deployment_id: "",
    auth_login_url: "",
    auth_token_url: "",
    jwks_url: "",
    description: "",
  });

  const [resourceForm, setResourceForm] = useState({
    title: "",
    description: "",
    url: "",
    course_id: "",
  });

  const selectedRegistrationId = useMemo(() => {
    return registrationForm.id ? Number(registrationForm.id) : null;
  }, [registrationForm.id]);
  const endpoints = useMemo(() => {
    const base = platformBaseUrl();
    return [
      { label: "OIDC Login URL", value: `${base}/lti/oidc_login` },
      { label: "Launch URL", value: `${base}/lti/launch` },
      { label: "JWKS URL", value: `${base}/lti/jwks` },
    ];
  }, []);

  const isAdmin = user?.roles?.includes("admin") || false;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [registrationRows, courseRows] = await Promise.all([
          apiFetch<LtiRegistration[]>(`/api/v1/lti_registrations?page=${page}&per_page=${perPage}`),
          apiFetch<CourseRow[]>("/api/v1/courses"),
        ]);
        setRegistrations(registrationRows);
        setCourses(courseRows);
        setTotalPages(registrationRows.length < perPage ? page : page + 1);

        if (registrationRows[0]) {
          const first = registrationRows[0];
          setRegistrationForm({
            id: String(first.id),
            name: first.name,
            issuer: first.issuer,
            client_id: first.client_id,
            deployment_id: first.deployment_id,
            auth_login_url: first.auth_login_url,
            auth_token_url: first.auth_token_url,
            jwks_url: first.jwks_url,
            description: first.description || "",
          });
        }
      } catch {
        setError("Failed to load LTI data.");
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, [page, perPage]);

  useEffect(() => {
    async function fetchLinks() {
      if (!selectedRegistrationId) {
        setLinks([]);
        return;
      }

      try {
        const linkRows = await apiFetch<LtiResourceLink[]>(
          `/api/v1/lti_registrations/${selectedRegistrationId}/lti_resource_links`,
        );
        setLinks(linkRows);
      } catch {
        setLinks([]);
      }
    }

    void fetchLinks();
  }, [selectedRegistrationId]);

  async function refreshRegistrations() {
    const rows = await apiFetch<LtiRegistration[]>(
      `/api/v1/lti_registrations?page=${page}&per_page=${perPage}`,
    );
    setRegistrations(rows);
  }

  async function saveRegistration() {
    if (!registrationForm.name.trim() || !registrationForm.issuer.trim()) return;

    const payload = {
      lti_registration: {
        name: registrationForm.name.trim(),
        issuer: registrationForm.issuer.trim(),
        client_id: registrationForm.client_id.trim(),
        deployment_id: registrationForm.deployment_id.trim(),
        auth_login_url: registrationForm.auth_login_url.trim(),
        auth_token_url: registrationForm.auth_token_url.trim(),
        jwks_url: registrationForm.jwks_url.trim(),
        description: registrationForm.description.trim() || null,
      },
    };

    try {
      if (registrationForm.id) {
        await apiFetch(`/api/v1/lti_registrations/${registrationForm.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        addToast("success", "LTI registration updated.");
      } else {
        const created = await apiFetch<LtiRegistration>("/api/v1/lti_registrations", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setRegistrationForm((prev) => ({ ...prev, id: String(created.id) }));
        addToast("success", "LTI registration created.");
      }
      await refreshRegistrations();
    } catch (e) {
      addToast("error", e instanceof ApiError ? e.message : "Failed to save registration.");
    }
  }

  async function toggleRegistrationStatus(id: number, currentStatus: string) {
    try {
      const action = currentStatus === "active" ? "deactivate" : "activate";
      await apiFetch(`/api/v1/lti_registrations/${id}/${action}`, { method: "POST" });
      addToast("success", `Registration ${action}d.`);
      await refreshRegistrations();
    } catch (e) {
      addToast(
        "error",
        e instanceof ApiError ? e.message : "Failed to update registration status.",
      );
    }
  }

  async function createResourceLink() {
    if (!selectedRegistrationId || !resourceForm.title.trim()) return;

    try {
      await apiFetch(`/api/v1/lti_registrations/${selectedRegistrationId}/lti_resource_links`, {
        method: "POST",
        body: JSON.stringify({
          lti_resource_link: {
            title: resourceForm.title.trim(),
            description: resourceForm.description.trim() || null,
            url: resourceForm.url.trim() || null,
            course_id: resourceForm.course_id ? Number(resourceForm.course_id) : null,
            custom_params: {},
          },
        }),
      });

      setResourceForm({ title: "", description: "", url: "", course_id: "" });
      addToast("success", "Resource link created.");
      const linkRows = await apiFetch<LtiResourceLink[]>(
        `/api/v1/lti_registrations/${selectedRegistrationId}/lti_resource_links`,
      );
      setLinks(linkRows);
    } catch (e) {
      addToast("error", e instanceof ApiError ? e.message : "Failed to create resource link.");
    }
  }

  async function copyEndpoint(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      addToast("success", `${label} copied.`);
    } catch {
      addToast("error", "Failed to copy endpoint URL.");
    }
  }

  if (!isAdmin) {
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
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">LTI Management</h1>

          <section className="rounded-lg border border-blue-100 bg-blue-50 p-5">
            <h2 className="text-lg font-semibold text-blue-900">Platform Endpoints</h2>
            <p className="mt-1 text-sm text-blue-800">
              Provide these URLs to external tool vendors during LTI 1.3 setup.
            </p>
            <div className="mt-3 space-y-2">
              {endpoints.map((endpoint) => (
                <div
                  key={endpoint.label}
                  className="flex items-center gap-2 rounded border border-blue-200 bg-white px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-blue-900">{endpoint.label}</p>
                    <p className="truncate text-xs text-blue-700">{endpoint.value}</p>
                  </div>
                  <button
                    onClick={() => void copyEndpoint(endpoint.label, endpoint.value)}
                    className="rounded border border-blue-300 px-2 py-1 text-xs text-blue-700 hover:bg-blue-50"
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
          </section>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {loading ? (
            <ListSkeleton />
          ) : (
            <>
              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Registrations</h2>
                  <button
                    onClick={() =>
                      setRegistrationForm({
                        id: "",
                        name: "",
                        issuer: "",
                        client_id: "",
                        deployment_id: "",
                        auth_login_url: "",
                        auth_token_url: "",
                        jwks_url: "",
                        description: "",
                      })
                    }
                    className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    New Registration
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  {registrations.map((row) => (
                    <div
                      key={row.id}
                      className="rounded border border-gray-200 bg-gray-50 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <button
                          onClick={() =>
                            setRegistrationForm({
                              id: String(row.id),
                              name: row.name,
                              issuer: row.issuer,
                              client_id: row.client_id,
                              deployment_id: row.deployment_id,
                              auth_login_url: row.auth_login_url,
                              auth_token_url: row.auth_token_url,
                              jwks_url: row.jwks_url,
                              description: row.description || "",
                            })
                          }
                          className="text-left"
                        >
                          <p className="text-sm font-medium text-gray-900">{row.name}</p>
                          <p className="text-xs text-gray-500">{row.issuer}</p>
                        </button>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${statusClass(row.status)}`}
                          >
                            {row.status}
                          </span>
                          <button
                            onClick={() => void toggleRegistrationStatus(row.id, row.status)}
                            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
                          >
                            {row.status === "active" ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {registrations.length === 0 && (
                    <EmptyState
                      title="No registrations yet"
                      description="Add an LTI registration to connect external tools."
                    />
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-gray-900">Create / Edit Registration</h2>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <input
                    value={registrationForm.name}
                    onChange={(e) =>
                      setRegistrationForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Name"
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                  <input
                    value={registrationForm.issuer}
                    onChange={(e) =>
                      setRegistrationForm((prev) => ({ ...prev, issuer: e.target.value }))
                    }
                    placeholder="Issuer"
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                  <input
                    value={registrationForm.client_id}
                    onChange={(e) =>
                      setRegistrationForm((prev) => ({ ...prev, client_id: e.target.value }))
                    }
                    placeholder="Client ID"
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                  <input
                    value={registrationForm.deployment_id}
                    onChange={(e) =>
                      setRegistrationForm((prev) => ({ ...prev, deployment_id: e.target.value }))
                    }
                    placeholder="Deployment ID"
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                  <input
                    value={registrationForm.auth_login_url}
                    onChange={(e) =>
                      setRegistrationForm((prev) => ({ ...prev, auth_login_url: e.target.value }))
                    }
                    placeholder="Auth Login URL"
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                  <input
                    value={registrationForm.auth_token_url}
                    onChange={(e) =>
                      setRegistrationForm((prev) => ({ ...prev, auth_token_url: e.target.value }))
                    }
                    placeholder="Auth Token URL"
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                  <input
                    value={registrationForm.jwks_url}
                    onChange={(e) =>
                      setRegistrationForm((prev) => ({ ...prev, jwks_url: e.target.value }))
                    }
                    placeholder="JWKS URL"
                    className="rounded border border-gray-300 px-3 py-2 text-sm md:col-span-2"
                  />
                  <textarea
                    value={registrationForm.description}
                    onChange={(e) =>
                      setRegistrationForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Description"
                    rows={3}
                    className="rounded border border-gray-300 px-3 py-2 text-sm md:col-span-2"
                  />
                </div>
                <button
                  onClick={() => void saveRegistration()}
                  className="mt-3 rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                >
                  {registrationForm.id ? "Update Registration" : "Create Registration"}
                </button>
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-gray-900">Resource Links</h2>
                {!selectedRegistrationId ? (
                  <p className="mt-2 text-sm text-gray-500">
                    Select a registration to manage links.
                  </p>
                ) : (
                  <>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <input
                        value={resourceForm.title}
                        onChange={(e) =>
                          setResourceForm((prev) => ({ ...prev, title: e.target.value }))
                        }
                        placeholder="Title"
                        className="rounded border border-gray-300 px-3 py-2 text-sm"
                      />
                      <input
                        value={resourceForm.url}
                        onChange={(e) =>
                          setResourceForm((prev) => ({ ...prev, url: e.target.value }))
                        }
                        placeholder="URL"
                        className="rounded border border-gray-300 px-3 py-2 text-sm"
                      />
                      <select
                        value={resourceForm.course_id}
                        onChange={(e) =>
                          setResourceForm((prev) => ({ ...prev, course_id: e.target.value }))
                        }
                        className="rounded border border-gray-300 px-3 py-2 text-sm"
                      >
                        <option value="">No Course</option>
                        {courses.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.name}
                          </option>
                        ))}
                      </select>
                      <input
                        value={resourceForm.description}
                        onChange={(e) =>
                          setResourceForm((prev) => ({ ...prev, description: e.target.value }))
                        }
                        placeholder="Description"
                        className="rounded border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <button
                      onClick={() => void createResourceLink()}
                      className="mt-3 rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Add Resource Link
                    </button>

                    <div className="mt-4 space-y-2">
                      {links.map((link) => (
                        <div
                          key={link.id}
                          className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                        >
                          <p className="font-medium text-gray-900">{link.title}</p>
                          <p className="text-xs text-gray-500">{link.url || "No URL"}</p>
                        </div>
                      ))}
                      {links.length === 0 && (
                        <p className="text-sm text-gray-500">No resource links yet.</p>
                      )}
                    </div>
                  </>
                )}
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
