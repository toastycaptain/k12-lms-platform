"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@k12/ui";
import { useFrameworkNodeSearch } from "@/curriculum/frameworks/hooks";
import type { FrameworkNode } from "@/curriculum/frameworks/types";

interface FrameworkNodePickerProps {
  frameworkId: number;
  selected: FrameworkNode[];
  onAdd: (node: FrameworkNode) => void;
  onRemove: (nodeId: number) => void;
  nodeKindFilter?: string | null;
}

function nodeLabel(node: FrameworkNode): string {
  return node.label || node.code || node.identifier || `Node #${node.id}`;
}

export default function FrameworkNodePicker({
  frameworkId,
  selected,
  onAdd,
  onRemove,
  nodeKindFilter,
}: FrameworkNodePickerProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const { data: results = [], isLoading } = useFrameworkNodeSearch({
    q: debouncedQuery,
    standard_framework_id: frameworkId,
    kind: nodeKindFilter || undefined,
    per_page: 20,
  });

  const selectedIds = useMemo(() => new Set(selected.map((node) => node.id)), [selected]);
  const suggestions = results.filter((node) => !selectedIds.has(node.id));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {selected.map((node) => (
          <span
            key={node.id}
            className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700"
          >
            {nodeLabel(node)}
            <button type="button" onClick={() => onRemove(node.id)} className="font-semibold">
              ×
            </button>
          </span>
        ))}
      </div>

      <div className="space-y-2">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search framework nodes..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {isLoading && <p className="text-xs text-gray-500">Searching nodes…</p>}
        {debouncedQuery.length >= 2 && suggestions.length > 0 && (
          <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
            {suggestions.map((node) => (
              <div key={node.id} className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{nodeLabel(node)}</p>
                  {node.description && <p className="text-xs text-gray-500">{node.description}</p>}
                </div>
                <Button variant="secondary" onClick={() => onAdd(node)}>
                  Add
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
