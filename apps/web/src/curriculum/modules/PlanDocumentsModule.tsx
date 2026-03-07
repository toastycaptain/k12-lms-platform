"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { mutate } from "swr";
import { Button, EmptyState } from "@k12/ui";
import PlanningContextSelector from "@/curriculum/contexts/PlanningContextSelector";
import { usePlanningContexts } from "@/curriculum/contexts/hooks";
import {
  readStoredPlanningContextId,
  writeStoredPlanningContextId,
} from "@/curriculum/contexts/selection";
import CreateDocumentWizard from "@/curriculum/documents/CreateDocumentWizard";
import DocumentList from "@/curriculum/documents/DocumentList";
import { useCurriculumRuntimeDetails } from "@/curriculum/runtime/useCurriculumPack";
import { canonicalIbHrefForDocument, isIbDocument } from "@/features/ib/document-routes";
import { useSchool } from "@/lib/school-context";

export default function PlanDocumentsModule() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { schoolId } = useSchool();
  const { data: contexts = [], isLoading } = usePlanningContexts({ per_page: 200 });
  const { runtime } = useCurriculumRuntimeDetails();
  const [wizardOpen, setWizardOpen] = useState(false);

  const selectedContextIdParam = searchParams.get("context_id");
  const validContextIds = useMemo(
    () => new Set(contexts.map((context) => String(context.id))),
    [contexts],
  );
  const selectedContextId =
    selectedContextIdParam && validContextIds.has(selectedContextIdParam)
      ? selectedContextIdParam
      : null;
  const selectedContext =
    contexts.find((context) => String(context.id) === selectedContextId) || null;

  useEffect(() => {
    if (isLoading || contexts.length === 0) {
      return;
    }

    if (selectedContextIdParam && validContextIds.has(selectedContextIdParam)) {
      writeStoredPlanningContextId(schoolId, selectedContextIdParam);
      return;
    }

    const storedContextId = readStoredPlanningContextId(schoolId);
    const nextContextId =
      storedContextId && validContextIds.has(storedContextId)
        ? storedContextId
        : String(contexts[0].id);
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("context_id", nextContextId);
    router.replace(`${pathname}?${nextParams.toString()}`);
    writeStoredPlanningContextId(schoolId, nextContextId);
  }, [
    contexts,
    isLoading,
    pathname,
    router,
    schoolId,
    searchParams,
    selectedContextIdParam,
    validContextIds,
  ]);

  function updateSelectedContext(nextContextId: string): void {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("context_id", nextContextId);
    router.replace(`${pathname}?${nextParams.toString()}`);
    writeStoredPlanningContextId(schoolId, nextContextId);
    void mutate(() => true, undefined, { revalidate: true });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Curriculum documents</h1>
          <p className="text-sm text-gray-600">
            Create, browse, and edit pack-aware curriculum documents inside a planning context.
          </p>
        </div>
        {selectedContext && runtime && Object.keys(runtime.documentTypes).length > 0 && (
          <Button onClick={() => setWizardOpen(true)}>New document</Button>
        )}
      </div>

      <PlanningContextSelector
        contexts={contexts}
        selectedContextId={selectedContextId}
        loading={isLoading}
        onChange={updateSelectedContext}
      />

      {!selectedContext ? (
        <EmptyState
          title="No planning context selected"
          description="Choose a context to start working with curriculum documents."
        />
      ) : (
        <DocumentList planningContextId={selectedContext.id} runtime={runtime} />
      )}

      {selectedContext && runtime && (
        <CreateDocumentWizard
          open={wizardOpen}
          planningContextId={selectedContext.id}
          documentTypes={runtime.documentTypes}
          onClose={() => setWizardOpen(false)}
          onCreated={async (document) => {
            if (isIbDocument(document)) {
              router.push(canonicalIbHrefForDocument(document) || `/plan/documents/${document.id}`);
              return;
            }

            router.push(`/plan/documents/${document.id}`);
          }}
        />
      )}
    </div>
  );
}
