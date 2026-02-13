"use client";

import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";

interface StandardFramework {
  id: number;
  name: string;
  subject: string | null;
  jurisdiction: string | null;
  version: string | null;
}

interface StandardTree {
  id: number;
  code: string;
  description: string;
  grade_band: string | null;
  children: StandardTree[];
}

function StandardNode({
  node,
  searchQuery,
  depth,
}: {
  node: StandardTree;
  searchQuery: string;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = node.children && node.children.length > 0;

  const matchesSearch =
    !searchQuery ||
    node.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.description.toLowerCase().includes(searchQuery.toLowerCase());

  const childMatchesSearch = searchQuery
    ? hasSearchMatch(node.children, searchQuery)
    : false;

  if (searchQuery && !matchesSearch && !childMatchesSearch) {
    return null;
  }

  return (
    <div className={depth > 0 ? "ml-4 border-l border-gray-200 pl-3" : ""}>
      <div
        className={`flex items-start gap-2 rounded-md px-2 py-1.5 ${
          matchesSearch && searchQuery ? "bg-yellow-50" : "hover:bg-gray-50"
        }`}
      >
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-gray-400 hover:text-gray-600"
          >
            {expanded ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        ) : (
          <span className="mt-0.5 h-5 w-5 flex-shrink-0" />
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-blue-700">{node.code}</span>
            {node.grade_band && (
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                {node.grade_band}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">{node.description}</p>
        </div>
      </div>
      {expanded && hasChildren && (
        <div className="mt-1">
          {node.children.map((child) => (
            <StandardNode
              key={child.id}
              node={child}
              searchQuery={searchQuery}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function hasSearchMatch(children: StandardTree[], query: string): boolean {
  for (const child of children) {
    if (
      child.code.toLowerCase().includes(query.toLowerCase()) ||
      child.description.toLowerCase().includes(query.toLowerCase())
    ) {
      return true;
    }
    if (child.children && hasSearchMatch(child.children, query)) {
      return true;
    }
  }
  return false;
}

export default function StandardsBrowserPage() {
  const [frameworks, setFrameworks] = useState<StandardFramework[]>([]);
  const [selectedFramework, setSelectedFramework] = useState<number | null>(null);
  const [tree, setTree] = useState<StandardTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [treeLoading, setTreeLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchFrameworks() {
      try {
        const data = await apiFetch<StandardFramework[]>("/api/v1/standard_frameworks");
        setFrameworks(data);
        if (data.length > 0) {
          setSelectedFramework(data[0].id);
        }
      } catch {
        // API may not be available
      } finally {
        setLoading(false);
      }
    }
    fetchFrameworks();
  }, []);

  useEffect(() => {
    if (!selectedFramework) return;
    async function fetchTree() {
      setTreeLoading(true);
      try {
        const data = await apiFetch<StandardTree[]>(
          `/api/v1/standard_frameworks/${selectedFramework}/tree`,
        );
        setTree(data);
      } catch {
        setTree([]);
      } finally {
        setTreeLoading(false);
      }
    }
    fetchTree();
  }, [selectedFramework]);

  const selectedFw = useMemo(
    () => frameworks.find((f) => f.id === selectedFramework),
    [frameworks, selectedFramework],
  );

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Standards Browser</h1>

          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : frameworks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
              <p className="text-sm text-gray-500">No standard frameworks available.</p>
            </div>
          ) : (
            <>
              {/* Framework Selection */}
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Framework</label>
                  <select
                    value={selectedFramework || ""}
                    onChange={(e) => setSelectedFramework(parseInt(e.target.value))}
                    className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {frameworks.map((fw) => (
                      <option key={fw.id} value={fw.id}>
                        {fw.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search by code or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Framework Info */}
              {selectedFw && (
                <div className="rounded-md bg-gray-50 px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">{selectedFw.name}</p>
                  <div className="mt-1 flex gap-4 text-xs text-gray-500">
                    {selectedFw.subject && <span>Subject: {selectedFw.subject}</span>}
                    {selectedFw.jurisdiction && (
                      <span>Jurisdiction: {selectedFw.jurisdiction}</span>
                    )}
                    {selectedFw.version && <span>Version: {selectedFw.version}</span>}
                  </div>
                </div>
              )}

              {/* Standards Tree */}
              {treeLoading ? (
                <p className="text-sm text-gray-500">Loading standards...</p>
              ) : tree.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                  <p className="text-sm text-gray-500">No standards in this framework.</p>
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  {tree.map((node) => (
                    <StandardNode
                      key={node.id}
                      node={node}
                      searchQuery={searchQuery}
                      depth={0}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
