"use client";

import Link from "next/link";
import { EmptyState } from "@k12/ui";
import { usePlanningContext } from "@/curriculum/contexts/hooks";
import DocumentList from "@/curriculum/documents/DocumentList";
import { useCurriculumRuntimeDetails } from "@/curriculum/runtime/useCurriculumPack";

export default function PlanContextDetailModule({ contextId }: { contextId: number }) {
  const { data: context, isLoading } = usePlanningContext(contextId);
  const { runtime } = useCurriculumRuntimeDetails();

  if (isLoading && !context) {
    return <p className="text-sm text-gray-500">Loading planning context...</p>;
  }

  if (!context) {
    return (
      <EmptyState
        title="Planning context unavailable"
        description="The selected context could not be loaded."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="text-xs text-gray-500">
          <Link href="/plan/contexts" className="text-blue-700 hover:underline">
            Plan contexts
          </Link>
          <span> / {context.name}</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{context.name}</h1>
        <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
          <span>Kind: {context.kind.replace(/_/g, " ")}</span>
          <span>Status: {context.status}</span>
          <span>Courses: {context.course_ids.length}</span>
        </div>
      </div>
      <DocumentList planningContextId={context.id} runtime={runtime} />
    </div>
  );
}
