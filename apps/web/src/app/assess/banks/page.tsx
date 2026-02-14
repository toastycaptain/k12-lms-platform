"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/lib/api";

interface QuestionBank {
  id: number;
  title: string;
  description: string;
  subject: string;
  grade_level: string;
  status: string;
}

export default function QuestionBankListPage() {
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [exportingId, setExportingId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchBanks() {
      try {
        const params = subjectFilter ? `?subject=${encodeURIComponent(subjectFilter)}` : "";
        const data = await apiFetch<QuestionBank[]>(`/api/v1/question_banks${params}`);
        setBanks(data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchBanks();
  }, [subjectFilter]);

  const subjects = [...new Set(banks.map((b) => b.subject).filter(Boolean))];

  async function handleExport(bankId: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setExportingId(bankId);
    try {
      await apiFetch(`/api/v1/question_banks/${bankId}/export_qti`, { method: "POST" });
      // Poll
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        try {
          const status = await apiFetch<{ status: string; download_url?: string }>(
            `/api/v1/question_banks/${bankId}/export_qti_status`,
          );
          if (status.status === "completed" && status.download_url) {
            window.open(status.download_url, "_blank");
            break;
          }
        } catch {
          // keep polling
        }
      }
    } catch {
      // ignore
    } finally {
      setExportingId(null);
    }
  }

  async function handleImport(bankId: number, file: File) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      await fetch(`${API_BASE}/api/v1/question_banks/${bankId}/import_qti`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
    } catch {
      // ignore
    }
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Question Banks</h1>
              <p className="mt-1 text-sm text-gray-500">Manage your question banks</p>
            </div>
            <Link
              href="/assess/banks/new"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              New Bank
            </Link>
          </div>

          {subjects.length > 0 && (
            <div>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              >
                <option value="">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : banks.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <p className="text-sm text-gray-500">No question banks yet</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {banks.map((bank) => (
                <Link
                  key={bank.id}
                  href={`/assess/banks/${bank.id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-base font-semibold text-gray-900">{bank.title}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        bank.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {bank.status}
                    </span>
                  </div>
                  {bank.subject && <p className="mt-1 text-xs text-gray-400">{bank.subject}</p>}
                  {bank.grade_level && (
                    <p className="text-xs text-gray-400">Grade: {bank.grade_level}</p>
                  )}
                  {bank.description && (
                    <p className="mt-2 text-sm text-gray-500 line-clamp-2">{bank.description}</p>
                  )}
                  <div className="mt-3 flex gap-2" onClick={(e) => e.preventDefault()}>
                    <button
                      onClick={(e) => handleExport(bank.id, e)}
                      disabled={exportingId === bank.id}
                      className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {exportingId === bank.id ? "Exporting..." : "Export QTI"}
                    </button>
                    <label
                      className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Import QTI
                      <input
                        type="file"
                        accept=".xml,.zip"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImport(bank.id, file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
