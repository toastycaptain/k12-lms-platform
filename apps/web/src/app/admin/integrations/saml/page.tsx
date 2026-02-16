"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch, ApiError } from "@/lib/api";

interface IntegrationConfig {
  id: number;
  provider: string;
  status: string;
  settings: Record<string, unknown>;
}

interface MeResponse {
  tenant: {
    slug: string;
  };
}

interface SamlFormState {
  issuer: string;
  idp_sso_url: string;
  idp_slo_url: string;
  idp_cert: string;
  idp_cert_fingerprint: string;
  name_id_format: string;
  email_attr: string;
  first_name_attr: string;
  last_name_attr: string;
  auto_provision: boolean;
  default_role: "student" | "teacher" | "admin";
}

const ADMIN_ROLES = ["admin"];

const NAME_ID_OPTIONS = [
  {
    label: "Email Address",
    value: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
  },
  {
    label: "Persistent",
    value: "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent",
  },
  {
    label: "Transient",
    value: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
  },
];

function initialFormState(): SamlFormState {
  return {
    issuer: "",
    idp_sso_url: "",
    idp_slo_url: "",
    idp_cert: "",
    idp_cert_fingerprint: "",
    name_id_format: NAME_ID_OPTIONS[0].value,
    email_attr: "email",
    first_name_attr: "first_name",
    last_name_attr: "last_name",
    auto_provision: false,
    default_role: "student",
  };
}

function apiOrigin(): string {
  const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1").replace(
    /\/+$/,
    "",
  );
  return base.replace(/\/api\/v1$/, "");
}

function statusClass(status: string): string {
  if (status === "active") return "bg-green-100 text-green-700";
  if (status === "error") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-700";
}

export default function SamlIntegrationPage() {
  const [config, setConfig] = useState<IntegrationConfig | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string>("");
  const [form, setForm] = useState<SamlFormState>(initialFormState());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const metadataUrl = useMemo(() => {
    if (!tenantSlug) return "";
    return `${apiOrigin()}/api/v1/saml/metadata?tenant=${encodeURIComponent(tenantSlug)}`;
  }, [tenantSlug]);

  const samlStartUrl = useMemo(() => {
    if (!tenantSlug) return "";
    return `${apiOrigin()}/auth/saml?tenant=${encodeURIComponent(tenantSlug)}`;
  }, [tenantSlug]);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [configs, me] = await Promise.all([
        apiFetch<IntegrationConfig[]>("/api/v1/integration_configs"),
        apiFetch<MeResponse>("/api/v1/me"),
      ]);

      const samlConfig = configs.find((row) => row.provider === "saml") || null;
      setConfig(samlConfig);
      setTenantSlug(me.tenant.slug);

      if (samlConfig) {
        const settings = samlConfig.settings || {};
        setForm({
          issuer: String(settings.issuer || ""),
          idp_sso_url: String(settings.idp_sso_url || ""),
          idp_slo_url: String(settings.idp_slo_url || ""),
          idp_cert: String(settings.idp_cert || ""),
          idp_cert_fingerprint: String(settings.idp_cert_fingerprint || ""),
          name_id_format:
            String(settings.name_id_format || NAME_ID_OPTIONS[0].value) || NAME_ID_OPTIONS[0].value,
          email_attr: String(settings.email_attr || "email"),
          first_name_attr: String(settings.first_name_attr || "first_name"),
          last_name_attr: String(settings.last_name_attr || "last_name"),
          auto_provision: Boolean(settings.auto_provision),
          default_role: (settings.default_role as "student" | "teacher" | "admin") || "student",
        });
      }
    } catch (requestError) {
      setError(
        requestError instanceof ApiError ? requestError.message : "Unable to load SAML settings.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  async function saveConfig(): Promise<void> {
    if (!form.idp_sso_url.trim()) {
      setError("IdP SSO URL is required.");
      return;
    }

    if (!form.idp_cert.trim() && !form.idp_cert_fingerprint.trim()) {
      setError("Provide either an IdP certificate or a certificate fingerprint.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const settings = {
      issuer: form.issuer.trim() || undefined,
      idp_sso_url: form.idp_sso_url.trim(),
      idp_slo_url: form.idp_slo_url.trim() || undefined,
      idp_cert: form.idp_cert.trim() || undefined,
      idp_cert_fingerprint: form.idp_cert_fingerprint.trim() || undefined,
      name_id_format: form.name_id_format,
      email_attr: form.email_attr.trim() || "email",
      first_name_attr: form.first_name_attr.trim() || "first_name",
      last_name_attr: form.last_name_attr.trim() || "last_name",
      auto_provision: form.auto_provision,
      default_role: form.default_role,
    };

    try {
      if (config) {
        await apiFetch(`/api/v1/integration_configs/${config.id}`, {
          method: "PATCH",
          body: JSON.stringify({ provider: "saml", settings }),
        });
        setSuccess("SAML configuration updated.");
      } else {
        await apiFetch<IntegrationConfig>("/api/v1/integration_configs", {
          method: "POST",
          body: JSON.stringify({ provider: "saml", settings }),
        });
        setSuccess("SAML configuration created.");
      }

      await loadConfig();
    } catch (requestError) {
      setError(
        requestError instanceof ApiError ? requestError.message : "Unable to save SAML settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(): Promise<void> {
    if (!config) return;

    setToggling(true);
    setError(null);
    setSuccess(null);

    try {
      const action = config.status === "active" ? "deactivate" : "activate";
      await apiFetch(`/api/v1/integration_configs/${config.id}/${action}`, {
        method: "POST",
      });

      setSuccess(`SAML ${action}d successfully.`);
      await loadConfig();
    } catch (requestError) {
      setError(
        requestError instanceof ApiError ? requestError.message : "Unable to toggle SAML status.",
      );
    } finally {
      setToggling(false);
    }
  }

  async function copyMetadataUrl(): Promise<void> {
    if (!metadataUrl) return;

    try {
      await navigator.clipboard.writeText(metadataUrl);
      setSuccess("Metadata URL copied to clipboard.");
    } catch {
      setError("Unable to copy metadata URL.");
    }
  }

  async function downloadMetadata(): Promise<void> {
    if (!metadataUrl) return;

    try {
      const response = await fetch(metadataUrl, { credentials: "include" });
      if (!response.ok) {
        throw new Error("Metadata request failed");
      }

      const xml = await response.text();
      const blob = new Blob([xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `saml-metadata-${tenantSlug || "tenant"}.xml`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Unable to download metadata XML.");
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={ADMIN_ROLES}>
        <AppShell>
          <p className="text-sm text-gray-500">Loading SAML integration settings...</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={ADMIN_ROLES}>
      <AppShell>
        <div className="mx-auto max-w-4xl space-y-6">
          <header>
            <Link href="/admin/integrations" className="text-sm text-blue-600 hover:text-blue-800">
              &larr; Back to Integrations
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">SAML SSO</h1>
            <p className="text-sm text-gray-600">
              Configure tenant-specific SAML identity provider settings.
            </p>
          </header>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {success && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</div>
          )}

          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Current Status</h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(config?.status || "inactive")}`}
              >
                {config?.status || "inactive"}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              SAML is {config?.status === "active" ? "active" : "inactive"} for this tenant.
            </p>
            <div className="mt-3">
              <button
                type="button"
                disabled={!config || toggling}
                onClick={() => void toggleStatus()}
                className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {toggling ? "Updating..." : config?.status === "active" ? "Deactivate" : "Activate"}
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Configuration</h2>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="issuer" className="mb-1 block text-sm font-medium text-gray-700">
                  Issuer / Entity ID
                </label>
                <input
                  id="issuer"
                  type="text"
                  value={form.issuer}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, issuer: event.target.value }))
                  }
                  placeholder="Issuer / Entity ID"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="idp_sso_url"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  IdP SSO URL
                </label>
                <input
                  id="idp_sso_url"
                  type="text"
                  value={form.idp_sso_url}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, idp_sso_url: event.target.value }))
                  }
                  placeholder="IdP SSO URL (required)"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="idp_slo_url"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  IdP SLO URL
                </label>
                <input
                  id="idp_slo_url"
                  type="text"
                  value={form.idp_slo_url}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, idp_slo_url: event.target.value }))
                  }
                  placeholder="IdP SLO URL (optional)"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="idp_cert" className="mb-1 block text-sm font-medium text-gray-700">
                  IdP Certificate
                </label>
                <textarea
                  id="idp_cert"
                  value={form.idp_cert}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, idp_cert: event.target.value }))
                  }
                  rows={4}
                  placeholder="IdP Certificate (PEM)"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="idp_cert_fingerprint"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Certificate Fingerprint
                </label>
                <input
                  id="idp_cert_fingerprint"
                  type="text"
                  value={form.idp_cert_fingerprint}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, idp_cert_fingerprint: event.target.value }))
                  }
                  placeholder="Certificate Fingerprint"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="name_id_format"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Name ID Format
                </label>
                <select
                  id="name_id_format"
                  value={form.name_id_format}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name_id_format: event.target.value }))
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                >
                  {NAME_ID_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2 rounded border border-gray-200 bg-gray-50 p-3">
              <h3 className="text-sm font-semibold text-gray-900">Attribute Mapping</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="email_attr"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Email Attribute
                  </label>
                  <input
                    id="email_attr"
                    type="text"
                    value={form.email_attr}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, email_attr: event.target.value }))
                    }
                    placeholder="Email attribute"
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="first_name_attr"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    First Name Attribute
                  </label>
                  <input
                    id="first_name_attr"
                    type="text"
                    value={form.first_name_attr}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, first_name_attr: event.target.value }))
                    }
                    placeholder="First name attribute"
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="last_name_attr"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Last Name Attribute
                  </label>
                  <input
                    id="last_name_attr"
                    type="text"
                    value={form.last_name_attr}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, last_name_attr: event.target.value }))
                    }
                    placeholder="Last name attribute"
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 rounded border border-gray-200 bg-gray-50 p-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.auto_provision}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, auto_provision: event.target.checked }))
                  }
                />
                Auto-provision users
              </label>

              <select
                value={form.default_role}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    default_role: event.target.value as "student" | "teacher" | "admin",
                  }))
                }
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="student">Default Role: student</option>
                <option value="teacher">Default Role: teacher</option>
                <option value="admin">Default Role: admin</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => void saveConfig()}
              disabled={saving}
              className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">SP Metadata</h2>
            <p className="text-sm text-gray-600">
              Provide this URL to your identity provider to configure the service provider
              connection.
            </p>
            <p className="break-all rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {metadataUrl || "Tenant slug unavailable"}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void copyMetadataUrl()}
                disabled={!metadataUrl}
                className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Copy URL
              </button>
              <button
                type="button"
                onClick={() => void downloadMetadata()}
                disabled={!metadataUrl}
                className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Download Metadata XML
              </button>
              <button
                type="button"
                onClick={() => window.open(samlStartUrl, "_blank", "noopener,noreferrer")}
                disabled={!samlStartUrl}
                className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Test Connection
              </button>
            </div>
          </section>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
