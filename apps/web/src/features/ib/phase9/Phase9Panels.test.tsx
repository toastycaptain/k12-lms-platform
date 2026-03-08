import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ToastProvider } from "@k12/ui";
import {
  BenchmarkRefreshPanel,
  CollaborationOperationsPanel,
  MigrationConfidencePanel,
  MobileTrustPanel,
  PilotAdoptionPanel,
  ReplacementReadinessPanel,
  ReportingOperationsPanel,
  SearchOpsPanel,
  SemanticLayerPanel,
  TrustPolicyPanel,
} from "@/features/ib/phase9/Phase9Panels";
import {
  captureIbBenchmarkSnapshot,
  captureIbPilotBaseline,
  captureIbReplacementReadiness,
  saveIbCollaborationEvent,
  saveIbCollaborationTask,
  saveIbIntelligenceMetricDefinition,
  saveIbMigrationSession,
  saveIbPilotFeedbackItem,
  saveIbPilotProfile,
  saveIbReportCycle,
  saveIbReportTemplate,
  saveIbMobileSyncDiagnostic,
  useIbBenchmarkConsole,
  useIbCollaborationWorkbench,
  useIbIntelligenceSemanticLayer,
  useIbMigrationConsole,
  useIbMobileTrust,
  useIbPilotProgramme,
  useIbPilotSupport,
  useIbReplacementReadiness,
  useIbReportingOps,
  useIbSearchOps,
  useIbTrustConsole,
} from "@/features/ib/phase9/data";

vi.mock("@/features/ib/phase9/data", () => ({
  useIbPilotProgramme: vi.fn(),
  useIbPilotSupport: vi.fn(),
  useIbMigrationConsole: vi.fn(),
  useIbReplacementReadiness: vi.fn(),
  useIbReportingOps: vi.fn(),
  useIbCollaborationWorkbench: vi.fn(),
  useIbBenchmarkConsole: vi.fn(),
  useIbIntelligenceSemanticLayer: vi.fn(),
  useIbTrustConsole: vi.fn(),
  useIbMobileTrust: vi.fn(),
  useIbSearchOps: vi.fn(),
  saveIbPilotProfile: vi.fn(async () => ({})),
  captureIbPilotBaseline: vi.fn(async () => ({})),
  saveIbPilotFeedbackItem: vi.fn(async () => ({})),
  saveIbMigrationSession: vi.fn(async () => ({})),
  saveIbMigrationMappingTemplate: vi.fn(async () => ({})),
  captureIbReplacementReadiness: vi.fn(async () => ({})),
  saveIbReportCycle: vi.fn(async () => ({})),
  saveIbReportTemplate: vi.fn(async () => ({})),
  saveIbCollaborationTask: vi.fn(async () => ({})),
  saveIbCollaborationEvent: vi.fn(async () => ({})),
  captureIbBenchmarkSnapshot: vi.fn(async () => ({})),
  saveIbIntelligenceMetricDefinition: vi.fn(async () => ({})),
  saveIbMobileSyncDiagnostic: vi.fn(async () => ({})),
  saveIbSearchProfile: vi.fn(async () => ({})),
}));

describe("Phase9Panels", () => {
  function renderWithToast(ui: React.ReactNode) {
    return render(<ToastProvider>{ui}</ToastProvider>);
  }

  beforeEach(() => {
    vi.mocked(useIbPilotProgramme).mockReturnValue({
      data: {
        generatedAt: "2026-03-07T12:00:00Z",
        archetypes: [{ key: "continuum", label: "Continuum", detail: "Full continuum" }],
        metricDefinitions: [
          {
            key: "time_to_first_unit",
            label: "Time to first unit",
            role: "teacher",
            target: "<= 2 school days",
          },
        ],
        profiles: [
          {
            id: 1,
            name: "Phase 9 pilot",
            status: "active",
            cohortKey: "phase9",
            archetypeKey: "continuum",
            programmeScope: "Mixed",
            launchWindow: "Spring 2026",
            goLiveTargetOn: "2026-04-01",
            roleSuccessMetrics: {},
            baselineSummary: {},
            readinessSummary: {},
            rolloutBundle: {},
            baselineSnapshotCount: 1,
            lastCapturedAt: "2026-03-07T12:00:00Z",
            createdAt: "2026-03-07T12:00:00Z",
            updatedAt: "2026-03-07T12:00:00Z",
          },
        ],
      },
      mutate: vi.fn(async () => undefined),
    } as never);

    vi.mocked(useIbPilotSupport).mockReturnValue({
      data: {
        generatedAt: "2026-03-07T12:00:00Z",
        launchDay: [
          {
            key: "pilot_setup",
            label: "Pilot setup",
            count: 1,
            status: "active",
            href: "/ib/rollout",
          },
        ],
        reportingWeek: [
          {
            key: "cycles",
            label: "Active reporting cycles",
            count: 2,
            status: "active",
            href: "/ib/reports",
          },
        ],
        moderationWeek: [
          {
            key: "comments",
            label: "Open collaboration tasks",
            count: 1,
            status: "watch",
            href: "/ib/review",
          },
        ],
        feedbackQueue: [
          {
            id: 1,
            title: "Launch signal",
            detail: "Coordinator reviewed the updated dashboard.",
            status: "new",
            sentiment: "positive",
            category: "onboarding",
            roleScope: "coordinator",
            surface: "rollout_console",
            tags: ["pilot"],
            routingPayload: {},
            createdAt: "2026-03-07T12:00:00Z",
            updatedAt: "2026-03-07T12:00:00Z",
          },
        ],
      },
      mutate: vi.fn(async () => undefined),
    } as never);

    vi.mocked(useIbMigrationConsole).mockReturnValue({
      data: {
        generatedAt: "2026-03-07T12:00:00Z",
        lifecycle: [{ key: "discovered", label: "Discovered" }],
        sourceContracts: { toddle: { assumptions: ["Narrative-heavy export"] } },
        adapterProtocols: {
          toddle: {
            protocolVersion: "toddle.v2",
            connector: "toddle_export_adapter",
            supportedKinds: ["curriculum_document"],
            artifactDiscovery: ["units_export"],
            rolloutMode: "shadow_then_cutover",
            rollbackMode: "created_records_plus_manual_review_for_updates",
            resumable: true,
            shadowMode: true,
            deltaRerun: true,
          },
        },
        sharedImportManifest: { version: "phase10.v1" },
        templateGenerators: ["toddle_poi_template_generator"],
        sourceArtifactDiscovery: { toddle: { hints: ["Upload unit exports together."] } },
        inventorySummary: { ready_for_execute: 1 },
        confidenceSummary: { total_sessions: 1, cutover_ready: 0 },
        sessions: [
          {
            id: 1,
            sessionKey: "phase9-migration",
            sourceSystem: "toddle",
            status: "discovered",
            cutoverState: "discovered",
            sourceInventory: {},
            mappingSummary: {},
            dryRunSummary: {},
            reconciliationSummary: {},
            rollbackSummary: {},
            sourceContract: {},
            sourceManifest: {},
            shadowMode: {},
            deltaRerun: {},
            acceptanceSummary: {},
            createdAt: "2026-03-07T12:00:00Z",
            updatedAt: "2026-03-07T12:00:00Z",
          },
        ],
        mappingTemplates: [
          {
            id: 1,
            sourceSystem: "managebac",
            programme: "Mixed",
            name: "Phase 9 Template",
            status: "active",
            shared: true,
            fieldMappings: {},
            transformLibrary: {},
            roleMappingRules: {},
            manualOverridePanels: ["field_mapping"],
            updatedAt: "2026-03-07T12:00:00Z",
          },
        ],
      },
      mutate: vi.fn(async () => undefined),
    } as never);

    vi.mocked(useIbReplacementReadiness).mockReturnValue({
      data: {
        generatedAt: "2026-03-07T12:00:00Z",
        summary: {},
        pilotGoalChecks: [
          {
            key: "family_read_rate",
            label: "Family read rate",
            role: "guardian",
            target: ">= 70%",
            observed: "85%",
            status: "green",
          },
        ],
        tracks: [
          {
            key: "adoption",
            title: "Real-school adoption phase",
            status: "green",
            href: "/ib/rollout",
            detail: "Pilot profile is active.",
            followUp: "Track is currently green.",
          },
        ],
        gaps: [],
        nextStep: "pilot_scale_up",
        exportPayload: { pilot_profiles: 1 },
      },
      mutate: vi.fn(async () => undefined),
    } as never);

    vi.mocked(useIbReportingOps).mockReturnValue({
      data: {
        generatedAt: "2026-03-07T12:00:00Z",
        roleMatrix: { author: "Teachers draft" },
        lifecycle: ["open"],
        cycles: [
          {
            id: 1,
            programme: "Mixed",
            cycleKey: "phase9-cycle",
            status: "open",
            startsOn: "2026-03-07",
            endsOn: "2026-03-15",
            dueOn: "2026-03-13",
            deliveryWindow: {},
            localizationSettings: {},
            approvalSummary: {},
            metrics: {},
            reportCount: 4,
            updatedAt: "2026-03-07T12:00:00Z",
          },
        ],
        templates: [
          {
            id: 1,
            programme: "Mixed",
            audience: "guardian",
            family: "conference_packet",
            name: "Phase 9 Reporting Template",
            status: "draft",
            schemaVersion: "phase9.v1",
            sectionDefinitions: {},
            translationRules: {},
            updatedAt: "2026-03-07T12:00:00Z",
          },
        ],
        deliverySummary: { reports: 4, acknowledged: 2 },
      },
      mutate: vi.fn(async () => undefined),
    } as never);

    vi.mocked(useIbCollaborationWorkbench).mockReturnValue({
      data: {
        generatedAt: "2026-03-07T12:00:00Z",
        transportStrategy: {
          strategy: "heartbeat_plus_polling",
          detail: "Durable event storage with staged transport.",
          durableEvents: ["task", "mention"],
          ephemeralEvents: ["join"],
        },
        routeAudit: ["/ib/review"],
        sessionSummary: { active_now: 2 },
        eventSummary: { durable_count: 1 },
        taskSummary: { open_count: 1 },
        recentEvents: [
          {
            id: 1,
            eventName: "replay_event",
            routeId: "ib.review",
            scopeKey: "root",
            sectionKey: "summary",
            durable: true,
            payload: {},
            occurredAt: "2026-03-07T12:00:00Z",
            userLabel: "Alex Admin",
          },
        ],
        tasks: [
          {
            id: 1,
            curriculumDocumentId: 10,
            status: "open",
            priority: "high",
            title: "Phase 9 follow-up task",
            detail: "Review rollout guidance.",
            dueOn: "2026-03-10",
            sectionKey: "overview",
            mentionPayload: {},
            assignedToLabel: "Alex Admin",
            updatedAt: "2026-03-07T12:00:00Z",
          },
        ],
      },
      mutate: vi.fn(async () => undefined),
    } as never);

    vi.mocked(useIbBenchmarkConsole).mockReturnValue({
      data: {
        generatedAt: "2026-03-07T12:00:00Z",
        catalog: [{ key: "planning", role: "teacher", label: "Planning", clickBudget: 4 }],
        currentBenchmark: [
          {
            workflowKey: "planning",
            label: "Teacher planning",
            targetMs: 45000,
            observedMs: 38000,
            clickTarget: 3,
            observedClicks: 2,
            surface: "teacher_studio",
            status: "within_budget",
          },
        ],
        currentBudget: {
          generatedAt: "2026-03-07T12:00:00Z",
          budgets: [],
          regressions: [],
        },
        snapshots: [],
      },
      mutate: vi.fn(async () => undefined),
    } as never);

    vi.mocked(useIbIntelligenceSemanticLayer).mockReturnValue({
      data: {
        generatedAt: "2026-03-07T12:00:00Z",
        metricDictionary: [
          {
            id: 1,
            key: "programme_health",
            status: "active",
            metricFamily: "programme_health",
            label: "Programme health",
            definition: "Exception-weighted health score.",
            version: "phase9.v1",
            sourceOfTruth: { service: "programme_health" },
            thresholdConfig: { watch: 1, risk: 3 },
            updatedAt: "2026-03-07T12:00:00Z",
          },
        ],
        summary: { recommendation_count: 2 },
        sourceMap: { recommendation_count: "Ib::Operations::RecommendationService" },
      },
      mutate: vi.fn(async () => undefined),
    } as never);

    vi.mocked(useIbTrustConsole).mockReturnValue({
      data: {
        generatedAt: "2026-03-07T12:00:00Z",
        trustFramework: { digest_only: "Routine updates should batch into digest windows." },
        policies: [
          {
            id: 1,
            audience: "guardian",
            contentType: "story",
            status: "active",
            cadenceMode: "weekly_digest",
            deliveryMode: "digest",
            approvalMode: "teacher_reviewed",
            policyRules: {},
            privacyRules: {},
            localizationRules: {},
            updatedAt: "2026-03-07T12:00:00Z",
          },
        ],
        deliverySummary: { receipts_total: 4 },
      },
      mutate: vi.fn(async () => undefined),
    } as never);

    vi.mocked(useIbMobileTrust).mockReturnValue({
      data: {
        generatedAt: "2026-03-07T12:00:00Z",
        trustContract: [
          { key: "quick_contribution", label: "Quick contribution", desktopFirst: false },
        ],
        diagnostics: [],
        successCriteria: { offline_replay_success_rate: ">= 95%" },
      },
      mutate: vi.fn(async () => undefined),
    } as never);

    vi.mocked(useIbSearchOps).mockReturnValue({
      data: {
        generatedAt: "2026-03-07T12:00:00Z",
        resultGroups: ["document", "task"],
        entityInventory: { documents: 12 },
        profiles: [
          {
            id: 1,
            key: "large-school",
            status: "active",
            latencyBudgetMs: 800,
            facetConfig: {},
            rankingRules: {},
            scopeRules: {},
            updatedAt: "2026-03-07T12:00:00Z",
          },
        ],
        freshness: {
          indexStrategy: "database_scoped_search_v3",
          freshnessTargetMinutes: 5,
          latencyBudgetMs: 800,
          backpressureStrategy: "steady",
          rebuildControls: {},
          adoptionWindowDays: 14,
        },
        adoptionSummary: {
          searches_last_14_days: 42,
          zero_result_rate: 0.12,
          result_opens: 18,
          saved_searches: 3,
        },
        relevanceContract: {
          ranking_version: "phase10.v1",
          semantic_mode: "lexical_rank_plus_keyword_graph",
          synonym_count: 7,
        },
        savedLenses: [
          {
            id: 9,
            name: "DP deadlines",
            query: "programme:DP kind:operational_record risk",
            lensKey: "coordinator_lens",
            updatedAt: "2026-03-07T12:00:00Z",
          },
        ],
      },
      mutate: vi.fn(async () => undefined),
    } as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders rollout-facing phase 9 panels and executes actions", async () => {
    renderWithToast(
      <>
        <PilotAdoptionPanel />
        <MigrationConfidencePanel />
        <ReplacementReadinessPanel />
      </>,
    );

    expect(screen.getByText("Pilot adoption and support")).toBeInTheDocument();
    expect(screen.getByText("Migration moat and reconciliation")).toBeInTheDocument();
    expect(screen.getByText("Replacement-readiness audit")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add pilot cohort" }));

    await waitFor(() => {
      expect(saveIbPilotProfile).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Capture baseline" }));
    fireEvent.click(screen.getByRole("button", { name: "Create migration session" }));
    fireEvent.click(screen.getByRole("button", { name: "Refresh audit" }));

    await waitFor(() => {
      expect(captureIbPilotBaseline).toHaveBeenCalledWith(1);
      expect(saveIbMigrationSession).toHaveBeenCalled();
      expect(captureIbReplacementReadiness).toHaveBeenCalled();
    });
  });

  it("renders reporting, collaboration, intelligence, trust, mobile, and search panels", async () => {
    renderWithToast(
      <>
        <ReportingOperationsPanel />
        <CollaborationOperationsPanel curriculumDocumentId={10} />
        <BenchmarkRefreshPanel />
        <SemanticLayerPanel />
        <TrustPolicyPanel audience="guardian" />
        <MobileTrustPanel allowAction />
        <SearchOpsPanel />
      </>,
    );

    expect(screen.getByText("Reporting operations command center")).toBeInTheDocument();
    expect(screen.getByText("Collaboration workbench")).toBeInTheDocument();
    expect(screen.getByText("Decision-support semantic layer")).toBeInTheDocument();
    expect(screen.getByText("Search operations")).toBeInTheDocument();
    expect(screen.getByText("database_scoped_search_v3")).toBeInTheDocument();
    expect(screen.getByText("DP deadlines")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add report cycle" }));
    fireEvent.click(screen.getByRole("button", { name: "Create follow-up" }));
    fireEvent.click(screen.getByRole("button", { name: "Capture snapshot" }));
    fireEvent.click(screen.getByRole("button", { name: "Add governance metric" }));
    fireEvent.click(screen.getByRole("button", { name: "Log mobile health" }));

    await waitFor(() => {
      expect(saveIbReportCycle).toHaveBeenCalled();
      expect(saveIbCollaborationTask).toHaveBeenCalled();
      expect(captureIbBenchmarkSnapshot).toHaveBeenCalled();
      expect(saveIbIntelligenceMetricDefinition).toHaveBeenCalled();
      expect(saveIbMobileSyncDiagnostic).toHaveBeenCalled();
    });
  });

  it("supports reporting templates, collaboration events, support feedback, and compact search ops", async () => {
    renderWithToast(
      <>
        <PilotAdoptionPanel />
        <ReportingOperationsPanel />
        <CollaborationOperationsPanel />
        <SearchOpsPanel compact />
      </>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Log support signal" }));
    fireEvent.click(screen.getByRole("button", { name: "Add template" }));
    fireEvent.click(screen.getByRole("button", { name: "Record replay event" }));

    await waitFor(() => {
      expect(saveIbPilotFeedbackItem).toHaveBeenCalled();
      expect(saveIbReportTemplate).toHaveBeenCalled();
      expect(saveIbCollaborationEvent).toHaveBeenCalled();
    });

    expect(screen.getByText("Search operations")).toBeInTheDocument();
    expect(screen.getByText("large-school")).toBeInTheDocument();
  });
});
