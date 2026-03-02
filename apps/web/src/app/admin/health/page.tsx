"use client";

import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Badge, Card, Skeleton, Spinner } from "@k12/ui";

type HealthStatus = "healthy" | "warning" | "critical";

interface HealthCheck {
  status: HealthStatus;
  latency_ms?: number;
  error?: string;
  enqueued?: number;
}

interface HealthMetrics {
  db_connection_pool: number;
  db_response_time: number;
  sidekiq_queue_depth: number;
  sidekiq_latency: number;
  memory_usage_percent: number;
  backup_age_hours: number;
}

interface HealthData {
  timestamp: string;
  overall: HealthStatus;
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
    sidekiq: HealthCheck;
    storage: HealthCheck;
    ai_gateway: HealthCheck;
  };
  metrics: HealthMetrics;
}

interface CheckDefinition {
  key: keyof HealthData["checks"];
  label: string;
}

const CHECKS: CheckDefinition[] = [
  { key: "database", label: "Database" },
  { key: "redis", label: "Redis" },
  { key: "sidekiq", label: "Sidekiq" },
  { key: "storage", label: "Storage" },
  { key: "ai_gateway", label: "AI Gateway" },
];

function statusVariant(status: HealthStatus): "success" | "warning" | "danger" {
  if (status === "healthy") return "success";
  if (status === "warning") return "warning";
  return "danger";
}

function bannerClasses(status: HealthStatus): string {
  if (status === "healthy") return "border-green-200 bg-green-50 text-green-800";
  if (status === "warning") return "border-yellow-200 bg-yellow-50 text-yellow-800";
  return "border-red-200 bg-red-50 text-red-800";
}

function renderMetric(value: number | undefined, unit: string) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return "-";
  }
  return `${Number(value).toLocaleString()}${unit}`;
}

export default function AdminHealthPage() {
  const { user } = useAuth();
  const canAccess = user?.roles?.includes("admin") || false;

  const { data, error, isLoading } = useSWR<HealthData>(
    "/api/v1/admin/operations/health",
    apiFetch,
    { refreshInterval: 30_000 },
  );

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
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Spinner size="sm" />
                Refreshing...
              </div>
            )}
          </div>

          {error && (
            <Card className="border-red-200 bg-red-50">
              <p className="text-sm text-red-700">
                Failed to load health status. Please try again shortly.
              </p>
            </Card>
          )}

          {isLoading && !data && (
            <div className="space-y-4">
              <Skeleton variant="rectangle" height="h-20" />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {CHECKS.map((check) => (
                  <Card key={check.key}>
                    <Skeleton width="w-24" />
                    <Skeleton width="w-16" className="mt-2" />
                    <Skeleton width="w-20" className="mt-3" />
                  </Card>
                ))}
              </div>
            </div>
          )}

          {data && (
            <>
              <div className={`rounded-lg border px-4 py-3 ${bannerClasses(data.overall)}`}>
                <p className="text-sm font-semibold">Overall: {data.overall.toUpperCase()}</p>
                <p className="mt-0.5 text-xs">
                  Last updated: {new Date(data.timestamp).toLocaleString()}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {CHECKS.map((check) => {
                  const item = data.checks[check.key];
                  return (
                    <Card key={check.key}>
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-gray-900">{check.label}</h2>
                        <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                      </div>
                      <p className="mt-3 text-xs text-gray-600">
                        {item.error
                          ? item.error
                          : item.latency_ms !== undefined
                            ? `${item.latency_ms} ms`
                            : item.enqueued !== undefined
                              ? `Queue depth: ${item.enqueued}`
                              : "No latency data"}
                      </p>
                    </Card>
                  );
                })}
              </div>

              <Card>
                <h2 className="text-lg font-semibold text-gray-900">Metrics</h2>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                        <th className="px-2 py-2">Metric</th>
                        <th className="px-2 py-2">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="px-2 py-2 text-gray-700">DB Connection Pool</td>
                        <td className="px-2 py-2 font-medium text-gray-900">
                          {renderMetric(data.metrics.db_connection_pool, "%")}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2 py-2 text-gray-700">DB Response Time</td>
                        <td className="px-2 py-2 font-medium text-gray-900">
                          {renderMetric(data.metrics.db_response_time, " ms")}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2 py-2 text-gray-700">Sidekiq Queue Depth</td>
                        <td className="px-2 py-2 font-medium text-gray-900">
                          {renderMetric(data.metrics.sidekiq_queue_depth, "")}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2 py-2 text-gray-700">Sidekiq Latency</td>
                        <td className="px-2 py-2 font-medium text-gray-900">
                          {renderMetric(data.metrics.sidekiq_latency, " s")}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2 py-2 text-gray-700">Memory Usage</td>
                        <td className="px-2 py-2 font-medium text-gray-900">
                          {renderMetric(data.metrics.memory_usage_percent, "%")}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2 py-2 text-gray-700">Backup Age</td>
                        <td className="px-2 py-2 font-medium text-gray-900">
                          {renderMetric(data.metrics.backup_age_hours, " h")}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
