"use client";

import { useState } from "react";
import { useToast } from "@k12/ui";
import { apiFetch, ApiError } from "@/lib/api";
import { useCurriculumDocumentAlignments } from "@/curriculum/documents/hooks";
import FrameworkNodePicker from "@/curriculum/frameworks/FrameworkNodePicker";
import { useFrameworks } from "@/curriculum/frameworks/hooks";
import type { FrameworkNode } from "@/curriculum/frameworks/types";
import type { PackFrameworkBindings } from "@/curriculum/runtime/types";

interface DocumentAlignmentsProps {
  documentVersionId: number;
  frameworkBindings?: PackFrameworkBindings;
}

export default function DocumentAlignments({
  documentVersionId,
  frameworkBindings,
}: DocumentAlignmentsProps) {
  const { addToast } = useToast();
  const { data: frameworks = [] } = useFrameworks({ status: "active" });
  const { data: alignments = [], mutate } = useCurriculumDocumentAlignments(documentVersionId);
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<number | null>(null);

  const visibleFrameworks =
    !frameworkBindings?.allowed || frameworkBindings.allowed.length === 0
      ? frameworks
      : frameworks.filter((framework) =>
          new Set(frameworkBindings.allowed).has(framework.key || framework.name),
        );

  const resolvedFrameworkId = selectedFrameworkId ?? visibleFrameworks[0]?.id ?? null;
  const selectedNodes = alignments
    .filter((alignment) => {
      if (!resolvedFrameworkId) {
        return true;
      }

      return (alignment.standard?.standard_framework_id || 0) === resolvedFrameworkId;
    })
    .map(
      (alignment) =>
        alignment.standard || {
          id: alignment.standard_id,
          standard_framework_id: resolvedFrameworkId || 0,
          kind: alignment.alignment_type || "aligned",
          label: `Node #${alignment.standard_id}`,
        },
    );

  async function addAlignment(node: FrameworkNode): Promise<void> {
    try {
      await apiFetch(`/api/v1/curriculum_document_versions/${documentVersionId}/alignments`, {
        method: "POST",
        body: JSON.stringify({
          alignment: {
            standard_id: node.id,
            alignment_type: "aligned",
          },
        }),
      });
      await mutate();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to add alignment.";
      addToast("error", message);
    }
  }

  async function removeAlignment(nodeId: number): Promise<void> {
    try {
      await apiFetch(
        `/api/v1/curriculum_document_versions/${documentVersionId}/alignments/bulk_destroy`,
        {
          method: "DELETE",
          body: JSON.stringify({
            standard_ids: [nodeId],
          }),
        },
      );
      await mutate();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to remove alignment.";
      addToast("error", message);
    }
  }

  if (visibleFrameworks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Alignments</h3>
        <p className="text-xs text-gray-500">
          Attach this document version to frameworks and nodes.
        </p>
      </div>
      <select
        value={resolvedFrameworkId || ""}
        onChange={(event) => setSelectedFrameworkId(Number(event.target.value))}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      >
        {visibleFrameworks.map((framework) => (
          <option key={framework.id} value={framework.id}>
            {framework.name}
          </option>
        ))}
      </select>
      {resolvedFrameworkId && (
        <FrameworkNodePicker
          frameworkId={resolvedFrameworkId}
          selected={selectedNodes}
          onAdd={(node) => void addAlignment(node)}
          onRemove={(nodeId) => void removeAlignment(nodeId)}
        />
      )}
    </div>
  );
}
