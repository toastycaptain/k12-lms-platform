"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button, EmptyState, TextArea, useToast } from "@k12/ui";
import { apiFetch, ApiError } from "@/lib/api";
import { usePlanningContext } from "@/curriculum/contexts/hooks";
import DocumentAlignments from "@/curriculum/documents/DocumentAlignments";
import DocumentRelationships from "@/curriculum/documents/DocumentRelationships";
import { useCurriculumDocument, useCurriculumDocumentVersions } from "@/curriculum/documents/hooks";
import { buildLegacySchemaDefinition } from "@/curriculum/schema/legacy";
import SchemaRenderer from "@/curriculum/schema/SchemaRenderer";
import { extractSchemaErrors } from "@/curriculum/schema/errors";
import {
  useCurriculumPack,
  useCurriculumRuntimeDetails,
} from "@/curriculum/runtime/useCurriculumPack";
import WorkflowActions from "@/curriculum/workflow/WorkflowActions";
import WorkflowBadge from "@/curriculum/workflow/WorkflowBadge";

interface DocumentEditorProps {
  documentId: number;
}

export default function DocumentEditor({ documentId }: DocumentEditorProps) {
  const { addToast } = useToast();
  const { data: document, isLoading, mutate } = useCurriculumDocument(documentId);
  const { data: versions = [], mutate: mutateVersions } = useCurriculumDocumentVersions(documentId);
  const { data: context } = usePlanningContext(document?.planning_context_id);
  const { runtime: runtimeDetails } = useCurriculumRuntimeDetails();
  const { pack } = useCurriculumPack(document?.pack_key, document?.pack_version);
  const runtime = pack || runtimeDetails;
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [draftContent, setDraftContent] = useState<Record<string, unknown>>({});
  const [fallbackJson, setFallbackJson] = useState("{}");
  const [schemaErrors, setSchemaErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const orderedVersions = useMemo(
    () => [...versions].sort((left, right) => right.version_number - left.version_number),
    [versions],
  );

  useEffect(() => {
    if (!selectedVersionId && orderedVersions[0]?.id) {
      setSelectedVersionId(orderedVersions[0].id);
    }
  }, [orderedVersions, selectedVersionId]);

  const activeVersion =
    orderedVersions.find((version) => version.id === selectedVersionId) ||
    orderedVersions[0] ||
    document?.current_version ||
    null;

  useEffect(() => {
    setTitle(document?.title || "");
  }, [document?.title]);

  useEffect(() => {
    const nextContent =
      activeVersion?.content && typeof activeVersion.content === "object"
        ? activeVersion.content
        : {};
    setDraftContent(nextContent as Record<string, unknown>);
    setFallbackJson(JSON.stringify(nextContent, null, 2));
    setSchemaErrors({});
  }, [activeVersion?.id, activeVersion?.content]);

  const schemaDefinition = useMemo(() => {
    if (!document) {
      return null;
    }

    const explicitSchema = runtime?.documentSchemas[document.schema_key];
    if (explicitSchema) {
      return {
        schema_key: document.schema_key,
        data_schema: explicitSchema.data_schema,
        ui_schema: explicitSchema.ui_schema || {},
      };
    }

    return buildLegacySchemaDefinition(
      document.document_type,
      runtime?.plannerObjectSchemas[document.document_type],
      document.schema_key,
    );
  }, [document, runtime]);

  const documentTypeLabel = document
    ? runtime?.documentTypes[document.document_type]?.label ||
      document.document_type.replace(/_/g, " ")
    : "Document";

  async function refreshDocument(): Promise<void> {
    await Promise.all([mutate(), mutateVersions()]);
  }

  async function saveVersion(): Promise<void> {
    if (!document) {
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSchemaErrors({});

    try {
      const payload = schemaDefinition ? draftContent : JSON.parse(fallbackJson);
      await apiFetch(`/api/v1/curriculum_documents/${document.id}/versions`, {
        method: "POST",
        body: JSON.stringify({
          version: {
            title: title.trim() || document.title,
            content: payload,
          },
        }),
      });
      addToast("success", "Document saved as a new version.");
      await refreshDocument();
    } catch (error) {
      if (error instanceof SyntaxError) {
        setSaveError("Fallback JSON is not valid.");
      } else if (error instanceof ApiError) {
        setSaveError(error.message);
        setSchemaErrors(extractSchemaErrors(error.details));
      } else {
        setSaveError("Unable to save document.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (isLoading && !document) {
    return <p className="text-sm text-gray-500">Loading document...</p>;
  }

  if (!document) {
    return (
      <EmptyState
        title="Document unavailable"
        description="The selected curriculum document could not be loaded."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="text-xs text-gray-500">
              <Link href="/plan/documents" className="text-blue-700 hover:underline">
                Plan
              </Link>
              {context && (
                <>
                  <span> / </span>
                  <Link
                    href={`/plan/contexts/${context.id}`}
                    className="text-blue-700 hover:underline"
                  >
                    {context.name}
                  </Link>
                </>
              )}
              <span> / {documentTypeLabel}</span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-2xl font-semibold text-gray-900"
            />
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <WorkflowBadge state={document.workflow?.state || document.status} />
              {document.pack_key && document.pack_version && (
                <span>
                  {document.pack_key}@{document.pack_version}
                </span>
              )}
              <span>Schema {document.schema_key}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {orderedVersions.length > 1 && (
              <select
                value={selectedVersionId || orderedVersions[0]?.id || ""}
                onChange={(event) => setSelectedVersionId(Number(event.target.value))}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {orderedVersions.map((version) => (
                  <option key={version.id} value={version.id}>
                    Version {version.version_number}
                  </option>
                ))}
              </select>
            )}
            <WorkflowActions
              documentId={document.id}
              events={document.workflow?.available_events || []}
              onTransitionComplete={refreshDocument}
            />
            <Button onClick={() => void saveVersion()} disabled={saving}>
              {saving ? "Saving..." : "Save new version"}
            </Button>
          </div>
        </div>
        {saveError && <p className="mt-3 text-sm text-red-600">{saveError}</p>}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-4">
          {schemaDefinition ? (
            <SchemaRenderer
              definition={schemaDefinition}
              value={draftContent}
              errors={schemaErrors}
              onChange={setDraftContent}
            />
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Raw content</h3>
                <p className="text-sm text-gray-500">
                  A schema definition is not available for this document, so editing falls back to
                  raw JSON.
                </p>
              </div>
              <TextArea
                rows={18}
                value={fallbackJson}
                onChange={(event) => setFallbackJson(event.target.value)}
                error={Boolean(saveError)}
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <DocumentRelationships document={document} runtime={runtime} onChange={refreshDocument} />
          {activeVersion?.id && (
            <DocumentAlignments
              documentVersionId={activeVersion.id}
              frameworkBindings={runtime?.frameworkBindings}
            />
          )}
        </div>
      </div>
    </div>
  );
}
