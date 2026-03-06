"use client";

import { useMemo, useState } from "react";
import { useToast } from "@k12/ui";
import { apiFetch, ApiError } from "@/lib/api";
import CreateDocumentWizard from "@/curriculum/documents/CreateDocumentWizard";
import { useCurriculumDocumentLinks, useCurriculumDocuments } from "@/curriculum/documents/hooks";
import type { CurriculumDocument } from "@/curriculum/documents/types";
import type { PackRuntimeSubset } from "@/curriculum/runtime/types";

interface DocumentRelationshipsProps {
  document: CurriculumDocument;
  runtime: PackRuntimeSubset | null;
  onChange: () => Promise<void> | void;
}

export default function DocumentRelationships({
  document,
  runtime,
  onChange,
}: DocumentRelationshipsProps) {
  const { addToast } = useToast();
  const { data: links = [], mutate } = useCurriculumDocumentLinks(document.id);
  const { data: documents = [] } = useCurriculumDocuments({
    planning_context_id: document.planning_context_id,
    per_page: 200,
  });
  const [selectedTargets, setSelectedTargets] = useState<Record<string, string>>({});
  const [wizardState, setWizardState] = useState<{
    open: boolean;
    relationshipType: string;
    targetType: string | null;
  }>({
    open: false,
    relationshipType: "contains",
    targetType: null,
  });

  const relationshipRules = runtime?.documentTypes[document.document_type]?.relationships || {};
  const documentsById = useMemo(
    () => new Map(documents.map((entry) => [entry.id, entry])),
    [documents],
  );

  async function createLink(targetDocumentId: number, relationshipType: string): Promise<void> {
    try {
      await apiFetch(`/api/v1/curriculum_documents/${document.id}/links`, {
        method: "POST",
        body: JSON.stringify({
          link: {
            target_document_id: targetDocumentId,
            relationship_type: relationshipType,
            position: links.filter((link) => link.relationship_type === relationshipType).length,
          },
        }),
      });
      await mutate();
      await onChange();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to create relationship.";
      addToast("error", message);
    }
  }

  async function removeLink(linkId: number): Promise<void> {
    try {
      await apiFetch(`/api/v1/curriculum_document_links/${linkId}`, {
        method: "DELETE",
      });
      await mutate();
      await onChange();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to remove relationship.";
      addToast("error", message);
    }
  }

  if (Object.keys(relationshipRules).length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Relationships</h3>
        <p className="text-xs text-gray-500">Manage linked curriculum documents for this plan.</p>
      </div>

      {Object.entries(relationshipRules).map(([relationshipType, rule]) => {
        const groupedLinks = links.filter((link) => link.relationship_type === relationshipType);
        const candidateDocuments = documents.filter(
          (entry) =>
            entry.id !== document.id &&
            (rule.allowed_target_types || []).includes(entry.document_type),
        );

        return (
          <div
            key={relationshipType}
            className="space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {relationshipType.replace(/_/g, " ")}
                </p>
                <p className="text-xs text-gray-500">
                  Allowed: {(rule.allowed_target_types || []).join(", ") || "Any document type"}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {groupedLinks.map((link) => {
                const target = documentsById.get(link.target_document_id);
                return (
                  <div
                    key={link.id}
                    className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {target?.title || `Document #${link.target_document_id}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {target?.document_type?.replace(/_/g, " ") || "Linked document"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void removeLink(link.id)}
                      className="text-xs font-medium text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
              {groupedLinks.length === 0 && (
                <p className="text-xs text-gray-500">No related documents yet.</p>
              )}
            </div>
            {candidateDocuments.length > 0 && (
              <div className="flex gap-2">
                <select
                  value={selectedTargets[relationshipType] || ""}
                  onChange={(event) =>
                    setSelectedTargets((current) => ({
                      ...current,
                      [relationshipType]: event.target.value,
                    }))
                  }
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Add existing document…</option>
                  {candidateDocuments.map((candidate) => (
                    <option key={candidate.id} value={String(candidate.id)}>
                      {candidate.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const targetDocumentId = Number(selectedTargets[relationshipType]);
                    if (targetDocumentId) {
                      void createLink(targetDocumentId, relationshipType);
                    }
                  }}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700"
                >
                  Add existing
                </button>
              </div>
            )}
            {(rule.allowed_target_types || []).length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setWizardState({
                    open: true,
                    relationshipType,
                    targetType: rule.allowed_target_types?.[0] || null,
                  })
                }
                className="text-xs font-medium text-blue-700"
              >
                Create new related document
              </button>
            )}
          </div>
        );
      })}

      <CreateDocumentWizard
        open={wizardState.open}
        planningContextId={document.planning_context_id}
        documentTypes={runtime?.documentTypes || {}}
        defaultDocumentType={wizardState.targetType}
        onClose={() =>
          setWizardState({ open: false, relationshipType: "contains", targetType: null })
        }
        onCreated={async (createdDocument) => {
          await createLink(createdDocument.id, wizardState.relationshipType);
        }}
      />
    </div>
  );
}
