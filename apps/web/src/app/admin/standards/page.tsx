"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch, ApiError } from "@/lib/api";

interface StandardFramework {
  id: number;
  name: string;
  jurisdiction: string | null;
  subject: string | null;
  version: string | null;
}

interface StandardTreeNode {
  id: number;
  code: string;
  description: string;
  grade_band: string | null;
  children: StandardTreeNode[];
}

interface StandardListItem {
  id: number;
}

interface FrameworkDraft {
  name: string;
  jurisdiction: string;
  subject: string;
  version: string;
}

interface StandardDraft {
  code: string;
  description: string;
  grade_band: string;
  parent_id: string;
}

interface ImportStatus {
  running: boolean;
  created: number;
  errors: number;
  messages: string[];
}

const ADMIN_ROLES = ["admin", "curriculum_lead"];

function countTreeNodes(nodes: StandardTreeNode[]): number {
  return nodes.reduce((count, node) => count + 1 + countTreeNodes(node.children || []), 0);
}

function flattenTree(
  nodes: StandardTreeNode[],
  depth = 0,
): Array<{ id: number; code: string; label: string }> {
  return nodes.flatMap((node) => [
    {
      id: node.id,
      code: node.code,
      label: `${"  ".repeat(depth)}${node.code}`,
    },
    ...flattenTree(node.children || [], depth + 1),
  ]);
}

function newFrameworkDraft(): FrameworkDraft {
  return {
    name: "",
    jurisdiction: "",
    subject: "",
    version: "",
  };
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }

  fields.push(current.trim());
  return fields;
}

function newStandardDraft(): StandardDraft {
  return {
    code: "",
    description: "",
    grade_band: "",
    parent_id: "",
  };
}

export default function AdminStandardsPage() {
  const [frameworks, setFrameworks] = useState<StandardFramework[]>([]);
  const [standardCounts, setStandardCounts] = useState<Record<number, number>>({});
  const [frameworkTrees, setFrameworkTrees] = useState<Record<number, StandardTreeNode[]>>({});
  const [expandedFrameworkId, setExpandedFrameworkId] = useState<number | null>(null);
  const [treeLoadingFrameworkIds, setTreeLoadingFrameworkIds] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateFramework, setShowCreateFramework] = useState(false);
  const [createFrameworkDraft, setCreateFrameworkDraft] =
    useState<FrameworkDraft>(newFrameworkDraft());
  const [savingFramework, setSavingFramework] = useState(false);

  const [editingFrameworkId, setEditingFrameworkId] = useState<number | null>(null);
  const [editingFrameworkDraft, setEditingFrameworkDraft] =
    useState<FrameworkDraft>(newFrameworkDraft());

  const [standardDraftByFramework, setStandardDraftByFramework] = useState<
    Record<number, StandardDraft>
  >({});
  const [editingStandardId, setEditingStandardId] = useState<number | null>(null);
  const [editingStandardDraft, setEditingStandardDraft] = useState<
    Omit<StandardDraft, "parent_id">
  >({
    code: "",
    description: "",
    grade_band: "",
  });

  const [bulkImportInputByFramework, setBulkImportInputByFramework] = useState<
    Record<number, string>
  >({});
  const [importStatusByFramework, setImportStatusByFramework] = useState<
    Record<number, ImportStatus>
  >({});

  const fetchFrameworks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const frameworkData = await apiFetch<StandardFramework[]>("/api/v1/standard_frameworks");
      setFrameworks(frameworkData);

      const countResults = await Promise.allSettled(
        frameworkData.map((framework) =>
          apiFetch<StandardListItem[]>(`/api/v1/standards?standard_framework_id=${framework.id}`),
        ),
      );

      const counts: Record<number, number> = {};
      frameworkData.forEach((framework, index) => {
        const result = countResults[index];
        counts[framework.id] = result && result.status === "fulfilled" ? result.value.length : 0;
      });

      setStandardCounts(counts);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to load standard frameworks.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFrameworkTree = useCallback(async (frameworkId: number) => {
    setTreeLoadingFrameworkIds((current) =>
      current.includes(frameworkId) ? current : [frameworkId, ...current],
    );

    try {
      const tree = await apiFetch<StandardTreeNode[]>(
        `/api/v1/standard_frameworks/${frameworkId}/tree`,
      );
      setFrameworkTrees((current) => ({ ...current, [frameworkId]: tree }));
      setStandardCounts((current) => ({ ...current, [frameworkId]: countTreeNodes(tree) }));
    } catch (requestError) {
      setError(
        requestError instanceof ApiError ? requestError.message : "Unable to load standards tree.",
      );
    } finally {
      setTreeLoadingFrameworkIds((current) => current.filter((id) => id !== frameworkId));
    }
  }, []);

  useEffect(() => {
    void fetchFrameworks();
  }, [fetchFrameworks]);

  const expandedFrameworkTree = useMemo(
    () => (expandedFrameworkId ? frameworkTrees[expandedFrameworkId] || [] : []),
    [expandedFrameworkId, frameworkTrees],
  );

  const parentOptions = useMemo(() => flattenTree(expandedFrameworkTree), [expandedFrameworkTree]);

  function toggleFramework(frameworkId: number): void {
    setExpandedFrameworkId((current) => {
      const nextValue = current === frameworkId ? null : frameworkId;
      if (nextValue && !frameworkTrees[nextValue]) {
        void fetchFrameworkTree(nextValue);
      }
      return nextValue;
    });
    setEditingStandardId(null);
  }

  async function createFramework(): Promise<void> {
    setSavingFramework(true);
    try {
      await apiFetch("/api/v1/standard_frameworks", {
        method: "POST",
        body: JSON.stringify({ standard_framework: createFrameworkDraft }),
      });

      setCreateFrameworkDraft(newFrameworkDraft());
      setShowCreateFramework(false);
      await fetchFrameworks();
    } catch (requestError) {
      setError(
        requestError instanceof ApiError ? requestError.message : "Unable to create framework.",
      );
    } finally {
      setSavingFramework(false);
    }
  }

  function startFrameworkEdit(framework: StandardFramework): void {
    setEditingFrameworkId(framework.id);
    setEditingFrameworkDraft({
      name: framework.name,
      jurisdiction: framework.jurisdiction || "",
      subject: framework.subject || "",
      version: framework.version || "",
    });
  }

  async function saveFrameworkEdit(frameworkId: number): Promise<void> {
    try {
      await apiFetch(`/api/v1/standard_frameworks/${frameworkId}`, {
        method: "PATCH",
        body: JSON.stringify({ standard_framework: editingFrameworkDraft }),
      });

      setEditingFrameworkId(null);
      await fetchFrameworks();
    } catch (requestError) {
      setError(
        requestError instanceof ApiError ? requestError.message : "Unable to update framework.",
      );
    }
  }

  async function deleteFramework(frameworkId: number): Promise<void> {
    if (!confirm("Delete this framework and all standards?")) return;

    try {
      await apiFetch(`/api/v1/standard_frameworks/${frameworkId}`, {
        method: "DELETE",
      });

      if (expandedFrameworkId === frameworkId) {
        setExpandedFrameworkId(null);
      }
      await fetchFrameworks();
    } catch (requestError) {
      setError(
        requestError instanceof ApiError ? requestError.message : "Unable to delete framework.",
      );
    }
  }

  async function createStandard(frameworkId: number): Promise<void> {
    const draft = standardDraftByFramework[frameworkId] || newStandardDraft();

    try {
      await apiFetch("/api/v1/standards", {
        method: "POST",
        body: JSON.stringify({
          standard: {
            standard_framework_id: frameworkId,
            parent_id: draft.parent_id ? Number(draft.parent_id) : null,
            code: draft.code,
            description: draft.description,
            grade_band: draft.grade_band || null,
          },
        }),
      });

      setStandardDraftByFramework((current) => ({
        ...current,
        [frameworkId]: newStandardDraft(),
      }));
      await fetchFrameworkTree(frameworkId);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError ? requestError.message : "Unable to create standard.",
      );
    }
  }

  function beginStandardEdit(node: StandardTreeNode): void {
    setEditingStandardId(node.id);
    setEditingStandardDraft({
      code: node.code,
      description: node.description,
      grade_band: node.grade_band || "",
    });
  }

  async function saveStandardEdit(frameworkId: number, standardId: number): Promise<void> {
    try {
      await apiFetch(`/api/v1/standards/${standardId}`, {
        method: "PATCH",
        body: JSON.stringify({
          standard: {
            code: editingStandardDraft.code,
            description: editingStandardDraft.description,
            grade_band: editingStandardDraft.grade_band || null,
          },
        }),
      });

      setEditingStandardId(null);
      await fetchFrameworkTree(frameworkId);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError ? requestError.message : "Unable to update standard.",
      );
    }
  }

  async function deleteStandard(frameworkId: number, standardId: number): Promise<void> {
    if (!confirm("Delete this standard?")) return;

    try {
      await apiFetch(`/api/v1/standards/${standardId}`, {
        method: "DELETE",
      });

      if (editingStandardId === standardId) {
        setEditingStandardId(null);
      }
      await fetchFrameworkTree(frameworkId);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError ? requestError.message : "Unable to delete standard.",
      );
    }
  }

  async function runBulkImport(frameworkId: number): Promise<void> {
    const csv = bulkImportInputByFramework[frameworkId] || "";
    const lines = csv
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      setImportStatusByFramework((current) => ({
        ...current,
        [frameworkId]: {
          running: false,
          created: 0,
          errors: 1,
          messages: ["CSV input is empty."],
        },
      }));
      return;
    }

    const existingTree = frameworkTrees[frameworkId] || [];
    const codeToId = flattenTree(existingTree).reduce<Record<string, number>>((map, item) => {
      map[item.code] = item.id;
      return map;
    }, {});

    let created = 0;
    let errors = 0;
    const messages: string[] = [];

    setImportStatusByFramework((current) => ({
      ...current,
      [frameworkId]: { running: true, created: 0, errors: 0, messages: [] },
    }));

    for (const [index, line] of lines.entries()) {
      const parts = parseCSVLine(line);
      const code = parts[0] || "";
      const description = parts[1] || "";
      const gradeBand = parts[2] || null;
      const parentCode = parts[3] || null;

      if (!code || !description) {
        errors += 1;
        messages.push(`Line ${index + 1}: missing required code or description.`);
        continue;
      }

      const parentId = parentCode ? codeToId[parentCode] : null;
      if (parentCode && !parentId) {
        errors += 1;
        messages.push(`Line ${index + 1}: parent code '${parentCode}' was not found.`);
        continue;
      }

      try {
        const createdStandard = await apiFetch<{ id: number }>("/api/v1/standards", {
          method: "POST",
          body: JSON.stringify({
            standard: {
              standard_framework_id: frameworkId,
              parent_id: parentId,
              code,
              description,
              grade_band: gradeBand,
            },
          }),
        });

        codeToId[code] = createdStandard.id;
        created += 1;
      } catch (requestError) {
        errors += 1;
        const message =
          requestError instanceof ApiError ? requestError.message : "Unknown API error";
        messages.push(`Line ${index + 1}: ${message}`);
      }

      setImportStatusByFramework((current) => ({
        ...current,
        [frameworkId]: {
          running: true,
          created,
          errors,
          messages: messages.slice(),
        },
      }));
    }

    setImportStatusByFramework((current) => ({
      ...current,
      [frameworkId]: {
        running: false,
        created,
        errors,
        messages,
      },
    }));

    await fetchFrameworkTree(frameworkId);
  }

  function renderTreeNode(node: StandardTreeNode, frameworkId: number, depth: number): ReactNode {
    const isEditing = editingStandardId === node.id;

    return (
      <div key={node.id} className={depth > 0 ? "ml-4 border-l border-gray-200 pl-3" : ""}>
        <div className="rounded border border-gray-200 bg-white p-2">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editingStandardDraft.code}
                onChange={(event) =>
                  setEditingStandardDraft((current) => ({ ...current, code: event.target.value }))
                }
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                placeholder="Code"
              />
              <textarea
                value={editingStandardDraft.description}
                onChange={(event) =>
                  setEditingStandardDraft((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                placeholder="Description"
                rows={2}
              />
              <input
                type="text"
                value={editingStandardDraft.grade_band}
                onChange={(event) =>
                  setEditingStandardDraft((current) => ({
                    ...current,
                    grade_band: event.target.value,
                  }))
                }
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                placeholder="Grade Band"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void saveStandardEdit(frameworkId, node.id)}
                  className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStandardId(null)}
                  className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-blue-700">{node.code}</p>
                <p className="text-sm text-gray-700">{node.description}</p>
                <p className="text-xs text-gray-500">Grade Band: {node.grade_band || "N/A"}</p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => beginStandardEdit(node)}
                  className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void deleteStandard(frameworkId, node.id)}
                  className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {(node.children || []).length > 0 && (
          <div className="mt-2 space-y-2">
            {node.children.map((child) => renderTreeNode(child, frameworkId, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRoles={ADMIN_ROLES}>
      <AppShell>
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Standards Management</h1>
              <p className="text-sm text-gray-600">
                Create frameworks, manage standards, and bulk import CSV rows.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateFramework((current) => !current)}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {showCreateFramework ? "Close" : "Add Framework"}
            </button>
          </header>

          {error && (
            <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {showCreateFramework && (
            <section className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-gray-900">Create Framework</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={createFrameworkDraft.name}
                  onChange={(event) =>
                    setCreateFrameworkDraft((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Name"
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={createFrameworkDraft.jurisdiction}
                  onChange={(event) =>
                    setCreateFrameworkDraft((current) => ({
                      ...current,
                      jurisdiction: event.target.value,
                    }))
                  }
                  placeholder="Jurisdiction"
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={createFrameworkDraft.subject}
                  onChange={(event) =>
                    setCreateFrameworkDraft((current) => ({
                      ...current,
                      subject: event.target.value,
                    }))
                  }
                  placeholder="Subject"
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={createFrameworkDraft.version}
                  onChange={(event) =>
                    setCreateFrameworkDraft((current) => ({
                      ...current,
                      version: event.target.value,
                    }))
                  }
                  placeholder="Version"
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => void createFramework()}
                  disabled={savingFramework}
                  className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingFramework ? "Saving..." : "Save Framework"}
                </button>
              </div>
            </section>
          )}

          {loading ? (
            <p className="text-sm text-gray-500">Loading frameworks...</p>
          ) : frameworks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              No standard frameworks found.
            </div>
          ) : (
            <section className="space-y-3">
              {frameworks.map((framework) => {
                const expanded = expandedFrameworkId === framework.id;
                const draft = standardDraftByFramework[framework.id] || newStandardDraft();
                const importStatus = importStatusByFramework[framework.id];
                const treeLoading = treeLoadingFrameworkIds.includes(framework.id);

                return (
                  <article
                    key={framework.id}
                    className="rounded-lg border border-gray-200 bg-white p-4"
                  >
                    {editingFrameworkId === framework.id ? (
                      <div className="space-y-3">
                        <h2 className="text-sm font-semibold text-gray-900">Edit Framework</h2>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <input
                            type="text"
                            value={editingFrameworkDraft.name}
                            onChange={(event) =>
                              setEditingFrameworkDraft((current) => ({
                                ...current,
                                name: event.target.value,
                              }))
                            }
                            placeholder="Name"
                            className="rounded border border-gray-300 px-3 py-2 text-sm"
                          />
                          <input
                            type="text"
                            value={editingFrameworkDraft.jurisdiction}
                            onChange={(event) =>
                              setEditingFrameworkDraft((current) => ({
                                ...current,
                                jurisdiction: event.target.value,
                              }))
                            }
                            placeholder="Jurisdiction"
                            className="rounded border border-gray-300 px-3 py-2 text-sm"
                          />
                          <input
                            type="text"
                            value={editingFrameworkDraft.subject}
                            onChange={(event) =>
                              setEditingFrameworkDraft((current) => ({
                                ...current,
                                subject: event.target.value,
                              }))
                            }
                            placeholder="Subject"
                            className="rounded border border-gray-300 px-3 py-2 text-sm"
                          />
                          <input
                            type="text"
                            value={editingFrameworkDraft.version}
                            onChange={(event) =>
                              setEditingFrameworkDraft((current) => ({
                                ...current,
                                version: event.target.value,
                              }))
                            }
                            placeholder="Version"
                            className="rounded border border-gray-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => void saveFrameworkEdit(framework.id)}
                            className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingFrameworkId(null)}
                            className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => toggleFramework(framework.id)}
                            className="text-left"
                          >
                            <h2 className="text-lg font-semibold text-gray-900">
                              {framework.name}
                            </h2>
                            <p className="text-sm text-gray-600">
                              {framework.jurisdiction || "No jurisdiction"} •{" "}
                              {framework.subject || "No subject"} •{" "}
                              {framework.version || "No version"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {standardCounts[framework.id] || 0} standards
                            </p>
                          </button>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => startFrameworkEdit(framework)}
                              className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteFramework(framework.id)}
                              className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {expanded && (
                          <div className="mt-4 space-y-4">
                            <section className="rounded border border-gray-200 bg-gray-50 p-3">
                              <h3 className="text-sm font-semibold text-gray-900">Add Standard</h3>
                              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                <input
                                  type="text"
                                  value={draft.code}
                                  onChange={(event) =>
                                    setStandardDraftByFramework((current) => ({
                                      ...current,
                                      [framework.id]: { ...draft, code: event.target.value },
                                    }))
                                  }
                                  placeholder="Code"
                                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                                />
                                <input
                                  type="text"
                                  value={draft.grade_band}
                                  onChange={(event) =>
                                    setStandardDraftByFramework((current) => ({
                                      ...current,
                                      [framework.id]: { ...draft, grade_band: event.target.value },
                                    }))
                                  }
                                  placeholder="Grade Band"
                                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                                />
                                <textarea
                                  value={draft.description}
                                  onChange={(event) =>
                                    setStandardDraftByFramework((current) => ({
                                      ...current,
                                      [framework.id]: {
                                        ...draft,
                                        description: event.target.value,
                                      },
                                    }))
                                  }
                                  placeholder="Description"
                                  rows={2}
                                  className="rounded border border-gray-300 px-2 py-1 text-sm sm:col-span-2"
                                />
                                <select
                                  value={draft.parent_id}
                                  onChange={(event) =>
                                    setStandardDraftByFramework((current) => ({
                                      ...current,
                                      [framework.id]: { ...draft, parent_id: event.target.value },
                                    }))
                                  }
                                  className="rounded border border-gray-300 px-2 py-1 text-sm sm:col-span-2"
                                >
                                  <option value="">No parent (root)</option>
                                  {parentOptions.map((option) => (
                                    <option key={option.id} value={option.id}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <button
                                type="button"
                                onClick={() => void createStandard(framework.id)}
                                className="mt-2 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
                              >
                                Add Standard
                              </button>
                            </section>

                            <section className="rounded border border-gray-200 bg-gray-50 p-3">
                              <h3 className="text-sm font-semibold text-gray-900">
                                Bulk Import (CSV)
                              </h3>
                              <p className="mt-1 text-xs text-gray-600">
                                Format: code,description,grade_band,parent_code
                              </p>
                              <textarea
                                value={bulkImportInputByFramework[framework.id] || ""}
                                onChange={(event) =>
                                  setBulkImportInputByFramework((current) => ({
                                    ...current,
                                    [framework.id]: event.target.value,
                                  }))
                                }
                                rows={5}
                                className="mt-2 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                                placeholder="CCSS.MATH.1,Add and subtract within 20,1-2,"
                              />
                              <button
                                type="button"
                                onClick={() => void runBulkImport(framework.id)}
                                disabled={Boolean(importStatus?.running)}
                                className="mt-2 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {importStatus?.running ? "Importing..." : "Run Import"}
                              </button>

                              {importStatus && (
                                <div className="mt-2 rounded border border-gray-200 bg-white p-2 text-xs text-gray-700">
                                  <p>
                                    Created:{" "}
                                    <span className="font-semibold text-green-700">
                                      {importStatus.created}
                                    </span>
                                  </p>
                                  <p>
                                    Errors:{" "}
                                    <span className="font-semibold text-red-700">
                                      {importStatus.errors}
                                    </span>
                                  </p>
                                  {importStatus.messages.length > 0 && (
                                    <ul className="mt-1 space-y-1 text-red-700">
                                      {importStatus.messages.slice(0, 10).map((message, index) => (
                                        <li key={`${framework.id}-import-msg-${index}`}>
                                          {message}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              )}
                            </section>

                            <section className="space-y-2">
                              <h3 className="text-sm font-semibold text-gray-900">
                                Standards Tree
                              </h3>
                              {treeLoading ? (
                                <p className="text-sm text-gray-500">Loading tree...</p>
                              ) : expandedFrameworkTree.length === 0 ? (
                                <p className="text-sm text-gray-500">
                                  No standards in this framework.
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {expandedFrameworkTree.map((node) =>
                                    renderTreeNode(node, framework.id, 0),
                                  )}
                                </div>
                              )}
                            </section>
                          </div>
                        )}
                      </>
                    )}
                  </article>
                );
              })}
            </section>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
