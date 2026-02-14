"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";

interface AiInvocation {
  id: number;
  user_id: number;
  task_type: string;
  provider_name: string;
  model: string;
  status: string;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  duration_ms: number | null;
  error_message: string | null;
  created_at: string;
}

interface AiSummary {
  total_invocations: number;
  total_tokens: number;
  by_task_type: Record<string, number>;
  by_provider: Record<string, number>;
}

const TASK_TYPES = ["lesson_generation", "unit_generation", "differentiation", "assessment_generation", "rewrite"];
const STATUSES = ["pending", "running", "completed", "failed"];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-gray-100 text-gray-600",
    running: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

export default function AiUsagePage() {
  const { user } = useAuth();
  const [invocations, setInvocations] = useState<AiInvocation[]>([]);
  const [summary, setSummary] = useState<AiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterTaskType, setFilterTaskType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const canAccess = user?.roles?.includes("admin");

  useEffect(() => {
    fetchData();
  }, [filterTaskType, filterStatus]);

  async function fetchData() {
    setLoading(true);
    try {
      const queryParts: string[] = [];
      if (filterTaskType) queryParts.push(`task_type=${filterTaskType}`);
      if (filterStatus) queryParts.push(`status=${filterStatus}`);
      const query = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

      const [invData, sumData] = await Promise.all([
        apiFetch<AiInvocation[]>(`/api/v1/ai_invocations${query}`),
        apiFetch<AiSummary>("/api/v1/ai_invocations/summary"),
      ]);
      setInvocations(invData);
      setSummary(sumData);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
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

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-4xl space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">AI Usage</h1>

          {summary && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs text-gray-500">Total Invocations</p>
                <p className="text-2xl font-bold text-gray-900">{summary.total_invocations}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs text-gray-500">Total Tokens</p>
                <p className="text-2xl font-bold text-gray-900">{summary.total_tokens.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs text-gray-500">By Task Type</p>
                <div className="mt-1 space-y-0.5">
                  {Object.entries(summary.by_task_type).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-xs">
                      <span className="text-gray-600">{type.replace(/_/g, " ")}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs text-gray-500">By Provider</p>
                <div className="mt-1 space-y-0.5">
                  {Object.entries(summary.by_provider).map(([provider, count]) => (
                    <div key={provider} className="flex justify-between text-xs">
                      <span className="text-gray-600">{provider}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <select value={filterTaskType} onChange={(e) => setFilterTaskType(e.target.value)} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm">
              <option value="">All task types</option>
              {TASK_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
              ))}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm">
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : invocations.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
              No AI invocations yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Task Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Provider</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Model</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tokens</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Duration</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invocations.map((inv) => (
                    <tr key={inv.id}>
                      <td className="px-4 py-2 text-gray-700">{inv.task_type.replace(/_/g, " ")}</td>
                      <td className="px-4 py-2 text-gray-600">{inv.provider_name}</td>
                      <td className="px-4 py-2 text-gray-600">{inv.model}</td>
                      <td className="px-4 py-2"><StatusBadge status={inv.status} /></td>
                      <td className="px-4 py-2 text-gray-600">{inv.total_tokens?.toLocaleString() || "-"}</td>
                      <td className="px-4 py-2 text-gray-600">{inv.duration_ms ? `${(inv.duration_ms / 1000).toFixed(1)}s` : "-"}</td>
                      <td className="px-4 py-2 text-gray-400">{new Date(inv.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
