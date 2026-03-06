"use client";

import type { PlanningContext } from "@/curriculum/contexts/types";

interface PlanningContextSelectorProps {
  contexts: PlanningContext[];
  selectedContextId: string | null;
  loading?: boolean;
  onChange: (contextId: string) => void;
}

export default function PlanningContextSelector({
  contexts,
  selectedContextId,
  loading = false,
  onChange,
}: PlanningContextSelectorProps) {
  if (loading) {
    return <p className="text-sm text-gray-500">Loading planning contexts...</p>;
  }

  if (contexts.length === 0) {
    return <p className="text-sm text-gray-500">No planning contexts available.</p>;
  }

  return (
    <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div>
        <p className="text-sm font-medium text-gray-700">Planning context</p>
        <p className="text-xs text-gray-500">
          Choose the context that should scope your documents.
        </p>
      </div>
      <select
        value={selectedContextId || ""}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {contexts.map((context) => (
          <option key={context.id} value={String(context.id)}>
            {context.name} · {context.kind.replace(/_/g, " ")}
          </option>
        ))}
      </select>
    </div>
  );
}
