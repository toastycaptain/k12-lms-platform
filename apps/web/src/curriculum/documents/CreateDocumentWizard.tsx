"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Modal, useToast } from "@k12/ui";
import { apiFetch, ApiError } from "@/lib/api";
import type { CurriculumDocument } from "@/curriculum/documents/types";
import type { PackDocumentType } from "@/curriculum/runtime/types";

interface CreateDocumentWizardProps {
  open: boolean;
  planningContextId: number;
  documentTypes: Record<string, PackDocumentType>;
  defaultDocumentType?: string | null;
  onClose: () => void;
  onCreated?: (document: CurriculumDocument) => Promise<void> | void;
}

export default function CreateDocumentWizard({
  open,
  planningContextId,
  documentTypes,
  defaultDocumentType,
  onClose,
  onCreated,
}: CreateDocumentWizardProps) {
  const { addToast } = useToast();
  const documentTypeOptions = useMemo(() => Object.entries(documentTypes), [documentTypes]);
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState(
    defaultDocumentType || documentTypeOptions[0]?.[0] || "",
  );
  const [schemaKey, setSchemaKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextType = defaultDocumentType || documentTypeOptions[0]?.[0] || "";
    setDocumentType(nextType);
    setSchemaKey(documentTypes[nextType]?.default_schema_key || "");
    setTitle("");
    setError(null);
  }, [defaultDocumentType, documentTypeOptions, documentTypes, open]);

  useEffect(() => {
    if (!documentType) {
      setSchemaKey("");
      return;
    }

    const definition = documentTypes[documentType];
    if (!definition) {
      setSchemaKey("");
      return;
    }

    if (schemaKey && definition.allowed_schema_keys.includes(schemaKey)) {
      return;
    }

    setSchemaKey(definition.default_schema_key || definition.allowed_schema_keys[0] || "");
  }, [documentType, documentTypes, schemaKey]);

  async function handleCreate(): Promise<void> {
    if (!title.trim() || !documentType) {
      setError("Title and document type are required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const document = await apiFetch<CurriculumDocument>("/api/v1/curriculum_documents", {
        method: "POST",
        body: JSON.stringify({
          curriculum_document: {
            planning_context_id: planningContextId,
            document_type: documentType,
            title: title.trim(),
            schema_key: schemaKey || undefined,
            content: {},
          },
        }),
      });
      addToast("success", "Curriculum document created.");
      onClose();
      await onCreated?.(document);
    } catch (createError) {
      const message =
        createError instanceof ApiError ? createError.message : "Unable to create document.";
      setError(message);
      addToast("error", message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} title="Create curriculum document" onClose={onClose}>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="new-document-title" className="text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            id="new-document-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="new-document-type" className="text-sm font-medium text-gray-700">
            Document type
          </label>
          <select
            id="new-document-type"
            value={documentType}
            onChange={(event) => setDocumentType(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {documentTypeOptions.map(([key, definition]) => (
              <option key={key} value={key}>
                {definition.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="new-document-schema" className="text-sm font-medium text-gray-700">
            Schema
          </label>
          <select
            id="new-document-schema"
            value={schemaKey}
            onChange={(event) => setSchemaKey(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {(documentTypes[documentType]?.allowed_schema_keys || []).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void handleCreate()} disabled={submitting}>
            {submitting ? "Creating..." : "Create document"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
