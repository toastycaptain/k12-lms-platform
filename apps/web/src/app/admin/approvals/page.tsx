"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { StatusBadge } from "@/components/StatusBadge";

interface Approval {
  id: number;
  approvable_type: string;
  approvable_id: number;
  status: string;
  requested_by_id: number;
  reviewed_by_id: number | null;
  comments: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export default function ApprovalQueuePage() {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectComments, setRejectComments] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canAccess =
    user?.roles?.includes("admin") || user?.roles?.includes("curriculum_lead");

  useEffect(() => {
    fetchApprovals();
  }, [filterStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchApprovals() {
    setLoading(true);
    try {
      const params = filterStatus !== "all" ? `?status=${filterStatus}` : "";
      const data = await apiFetch<Approval[]>(`/api/v1/approvals${params}`);
      setApprovals(data);
    } catch {
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(approvalId: number) {
    setActionLoading(approvalId);
    setError(null);
    try {
      await apiFetch(`/api/v1/approvals/${approvalId}/approve`, { method: "POST" });
      await fetchApprovals();
    } catch {
      setError("Failed to approve.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(approvalId: number) {
    if (!rejectComments.trim()) {
      setError("Comments are required when rejecting.");
      return;
    }
    setActionLoading(approvalId);
    setError(null);
    try {
      await apiFetch(`/api/v1/approvals/${approvalId}/reject`, {
        method: "POST",
        body: JSON.stringify({ comments: rejectComments }),
      });
      setRejectingId(null);
      setRejectComments("");
      await fetchApprovals();
    } catch {
      setError("Failed to reject.");
    } finally {
      setActionLoading(null);
    }
  }

  if (!canAccess) {
    return (
      <ProtectedRoute>
        <AppShell>
          <p className="text-gray-500">
            Access restricted to administrators and curriculum leads.
          </p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Approval Queue</h1>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          {/* Filter */}
          <div className="flex items-center gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">All</option>
            </select>
          </div>

          {/* Approval List */}
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : approvals.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
              <p className="text-sm text-gray-500">
                No {filterStatus !== "all" ? filterStatus : ""} approvals.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {approvals.map((approval) => (
                <div
                  key={approval.id}
                  className="rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={approval.status} />
                      <span className="text-sm font-medium text-gray-900">
                        {approval.approvable_type} #{approval.approvable_id}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {approval.approvable_type === "UnitPlan" && (
                        <Link
                          href={`/plan/units/${approval.approvable_id}/preview`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          View Preview
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-gray-400">
                    Submitted{" "}
                    {new Date(approval.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {approval.reviewed_at && (
                      <>
                        {" "}
                        | Reviewed{" "}
                        {new Date(approval.reviewed_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </>
                    )}
                  </div>

                  {approval.comments && (
                    <div className="mt-2 rounded bg-gray-50 px-3 py-2 text-sm text-gray-600">
                      {approval.comments}
                    </div>
                  )}

                  {/* Actions for pending approvals */}
                  {approval.status === "pending" && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(approval.id)}
                          disabled={actionLoading === approval.id}
                          className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {actionLoading === approval.id ? "..." : "Approve"}
                        </button>
                        <button
                          onClick={() =>
                            setRejectingId(
                              rejectingId === approval.id ? null : approval.id,
                            )
                          }
                          className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                        >
                          Reject
                        </button>
                      </div>
                      {rejectingId === approval.id && (
                        <div className="flex items-start gap-2">
                          <textarea
                            value={rejectComments}
                            onChange={(e) => setRejectComments(e.target.value)}
                            placeholder="Reason for rejection (required)..."
                            rows={2}
                            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                          />
                          <button
                            onClick={() => handleReject(approval.id)}
                            disabled={actionLoading === approval.id}
                            className="rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            Confirm
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
