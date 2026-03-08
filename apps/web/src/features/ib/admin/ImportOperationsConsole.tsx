"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, useToast } from "@k12/ui";
import {
  createIbImportBatch,
  dryRunIbImportBatch,
  executeIbImportBatch,
  rollbackIbImportBatch,
  updateIbImportBatch,
  useIbImportBatches,
} from "@/features/ib/admin/api";
import { reportIbAdminEvent } from "@/features/ib/admin/analytics";
import { WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";
import { enqueueMutation } from "@/lib/offlineMutationQueue";

type SourceKind = "pyp_poi" | "curriculum_document" | "operational_record" | "staff_role";
type SourceFormat = "csv" | "xlsx";

interface MappingDraft {
  programme: string;
  planningContextName: string;
  documentType: string;
  schemaKey: string;
  routeHint: string;
}

function defaultMappingDraft(): MappingDraft {
  return {
    programme: "Mixed",
    planningContextName: "",
    documentType: "",
    schemaKey: "",
    routeHint: "",
  };
}

function isNetworkError(error: unknown): boolean {
  return error instanceof Error && /network|failed to fetch|offline/i.test(error.message);
}

async function readSourceFile(file: File): Promise<{ payload: string; format: SourceFormat }> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "xlsx") {
    const buffer = await file.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buffer);
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return { payload: btoa(binary), format: "xlsx" };
  }

  return { payload: await file.text(), format: "csv" };
}

export function ImportOperationsConsole() {
  const { addToast } = useToast();
  const { data: batches = [], mutate } = useIbImportBatches();
  const [sourceKind, setSourceKind] = useState<SourceKind>("curriculum_document");
  const [sourceFormat, setSourceFormat] = useState<SourceFormat>("csv");
  const [sourceFilename, setSourceFilename] = useState("ib-import.csv");
  const [rawPayload, setRawPayload] = useState("");
  const [mappingDraft, setMappingDraft] = useState<MappingDraft>(defaultMappingDraft());
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedBatchId && batches[0]?.id) {
      setSelectedBatchId(batches[0].id);
    }
  }, [batches, selectedBatchId]);

  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.id === selectedBatchId) || batches[0] || null,
    [batches, selectedBatchId],
  );

  useEffect(() => {
    if (!selectedBatch) return;
    setMappingDraft({
      programme: String(
        selectedBatch.mappingPayload.programme || selectedBatch.programme || "Mixed",
      ),
      planningContextName: String(selectedBatch.mappingPayload.planning_context_name || ""),
      documentType: String(selectedBatch.mappingPayload.document_type || ""),
      schemaKey: String(selectedBatch.mappingPayload.schema_key || ""),
      routeHint: String(selectedBatch.mappingPayload.route_hint || ""),
    });
  }, [selectedBatch]);

  async function createBatch() {
    setBusyAction("create");
    const payload = {
      programme: mappingDraft.programme,
      source_kind: sourceKind,
      source_format: sourceFormat,
      source_filename: sourceFilename,
      raw_payload: rawPayload,
      mapping_payload: {
        programme: mappingDraft.programme,
        planning_context_name: mappingDraft.planningContextName,
        document_type: mappingDraft.documentType,
        schema_key: mappingDraft.schemaKey,
        route_hint: mappingDraft.routeHint,
      },
    };

    try {
      const batch = await createIbImportBatch(payload);
      reportIbAdminEvent("ib_import_batch_created", { sourceKind, sourceFormat });
      addToast("success", "Import batch staged.");
      setSelectedBatchId(batch.id);
      await mutate();
    } catch (error) {
      if (isNetworkError(error)) {
        enqueueMutation({
          url: "/api/v1/ib/import_batches",
          method: "POST",
          body: JSON.stringify({ ib_import_batch: payload }),
          revalidateKeys: ["/api/v1/ib/import_batches"],
        });
        addToast("success", "Network unavailable. Import staging has been queued for retry.");
      } else {
        addToast("error", error instanceof Error ? error.message : "Unable to stage import.");
      }
    } finally {
      setBusyAction(null);
    }
  }

  async function saveMapping() {
    if (!selectedBatch) return;

    const payload = {
      mapping_payload: {
        programme: mappingDraft.programme,
        planning_context_name: mappingDraft.planningContextName,
        document_type: mappingDraft.documentType,
        schema_key: mappingDraft.schemaKey,
        route_hint: mappingDraft.routeHint,
      },
    };

    setBusyAction("mapping");
    try {
      await updateIbImportBatch(selectedBatch.id, payload);
      reportIbAdminEvent("ib_import_mapping_saved", { batchId: selectedBatch.id });
      addToast("success", "Import mapping saved.");
      await mutate();
    } catch (error) {
      if (isNetworkError(error)) {
        enqueueMutation({
          url: `/api/v1/ib/import_batches/${selectedBatch.id}`,
          method: "PATCH",
          body: JSON.stringify({ ib_import_batch: payload }),
          revalidateKeys: ["/api/v1/ib/import_batches"],
        });
        addToast("success", "Network unavailable. Mapping update has been queued for retry.");
      } else {
        addToast("error", error instanceof Error ? error.message : "Unable to save mapping.");
      }
    } finally {
      setBusyAction(null);
    }
  }

  async function runBatchAction(
    action: "dry-run" | "execute" | "rollback",
    handler: (id: number) => Promise<unknown>,
  ) {
    if (!selectedBatch) return;
    setBusyAction(action);
    try {
      await handler(selectedBatch.id);
      reportIbAdminEvent(`ib_import_${action}`, { batchId: selectedBatch.id });
      addToast("success", `Import ${action} completed.`);
      await mutate();
    } catch (error) {
      addToast("error", error instanceof Error ? error.message : `Import ${action} failed.`);
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <WorkspacePanel
      title="Import operations"
      description="Stage spreadsheet imports, review row mapping, dry-run safely, and execute or roll back from the same operator surface."
    >
      <div className="space-y-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.95fr)]">
          <div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700">
                <span className="font-medium">Source kind</span>
                <select
                  aria-label="Source kind"
                  value={sourceKind}
                  onChange={(event) => setSourceKind(event.target.value as SourceKind)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                >
                  <option value="curriculum_document">Curriculum documents</option>
                  <option value="pyp_poi">PYP programme of inquiry</option>
                  <option value="operational_record">Operational records</option>
                  <option value="staff_role">Staff / role assignments</option>
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span className="font-medium">Programme</span>
                <select
                  aria-label="Import programme"
                  value={mappingDraft.programme}
                  onChange={(event) =>
                    setMappingDraft((current) => ({ ...current, programme: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                >
                  <option value="Mixed">Mixed</option>
                  <option value="PYP">PYP</option>
                  <option value="MYP">MYP</option>
                  <option value="DP">DP</option>
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
                <span className="font-medium">Source file</span>
                <input
                  aria-label="Import file"
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const next = await readSourceFile(file);
                    setSourceFilename(file.name);
                    setSourceFormat(next.format);
                    setRawPayload(next.payload);
                  }}
                  className="w-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span className="font-medium">Planning context name</span>
                <input
                  value={mappingDraft.planningContextName}
                  onChange={(event) =>
                    setMappingDraft((current) => ({
                      ...current,
                      planningContextName: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span className="font-medium">Document type</span>
                <input
                  value={mappingDraft.documentType}
                  onChange={(event) =>
                    setMappingDraft((current) => ({ ...current, documentType: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span className="font-medium">Schema key</span>
                <input
                  value={mappingDraft.schemaKey}
                  onChange={(event) =>
                    setMappingDraft((current) => ({ ...current, schemaKey: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span className="font-medium">Route hint</span>
                <input
                  value={mappingDraft.routeHint}
                  onChange={(event) =>
                    setMappingDraft((current) => ({ ...current, routeHint: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
                <span className="font-medium">Source payload</span>
                <textarea
                  aria-label="Source payload"
                  value={rawPayload}
                  onChange={(event) => setRawPayload(event.target.value)}
                  rows={9}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-mono text-xs"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => void createBatch()}
                disabled={busyAction === "create" || rawPayload.length === 0}
              >
                {busyAction === "create" ? "Staging..." : "Stage import"}
              </Button>
              {selectedBatch ? (
                <Button
                  variant="secondary"
                  onClick={() => void saveMapping()}
                  disabled={busyAction === "mapping"}
                >
                  {busyAction === "mapping" ? "Saving..." : "Save mapping"}
                </Button>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
              <h3 className="text-lg font-semibold text-slate-950">Staged batches</h3>
              <div className="mt-3 space-y-3">
                {batches.length === 0 ? (
                  <p className="text-sm text-slate-600">No import batches are staged yet.</p>
                ) : (
                  batches.map((batch) => (
                    <button
                      key={batch.id}
                      type="button"
                      onClick={() => setSelectedBatchId(batch.id)}
                      className={`w-full rounded-[1.25rem] border px-4 py-3 text-left ${
                        selectedBatch?.id === batch.id
                          ? "border-slate-900 bg-slate-950 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-950"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{batch.sourceFilename}</p>
                          <p
                            className={`mt-1 text-xs ${selectedBatch?.id === batch.id ? "text-slate-300" : "text-slate-500"}`}
                          >
                            {batch.sourceKind} · {batch.programme}
                          </p>
                        </div>
                        <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold">
                          {batch.status}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {selectedBatch ? (
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Selected batch</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedBatch.rows.length} rows · {selectedBatch.parserWarnings.length}{" "}
                      parser warning(s)
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => void runBatchAction("dry-run", dryRunIbImportBatch)}
                      disabled={busyAction === "dry-run"}
                    >
                      {busyAction === "dry-run" ? "Running..." : "Dry run"}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => void runBatchAction("execute", executeIbImportBatch)}
                      disabled={busyAction === "execute" || selectedBatch.status === "blocked"}
                    >
                      {busyAction === "execute" ? "Executing..." : "Execute"}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => void runBatchAction("rollback", rollbackIbImportBatch)}
                      disabled={
                        busyAction === "rollback" ||
                        selectedBatch.executionSummary.created_count === undefined
                      }
                    >
                      {busyAction === "rollback" ? "Rolling back..." : "Rollback"}
                    </Button>
                  </div>
                </div>

                {selectedBatch.parserWarnings.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    {selectedBatch.parserWarnings.map((warning) => (
                      <p
                        key={warning}
                        className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                      >
                        {warning}
                      </p>
                    ))}
                  </div>
                ) : null}

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Dry run</p>
                    <p className="mt-2 text-sm text-slate-700">
                      Create {Number(selectedBatch.dryRunSummary.would_create || 0)} · Update{" "}
                      {Number(selectedBatch.dryRunSummary.would_update || 0)} · Blocked{" "}
                      {Number(selectedBatch.dryRunSummary.blocked || 0)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Execution</p>
                    <p className="mt-2 text-sm text-slate-700">
                      Created {Number(selectedBatch.executionSummary.created_count || 0)} · Updated{" "}
                      {Number(selectedBatch.executionSummary.updated_count || 0)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Rollback</p>
                    <p className="mt-2 text-sm text-slate-700">
                      Rolled back{" "}
                      {Array.isArray(selectedBatch.rollbackSummary.rolled_back_refs)
                        ? selectedBatch.rollbackSummary.rolled_back_refs.length
                        : 0}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Adapter</p>
                    <p className="mt-2 text-sm text-slate-700">
                      {selectedBatch.sourceSystem} · {selectedBatch.sourceContractVersion || "n/a"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {selectedBatch.importMode} import
                      {selectedBatch.coexistenceMode ? " with shadow mode" : ""}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Artifacts</p>
                    <p className="mt-2 text-sm text-slate-700">
                      {String(
                        (
                          selectedBatch.previewSummary.source_artifact_manifest as
                            | Record<string, unknown>
                            | undefined
                        )?.row_count || 0,
                      )}{" "}
                      rows discovered
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Resume cursor {String(selectedBatch.resumeCursor || 0)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Migration safeguards
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      Delta rerun:{" "}
                      {String(selectedBatch.rollbackCapabilities.delta_rerun_supported || false)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Shadow mode:{" "}
                      {String(selectedBatch.rollbackCapabilities.shadow_mode_supported || false)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 max-h-[24rem] overflow-auto rounded-[1.25rem] border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Row</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Target</th>
                        <th className="px-4 py-3">Warnings / Errors</th>
                        <th className="px-4 py-3">Risk / Resolution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {selectedBatch.rows.slice(0, 25).map((row) => (
                        <tr key={row.id}>
                          <td className="px-4 py-3 align-top">
                            <p className="font-medium text-slate-950">{row.sourceIdentifier}</p>
                            <p className="text-xs text-slate-500">{row.sheetName || "source"}</p>
                          </td>
                          <td className="px-4 py-3 align-top text-slate-700">{row.status}</td>
                          <td className="px-4 py-3 align-top text-slate-700">
                            {row.targetEntityRef || "Pending resolution"}
                          </td>
                          <td className="px-4 py-3 align-top text-slate-700">
                            {[...row.warnings, ...row.errors].length > 0
                              ? [...row.warnings, ...row.errors].join(" · ")
                              : "No issues"}
                          </td>
                          <td className="px-4 py-3 align-top text-slate-700">
                            {row.dataLossRisk || "low"} ·{" "}
                            {Object.keys(row.resolutionPayload).length > 0
                              ? JSON.stringify(row.resolutionPayload)
                              : "No override"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </WorkspacePanel>
  );
}
