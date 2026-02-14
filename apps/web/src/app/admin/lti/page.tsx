"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { StatusBadge } from "@/components/StatusBadge";

interface LtiRegistration {
  id: number;
  name: string;
  issuer: string;
  client_id: string;
  auth_login_url: string;
  auth_token_url: string;
  jwks_url: string;
  deployment_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface LtiResourceLink {
  id: number;
  lti_registration_id: number;
  title: string;
  url: string;
  custom_params: Record<string, string>;
  course_id: number | null;
  created_at: string;
}

interface PlatformInfo {
  issuer_url: string;
  jwks_url: string;
  redirect_urls: string[];
}

export default function LtiPage() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<LtiRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add tool form
  const [showAddForm, setShowAddForm] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formIssuer, setFormIssuer] = useState("");
  const [formClientId, setFormClientId] = useState("");
  const [formAuthLoginUrl, setFormAuthLoginUrl] = useState("");
  const [formAuthTokenUrl, setFormAuthTokenUrl] = useState("");
  const [formJwksUrl, setFormJwksUrl] = useState("");
  const [formDeploymentId, setFormDeploymentId] = useState("");

  // Edit tool
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Platform info
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo | null>(null);

  // Resource links
  const [expandedToolId, setExpandedToolId] = useState<number | null>(null);
  const [resourceLinks, setResourceLinks] = useState<LtiResourceLink[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);

  // Add resource link form
  const [showAddLinkForm, setShowAddLinkForm] = useState(false);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkCustomParams, setLinkCustomParams] = useState<
    { key: string; value: string }[]
  >([]);
  const [linkCourseId, setLinkCourseId] = useState("");
  const [savingLink, setSavingLink] = useState(false);

  const canAccess = user?.roles?.includes("admin");

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const data =
        await apiFetch<LtiRegistration[]>("/api/v1/lti_registrations");
      setRegistrations(data);
    } catch {
      // No registrations
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPlatformInfo = useCallback(async () => {
    try {
      const info = await apiFetch<PlatformInfo>("/api/v1/lti/platform_info");
      setPlatformInfo(info);
    } catch {
      // Platform info not available
    }
  }, []);

  useEffect(() => {
    if (canAccess) {
      fetchRegistrations();
      fetchPlatformInfo();
    } else {
      setLoading(false);
    }
  }, [canAccess, fetchRegistrations, fetchPlatformInfo]);

  function clearMessages() {
    setError(null);
    setSuccess(null);
  }

  function resetAddForm() {
    setFormName("");
    setFormIssuer("");
    setFormClientId("");
    setFormAuthLoginUrl("");
    setFormAuthTokenUrl("");
    setFormJwksUrl("");
    setFormDeploymentId("");
    setShowAddForm(false);
  }

  async function handleAddTool() {
    clearMessages();
    setFormSaving(true);
    try {
      const created = await apiFetch<LtiRegistration>(
        "/api/v1/lti_registrations",
        {
          method: "POST",
          body: JSON.stringify({
            name: formName,
            issuer: formIssuer,
            client_id: formClientId,
            auth_login_url: formAuthLoginUrl,
            auth_token_url: formAuthTokenUrl,
            jwks_url: formJwksUrl,
            deployment_id: formDeploymentId,
          }),
        },
      );
      setRegistrations((prev) => [...prev, created]);
      setSuccess("LTI tool registered successfully.");
      resetAddForm();
    } catch {
      setError("Failed to register LTI tool.");
    } finally {
      setFormSaving(false);
    }
  }

  async function handleUpdateName(id: number) {
    clearMessages();
    try {
      const updated = await apiFetch<LtiRegistration>(
        `/api/v1/lti_registrations/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ name: editName }),
        },
      );
      setRegistrations((prev) =>
        prev.map((r) => (r.id === id ? updated : r)),
      );
      setEditingId(null);
      setSuccess("Tool name updated.");
    } catch {
      setError("Failed to update tool.");
    }
  }

  async function handleToggleStatus(reg: LtiRegistration) {
    clearMessages();
    const action = reg.status === "active" ? "deactivate" : "activate";
    try {
      const updated = await apiFetch<LtiRegistration>(
        `/api/v1/lti_registrations/${reg.id}/${action}`,
        { method: "POST" },
      );
      setRegistrations((prev) =>
        prev.map((r) => (r.id === reg.id ? updated : r)),
      );
      setSuccess(`Tool ${action}d.`);
    } catch {
      setError(`Failed to ${action} tool.`);
    }
  }

  async function handleDelete(id: number) {
    clearMessages();
    try {
      await apiFetch(`/api/v1/lti_registrations/${id}`, {
        method: "DELETE",
      });
      setRegistrations((prev) => prev.filter((r) => r.id !== id));
      setDeletingId(null);
      setSuccess("Tool deleted.");
    } catch {
      setError("Failed to delete tool.");
    }
  }

  async function handleExpandTool(toolId: number) {
    if (expandedToolId === toolId) {
      setExpandedToolId(null);
      setResourceLinks([]);
      setShowAddLinkForm(false);
      return;
    }
    setExpandedToolId(toolId);
    setLoadingLinks(true);
    setShowAddLinkForm(false);
    try {
      const links = await apiFetch<LtiResourceLink[]>(
        `/api/v1/lti_registrations/${toolId}/lti_resource_links`,
      );
      setResourceLinks(links);
    } catch {
      setResourceLinks([]);
    } finally {
      setLoadingLinks(false);
    }
  }

  async function handleAddResourceLink(toolId: number) {
    clearMessages();
    setSavingLink(true);
    try {
      const customParamsObj: Record<string, string> = {};
      for (const param of linkCustomParams) {
        if (param.key.trim()) {
          customParamsObj[param.key.trim()] = param.value;
        }
      }
      const created = await apiFetch<LtiResourceLink>(
        `/api/v1/lti_registrations/${toolId}/lti_resource_links`,
        {
          method: "POST",
          body: JSON.stringify({
            title: linkTitle,
            url: linkUrl,
            custom_params: customParamsObj,
            course_id: linkCourseId ? Number(linkCourseId) : null,
          }),
        },
      );
      setResourceLinks((prev) => [...prev, created]);
      setLinkTitle("");
      setLinkUrl("");
      setLinkCustomParams([]);
      setLinkCourseId("");
      setShowAddLinkForm(false);
      setSuccess("Resource link added.");
    } catch {
      setError("Failed to add resource link.");
    } finally {
      setSavingLink(false);
    }
  }

  function handleLaunchTest(regId: number) {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    window.open(
      `${apiBase}/api/v1/lti/login?registration_id=${regId}`,
      "_blank",
    );
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

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="text-sm text-gray-500">Loading...</div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">LTI Tools</h1>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {showAddForm ? "Cancel" : "Add Tool"}
            </button>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}

          {/* Add Tool Form */}
          {showAddForm && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Register New LTI Tool
              </h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Tool name"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Issuer URL
                  </label>
                  <input
                    type="text"
                    value={formIssuer}
                    onChange={(e) => setFormIssuer(e.target.value)}
                    placeholder="https://tool.example.com"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Client ID
                  </label>
                  <input
                    type="text"
                    value={formClientId}
                    onChange={(e) => setFormClientId(e.target.value)}
                    placeholder="Client ID"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Auth Login URL
                  </label>
                  <input
                    type="text"
                    value={formAuthLoginUrl}
                    onChange={(e) => setFormAuthLoginUrl(e.target.value)}
                    placeholder="https://tool.example.com/auth/login"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Auth Token URL
                  </label>
                  <input
                    type="text"
                    value={formAuthTokenUrl}
                    onChange={(e) => setFormAuthTokenUrl(e.target.value)}
                    placeholder="https://tool.example.com/auth/token"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    JWKS URL
                  </label>
                  <input
                    type="text"
                    value={formJwksUrl}
                    onChange={(e) => setFormJwksUrl(e.target.value)}
                    placeholder="https://tool.example.com/.well-known/jwks.json"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Deployment ID
                  </label>
                  <input
                    type="text"
                    value={formDeploymentId}
                    onChange={(e) => setFormDeploymentId(e.target.value)}
                    placeholder="Deployment ID"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleAddTool}
                  disabled={formSaving || !formName || !formIssuer}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {formSaving ? "Registering..." : "Register Tool"}
                </button>
              </div>
            </div>
          )}

          {/* Registered Tools List */}
          {registrations.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
              No LTI tools registered yet. Click &quot;Add Tool&quot; to get
              started.
            </div>
          ) : (
            <div className="space-y-4">
              {registrations.map((reg) => (
                <ToolCard
                  key={reg.id}
                  reg={reg}
                  editingId={editingId}
                  editName={editName}
                  deletingId={deletingId}
                  expandedToolId={expandedToolId}
                  resourceLinks={resourceLinks}
                  loadingLinks={loadingLinks}
                  showAddLinkForm={showAddLinkForm}
                  linkTitle={linkTitle}
                  linkUrl={linkUrl}
                  linkCourseId={linkCourseId}
                  linkCustomParams={linkCustomParams}
                  savingLink={savingLink}
                  onSetEditingId={setEditingId}
                  onSetEditName={setEditName}
                  onSetDeletingId={setDeletingId}
                  onSetShowAddLinkForm={setShowAddLinkForm}
                  onSetLinkTitle={setLinkTitle}
                  onSetLinkUrl={setLinkUrl}
                  onSetLinkCourseId={setLinkCourseId}
                  onSetLinkCustomParams={setLinkCustomParams}
                  onUpdateName={handleUpdateName}
                  onToggleStatus={handleToggleStatus}
                  onDelete={handleDelete}
                  onExpandTool={handleExpandTool}
                  onAddResourceLink={handleAddResourceLink}
                  onLaunchTest={handleLaunchTest}
                />
              ))}
            </div>
          )}

          {/* Platform Info */}
          {platformInfo && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Platform Info
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Share these URLs with LTI tool vendors for integration setup.
              </p>
              <div className="mt-4 space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">
                    Issuer URL:
                  </span>{" "}
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-800">
                    {platformInfo.issuer_url}
                  </code>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    JWKS URL:
                  </span>{" "}
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-800">
                    {platformInfo.jwks_url}
                  </code>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Redirect URLs:
                  </span>
                  <ul className="mt-1 ml-4 list-disc">
                    {platformInfo.redirect_urls.map((url) => (
                      <li key={url}>
                        <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-800">
                          {url}
                        </code>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

function ToolCard({
  reg,
  editingId,
  editName,
  deletingId,
  expandedToolId,
  resourceLinks,
  loadingLinks,
  showAddLinkForm,
  linkTitle,
  linkUrl,
  linkCourseId,
  linkCustomParams,
  savingLink,
  onSetEditingId,
  onSetEditName,
  onSetDeletingId,
  onSetShowAddLinkForm,
  onSetLinkTitle,
  onSetLinkUrl,
  onSetLinkCourseId,
  onSetLinkCustomParams,
  onUpdateName,
  onToggleStatus,
  onDelete,
  onExpandTool,
  onAddResourceLink,
  onLaunchTest,
}: {
  reg: LtiRegistration;
  editingId: number | null;
  editName: string;
  deletingId: number | null;
  expandedToolId: number | null;
  resourceLinks: LtiResourceLink[];
  loadingLinks: boolean;
  showAddLinkForm: boolean;
  linkTitle: string;
  linkUrl: string;
  linkCourseId: string;
  linkCustomParams: { key: string; value: string }[];
  savingLink: boolean;
  onSetEditingId: (id: number | null) => void;
  onSetEditName: (name: string) => void;
  onSetDeletingId: (id: number | null) => void;
  onSetShowAddLinkForm: (show: boolean) => void;
  onSetLinkTitle: (title: string) => void;
  onSetLinkUrl: (url: string) => void;
  onSetLinkCourseId: (id: string) => void;
  onSetLinkCustomParams: (params: { key: string; value: string }[]) => void;
  onUpdateName: (id: number) => void;
  onToggleStatus: (reg: LtiRegistration) => void;
  onDelete: (id: number) => void;
  onExpandTool: (id: number) => void;
  onAddResourceLink: (toolId: number) => void;
  onLaunchTest: (regId: number) => void;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {editingId === reg.id ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => onSetEditName(e.target.value)}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={() => onUpdateName(reg.id)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Save
              </button>
              <button
                onClick={() => onSetEditingId(null)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <h3 className="text-base font-semibold text-gray-900">
              {reg.name}
            </h3>
          )}
          <StatusBadge status={reg.status} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onLaunchTest(reg.id)}
            className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Test Launch
          </button>
          <button
            onClick={() => {
              onSetEditingId(reg.id);
              onSetEditName(reg.name);
            }}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
          <button
            onClick={() => onToggleStatus(reg)}
            className={`rounded-md px-3 py-1 text-xs font-medium ${
              reg.status === "active"
                ? "border border-red-300 text-red-700 hover:bg-red-50"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {reg.status === "active" ? "Deactivate" : "Activate"}
          </button>
          {deletingId === reg.id ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-red-600">Confirm?</span>
              <button
                onClick={() => onDelete(reg.id)}
                className="text-xs font-medium text-red-600 hover:text-red-800"
              >
                Yes
              </button>
              <button
                onClick={() => onSetDeletingId(null)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => onSetDeletingId(reg.id)}
              className="text-xs text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          )}
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
        <div>
          <span className="font-medium text-gray-600">Issuer:</span>{" "}
          {reg.issuer}
        </div>
        <div>
          <span className="font-medium text-gray-600">Client ID:</span>{" "}
          {reg.client_id}
        </div>
        <div>
          <span className="font-medium text-gray-600">Deployment ID:</span>{" "}
          {reg.deployment_id}
        </div>
        <div>
          <span className="font-medium text-gray-600">Created:</span>{" "}
          {new Date(reg.created_at).toLocaleDateString()}
        </div>
      </div>

      {/* Resource Links Toggle */}
      <div className="mt-3 border-t border-gray-100 pt-3">
        <button
          onClick={() => onExpandTool(reg.id)}
          className="text-xs font-medium text-blue-600 hover:text-blue-800"
        >
          {expandedToolId === reg.id
            ? "Hide Resource Links"
            : "Resource Links"}
        </button>

        {expandedToolId === reg.id && (
          <div className="mt-3 space-y-3">
            {loadingLinks ? (
              <p className="text-xs text-gray-500">Loading links...</p>
            ) : resourceLinks.length === 0 ? (
              <p className="text-xs text-gray-400">
                No resource links configured.
              </p>
            ) : (
              <div className="space-y-2">
                {resourceLinks.map((link) => (
                  <div
                    key={link.id}
                    className="rounded border border-gray-100 bg-gray-50 p-2 text-xs"
                  >
                    <div className="font-medium text-gray-700">
                      {link.title}
                    </div>
                    <div className="text-gray-500">{link.url}</div>
                    {Object.keys(link.custom_params).length > 0 && (
                      <div className="mt-1 text-gray-400">
                        Params:{" "}
                        {Object.entries(link.custom_params)
                          .map(([k, v]) => `${k}=${v}`)
                          .join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {showAddLinkForm ? (
              <div className="space-y-2 rounded border border-gray-200 bg-gray-50 p-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    value={linkTitle}
                    onChange={(e) => onSetLinkTitle(e.target.value)}
                    className="mt-0.5 block w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    URL
                  </label>
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => onSetLinkUrl(e.target.value)}
                    className="mt-0.5 block w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Course ID (optional)
                  </label>
                  <input
                    type="text"
                    value={linkCourseId}
                    onChange={(e) => onSetLinkCourseId(e.target.value)}
                    className="mt-0.5 block w-48 rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Custom Parameters
                  </label>
                  {linkCustomParams.map((param, idx) => (
                    <div key={idx} className="mt-1 flex items-center gap-1">
                      <input
                        type="text"
                        value={param.key}
                        onChange={(e) => {
                          const updated = [...linkCustomParams];
                          updated[idx] = {
                            ...updated[idx],
                            key: e.target.value,
                          };
                          onSetLinkCustomParams(updated);
                        }}
                        placeholder="key"
                        className="block w-32 rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={param.value}
                        onChange={(e) => {
                          const updated = [...linkCustomParams];
                          updated[idx] = {
                            ...updated[idx],
                            value: e.target.value,
                          };
                          onSetLinkCustomParams(updated);
                        }}
                        placeholder="value"
                        className="block w-32 rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        onClick={() =>
                          onSetLinkCustomParams(
                            linkCustomParams.filter((_, i) => i !== idx),
                          )
                        }
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      onSetLinkCustomParams([
                        ...linkCustomParams,
                        { key: "", value: "" },
                      ])
                    }
                    className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    + Add parameter
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onAddResourceLink(reg.id)}
                    disabled={savingLink || !linkTitle || !linkUrl}
                    className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingLink ? "Saving..." : "Add Link"}
                  </button>
                  <button
                    onClick={() => onSetShowAddLinkForm(false)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => onSetShowAddLinkForm(true)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                + Add Resource Link
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
