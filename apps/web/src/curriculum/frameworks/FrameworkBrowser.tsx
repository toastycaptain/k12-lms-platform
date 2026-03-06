"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@k12/ui";
import {
  useFrameworkNodeSearch,
  useFrameworks,
  useFrameworkTree,
} from "@/curriculum/frameworks/hooks";
import type { FrameworkNodeTree } from "@/curriculum/frameworks/types";

function treeNodeLabel(node: FrameworkNodeTree): string {
  return node.label || node.code || node.identifier || `Node #${node.id}`;
}

function TreeNode({ node, depth }: { node: FrameworkNodeTree; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = node.children.length > 0;

  return (
    <div className={depth > 0 ? "ml-4 border-l border-gray-200 pl-3" : ""}>
      <div className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="mt-0.5 text-xs text-gray-500"
          >
            {expanded ? "−" : "+"}
          </button>
        ) : (
          <span className="mt-0.5 w-3 text-xs text-gray-300">•</span>
        )}
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900">{treeNodeLabel(node)}</p>
            {node.kind && <span className="text-xs text-gray-400">{node.kind}</span>}
          </div>
          {node.description && <p className="text-xs text-gray-500">{node.description}</p>}
        </div>
      </div>
      {expanded && hasChildren && (
        <div className="mt-1 space-y-1">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FrameworkBrowser() {
  const [frameworkKind, setFrameworkKind] = useState("");
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<number | null>(null);
  const [mode, setMode] = useState<"browse" | "search">("browse");
  const [query, setQuery] = useState("");

  const { data: frameworks = [], isLoading: loadingFrameworks } = useFrameworks({
    framework_kind: frameworkKind || undefined,
    status: "active",
  });
  const resolvedFrameworkId = selectedFrameworkId ?? frameworks[0]?.id ?? null;
  const { data: tree = [], isLoading: treeLoading } = useFrameworkTree(resolvedFrameworkId);
  const { data: searchResults = [], isLoading: searchLoading } = useFrameworkNodeSearch({
    q: query,
    standard_framework_id: resolvedFrameworkId || undefined,
    per_page: 20,
  });

  const selectedFramework = useMemo(
    () => frameworks.find((framework) => framework.id === resolvedFrameworkId),
    [frameworks, resolvedFrameworkId],
  );

  if (loadingFrameworks && frameworks.length === 0) {
    return <p className="text-sm text-gray-500">Loading frameworks...</p>;
  }

  if (frameworks.length === 0) {
    return (
      <EmptyState
        title="No frameworks available"
        description="Frameworks will appear here once they are configured for this school."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div>
          <label
            htmlFor="framework-kind-filter"
            className="block text-sm font-medium text-gray-700"
          >
            Framework kind
          </label>
          <select
            id="framework-kind-filter"
            value={frameworkKind}
            onChange={(event) => {
              setFrameworkKind(event.target.value);
              setSelectedFrameworkId(null);
            }}
            className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All kinds</option>
            <option value="standard">Standards</option>
            <option value="skill">Skills</option>
            <option value="concept">Concepts</option>
            <option value="objective">Objectives</option>
          </select>
        </div>
        <div>
          <label htmlFor="framework-selector" className="block text-sm font-medium text-gray-700">
            Framework
          </label>
          <select
            id="framework-selector"
            value={resolvedFrameworkId || ""}
            onChange={(event) => setSelectedFrameworkId(Number(event.target.value))}
            className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {frameworks.map((framework) => (
              <option key={framework.id} value={framework.id}>
                {framework.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("browse")}
            className={`rounded-full px-3 py-1.5 text-sm ${
              mode === "browse" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            Browse
          </button>
          <button
            type="button"
            onClick={() => setMode("search")}
            className={`rounded-full px-3 py-1.5 text-sm ${
              mode === "search" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            Search
          </button>
        </div>
      </div>

      {selectedFramework && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-900">{selectedFramework.name}</p>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
            {selectedFramework.framework_kind && (
              <span>Kind: {selectedFramework.framework_kind}</span>
            )}
            {selectedFramework.subject && <span>Subject: {selectedFramework.subject}</span>}
            {selectedFramework.jurisdiction && (
              <span>Jurisdiction: {selectedFramework.jurisdiction}</span>
            )}
            {selectedFramework.version && <span>Version: {selectedFramework.version}</span>}
          </div>
        </div>
      )}

      {mode === "browse" ? (
        treeLoading ? (
          <p className="text-sm text-gray-500">Loading framework tree...</p>
        ) : tree.length === 0 ? (
          <EmptyState
            title="No nodes in this framework"
            description="This framework does not have any nodes yet."
          />
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            {tree.map((node) => (
              <TreeNode key={node.id} node={node} depth={0} />
            ))}
          </div>
        )
      ) : (
        <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search nodes by code, label, or description..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          {searchLoading && <p className="text-sm text-gray-500">Searching framework nodes...</p>}
          {query.trim().length < 2 ? (
            <p className="text-sm text-gray-500">Enter at least two characters to search.</p>
          ) : searchResults.length === 0 ? (
            <EmptyState
              title="No matching nodes"
              description="Try a different search term or framework filter."
            />
          ) : (
            <div className="space-y-2">
              {searchResults.map((node) => (
                <div key={node.id} className="rounded-lg border border-gray-200 p-3">
                  <p className="text-sm font-medium text-gray-900">
                    {node.label || node.code || node.identifier || `Node #${node.id}`}
                  </p>
                  {node.description && <p className="text-xs text-gray-500">{node.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
