"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Pagination } from "@/components/Pagination";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { EmptyState } from "@/components/EmptyState";

interface Template {
  id: number;
  name: string;
  subject: string | null;
  grade_level: string | null;
  description: string | null;
  status: string;
  created_by_id: number;
  current_version_id: number | null;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-yellow-200 text-yellow-900",
    published: "bg-green-100 text-green-800",
    archived: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-600"}`}
    >
      {status}
    </span>
  );
}

export default function TemplateLibraryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterGrade, setFilterGrade] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [totalPages, setTotalPages] = useState(1);

  const canManage = user?.roles?.includes("admin") || user?.roles?.includes("curriculum_lead");

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await apiFetch<Template[]>(
          `/api/v1/templates?page=${page}&per_page=${perPage}`,
        );
        setTemplates(data);
        setTotalPages(data.length < perPage ? page : page + 1);
      } catch {
        // API may not be available
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [page, perPage]);

  const subjects = useMemo(() => {
    const set = new Set<string>();
    templates.forEach((t) => {
      if (t.subject) set.add(t.subject);
    });
    return Array.from(set).sort();
  }, [templates]);

  const gradeLevels = useMemo(() => {
    const set = new Set<string>();
    templates.forEach((t) => {
      if (t.grade_level) set.add(t.grade_level);
    });
    return Array.from(set).sort();
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      if (filterSubject !== "all" && t.subject !== filterSubject) return false;
      if (filterGrade !== "all" && t.grade_level !== filterGrade) return false;
      if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [templates, filterSubject, filterGrade, searchQuery]);

  async function handleUseTemplate(templateId: number) {
    router.push(`/plan/templates/${templateId}/use`);
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Template Library</h1>
            {canManage && (
              <Link
                href="/plan/templates/new"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Create Template
              </Link>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Grade Levels</option>
              {gradeLevels.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Template Cards */}
          {loading ? (
            <ListSkeleton />
          ) : filteredTemplates.length === 0 ? (
            <EmptyState
              title={
                templates.length === 0
                  ? "No templates available yet"
                  : "No templates match your filters"
              }
              description={
                templates.length === 0
                  ? "Create your first template to get started."
                  : "Try adjusting your search or filter criteria."
              }
              actionLabel={templates.length === 0 && canManage ? "Create Template" : undefined}
              actionHref={templates.length === 0 && canManage ? "/plan/templates/new" : undefined}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                    <StatusBadge status={template.status} />
                  </div>
                  {template.subject && (
                    <p className="mt-1 text-sm text-gray-500">{template.subject}</p>
                  )}
                  {template.grade_level && (
                    <p className="text-xs text-gray-400">{template.grade_level}</p>
                  )}
                  {template.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                      {template.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-2">
                    {template.status === "published" && (
                      <button
                        onClick={() => handleUseTemplate(template.id)}
                        className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        Use Template
                      </button>
                    )}
                    {canManage && (
                      <Link
                        href={`/plan/templates/${template.id}`}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        {template.status === "draft" ? "Edit" : "View"}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
