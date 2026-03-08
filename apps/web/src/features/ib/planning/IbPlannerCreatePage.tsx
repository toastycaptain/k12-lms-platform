"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, EmptyState } from "@k12/ui";
import { usePlanningContexts } from "@/curriculum/contexts/hooks";
import { useCurriculumRuntimeDetails } from "@/curriculum/runtime/useCurriculumPack";
import { apiFetch } from "@/lib/api";
import type { CurriculumDocument } from "@/curriculum/documents/types";

interface IbPlannerCreatePageProps {
  title: string;
  description: string;
  routeTemplate: string;
  preferredDocumentType: string;
  fallbackDocumentType: string;
  preferredSchemaKey: string;
  fallbackSchemaKey: string;
}

export function IbPlannerCreatePage({
  title,
  description,
  routeTemplate,
  preferredDocumentType,
  fallbackDocumentType,
  preferredSchemaKey,
  fallbackSchemaKey,
}: IbPlannerCreatePageProps) {
  const router = useRouter();
  const { data: contexts = [], isLoading } = usePlanningContexts({ per_page: 200 });
  const { runtime } = useCurriculumRuntimeDetails();
  const [selectedContextId, setSelectedContextId] = useState<string>("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableContextId = selectedContextId || (contexts[0] ? String(contexts[0].id) : "");
  const documentDefinition = useMemo(() => {
    if (runtime?.documentTypes?.[preferredDocumentType]) {
      return { documentType: preferredDocumentType, schemaKey: preferredSchemaKey };
    }

    return { documentType: fallbackDocumentType, schemaKey: fallbackSchemaKey };
  }, [
    fallbackDocumentType,
    fallbackSchemaKey,
    preferredDocumentType,
    preferredSchemaKey,
    runtime?.documentTypes,
  ]);

  async function handleCreate(): Promise<void> {
    if (!availableContextId) {
      setError("Select a planning context before creating a record.");
      return;
    }

    if (!documentTitle.trim()) {
      setError("A title is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const document = await apiFetch<CurriculumDocument>("/api/v1/curriculum_documents", {
        method: "POST",
        body: JSON.stringify({
          curriculum_document: {
            planning_context_id: Number(availableContextId),
            document_type: documentDefinition.documentType,
            title: documentTitle.trim(),
            schema_key: documentDefinition.schemaKey,
            content: { title: documentTitle.trim() },
          },
        }),
      });
      router.push(routeTemplate.replace(":id", String(document.id)));
    } catch {
      setError("Unable to create the IB planning record.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-slate-600">Loading planning contexts...</p>;
  }

  if (contexts.length === 0) {
    return (
      <EmptyState
        title="No planning contexts yet"
        description="Create a planning context first, then return to this IB-native creation flow."
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Planning context</label>
            <select
              value={availableContextId}
              onChange={(event) => setSelectedContextId(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            >
              {contexts.map((context) => (
                <option key={context.id} value={context.id}>
                  {context.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Title</label>
            <input
              type="text"
              value={documentTitle}
              onChange={(event) => setDocumentTitle(event.target.value)}
              placeholder="Enter a title"
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Creating as{" "}
            <span className="font-semibold text-slate-900">{documentDefinition.documentType}</span>{" "}
            using{" "}
            <span className="font-semibold text-slate-900">{documentDefinition.schemaKey}</span>
          </div>

          {error ? <p className="text-sm text-rose-700">{error}</p> : null}

          <div className="flex justify-end">
            <Button onClick={() => void handleCreate()} disabled={submitting}>
              {submitting ? "Creating..." : "Create and open studio"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
