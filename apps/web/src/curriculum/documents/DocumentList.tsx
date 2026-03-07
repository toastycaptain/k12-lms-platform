"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState, Pagination } from "@k12/ui";
import { useCurriculumDocuments } from "@/curriculum/documents/hooks";
import type { PackRuntimeSubset } from "@/curriculum/runtime/types";
import { canonicalIbHrefForDocument, isIbDocument } from "@/features/ib/document-routes";
import WorkflowBadge from "@/curriculum/workflow/WorkflowBadge";

interface DocumentListProps {
  planningContextId: number;
  runtime: PackRuntimeSubset | null;
  documentType?: string;
}

function documentTypeLabel(runtime: PackRuntimeSubset | null, documentType: string): string {
  return runtime?.documentTypes[documentType]?.label || documentType.replace(/_/g, " ");
}

export default function DocumentList({
  planningContextId,
  runtime,
  documentType,
}: DocumentListProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [selectedType, setSelectedType] = useState(documentType || "");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const { data: documents = [], isLoading } = useCurriculumDocuments({
    planning_context_id: planningContextId,
    document_type: selectedType || undefined,
    status: status || undefined,
    q: query || undefined,
    page,
    per_page: perPage,
  });

  const documentTypes = useMemo(
    () => Object.entries(runtime?.documentTypes || {}),
    [runtime?.documentTypes],
  );

  const statusOptions = useMemo(() => {
    if (!runtime) {
      return [];
    }

    if (selectedType && runtime.documentTypes[selectedType]?.allowed_statuses) {
      return runtime.documentTypes[selectedType].allowed_statuses || [];
    }

    return Array.from(
      new Set(
        Object.values(runtime.documentTypes).flatMap(
          (definition) => definition.allowed_statuses || [],
        ),
      ),
    );
  }, [runtime, selectedType]);

  const totalPages = documents.length < perPage ? page : page + 1;

  if (!isLoading && documents.length === 0) {
    return (
      <EmptyState
        title="No documents found"
        description="Create a curriculum document in this context to begin planning."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <input
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder="Search documents..."
          className="min-w-[16rem] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          value={selectedType}
          onChange={(event) => {
            setSelectedType(event.target.value);
            setPage(1);
          }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All document types</option>
          {documentTypes.map(([key, definition]) => (
            <option key={key} value={key}>
              {definition.label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading documents...</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {documents.map((document) => (
            <Link
              key={document.id}
              href={
                isIbDocument(document)
                  ? (canonicalIbHrefForDocument(document) ?? `/plan/documents/${document.id}`)
                  : `/plan/documents/${document.id}`
              }
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">
                    {documentTypeLabel(runtime, document.document_type)}
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900">{document.title}</h3>
                </div>
                <WorkflowBadge state={document.workflow?.state || document.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                {document.updated_at && (
                  <span>Updated {new Date(document.updated_at).toLocaleDateString()}</span>
                )}
                {document.current_version?.version_number && (
                  <span>Version {document.current_version.version_number}</span>
                )}
              </div>
            </Link>
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
  );
}
