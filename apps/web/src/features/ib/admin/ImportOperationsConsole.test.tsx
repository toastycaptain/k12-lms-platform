import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ToastProvider } from "@k12/ui";
import { ImportOperationsConsole } from "@/features/ib/admin/ImportOperationsConsole";
import {
  dryRunIbImportBatch,
  updateIbImportBatch,
  useIbImportBatches,
} from "@/features/ib/admin/api";

vi.mock("@/features/ib/admin/analytics", () => ({
  reportIbAdminEvent: vi.fn(),
}));

vi.mock("@/lib/offlineMutationQueue", () => ({
  enqueueMutation: vi.fn(),
}));

vi.mock("@/features/ib/admin/api", () => ({
  useIbImportBatches: vi.fn(),
  createIbImportBatch: vi.fn(async () => ({})),
  updateIbImportBatch: vi.fn(async () => ({})),
  dryRunIbImportBatch: vi.fn(async () => ({})),
  executeIbImportBatch: vi.fn(async () => ({})),
  rollbackIbImportBatch: vi.fn(async () => ({})),
}));

describe("ImportOperationsConsole", () => {
  beforeEach(() => {
    vi.mocked(useIbImportBatches).mockReturnValue({
      data: [
        {
          id: 44,
          programme: "PYP",
          status: "mapped",
          sourceKind: "curriculum_document",
          sourceFormat: "csv",
          sourceSystem: "managebac",
          importMode: "draft",
          coexistenceMode: true,
          sourceFilename: "pyp-units.csv",
          sourceContractVersion: "managebac.v2",
          scopeMetadata: {},
          parserWarnings: ["Duplicate header title was renamed to title__2."],
          mappingPayload: {
            programme: "PYP",
            planning_context_name: "Grade 5 PYP",
            document_type: "ib_pyp_unit",
            schema_key: "ib.pyp.unit@v2",
            route_hint: "/ib/pyp/units/imported",
          },
          validationSummary: {},
          previewSummary: {
            source_artifact_manifest: {
              row_count: 1,
            },
          },
          dryRunSummary: {
            would_create: 2,
            would_update: 1,
            blocked: 0,
          },
          executionSummary: {
            created_count: 0,
            updated_count: 0,
          },
          rollbackSummary: {},
          rollbackCapabilities: {
            delta_rerun_supported: true,
            shadow_mode_supported: true,
          },
          recoveryPayload: {},
          resumeCursor: 0,
          lastEnqueuedJobId: null,
          rows: [
            {
              id: 1,
              rowIndex: 2,
              sheetName: "csv",
              sourceIdentifier: "csv:2",
              status: "ready",
              sourcePayload: {},
              normalizedPayload: {},
              mappingPayload: {},
              warnings: [],
              errors: [],
              conflictPayload: {},
              resolutionPayload: { strategy: "create_new_document" },
              executionPayload: {},
              targetEntityRef: "CurriculumDocument:77",
              entityKind: "curriculum_document",
              dataLossRisk: "low",
              duplicateCandidateRef: null,
              unsupportedFields: [],
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      mutate: vi.fn(async () => undefined),
    } as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("persists mapping changes for the selected batch", async () => {
    render(
      <ToastProvider>
        <ImportOperationsConsole />
      </ToastProvider>,
    );

    fireEvent.change(screen.getByDisplayValue("Grade 5 PYP"), {
      target: { value: "Grade 6 PYP" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save mapping" }));

    await waitFor(() => {
      expect(updateIbImportBatch).toHaveBeenCalledWith(
        44,
        expect.objectContaining({
          mapping_payload: expect.objectContaining({
            planning_context_name: "Grade 6 PYP",
          }),
        }),
      );
    });
  });

  it("runs a dry run for the selected batch", async () => {
    render(
      <ToastProvider>
        <ImportOperationsConsole />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Dry run" }));

    await waitFor(() => {
      expect(dryRunIbImportBatch).toHaveBeenCalledWith(44);
    });
  });

  it("renders phase 10 migration safeguards and adapter details", () => {
    render(
      <ToastProvider>
        <ImportOperationsConsole />
      </ToastProvider>,
    );

    expect(screen.getByText("managebac · managebac.v2")).toBeInTheDocument();
    expect(screen.getByText(/draft import with shadow mode/i)).toBeInTheDocument();
    expect(screen.getByText(/Delta rerun: true/i)).toBeInTheDocument();
    expect(screen.getByText(/low · {\"strategy\":\"create_new_document\"}/i)).toBeInTheDocument();
  });
});
