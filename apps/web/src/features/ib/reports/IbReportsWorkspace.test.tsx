import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ToastProvider } from "@k12/ui";
import { IbReportsWorkspace } from "@/features/ib/reports/IbReportsWorkspace";

const mutateReportsMock = vi.fn(async () => undefined);
const createIbReportMock = vi.fn(async (payload: Record<string, unknown>) => {
  void payload;
  return {};
});
const updateIbReportMock = vi.fn(async (id: number, payload: Record<string, unknown>) => {
  void id;
  void payload;
  return {};
});

vi.mock("@/features/ib/data", () => ({
  useIbReports: vi.fn(() => ({
    data: [
      {
        id: 7,
        programme: "PYP",
        reportFamily: "conference_packet",
        audience: "guardian",
        status: "signed_off",
        title: "Spring conference packet",
        summary: "Live conference packet for the current cycle.",
        sourceRefs: ["IbEvidenceItem:1"],
        proofingSummary: {
          missing_sections: 1,
          overlong_items: 0,
          preflight_warnings: ["Translation fallback will be visible until review completes."],
          translation_review_required: true,
        },
        releasedAt: null,
        lastRenderedAt: "2026-03-07T12:00:00Z",
        reportContract: { version: "phase10.v1" },
        localization: {
          default_locale: "en",
          available_locales: ["en", "es", "fr"],
          fallback_locales: ["en"],
        },
        releaseWorkflow: {
          status: "signed_off",
          ready_for_release: true,
          acknowledgements_pending: true,
        },
        archiveEntry: {
          archive_key: "pyp/conference_packet/7/guardian/en",
          retained_versions: 3,
          artifact_count: 5,
          storage_backend: "active_storage",
        },
        analytics: {
          delivered_count: 4,
          read_count: 2,
          open_rate: 50,
        },
        viewerPermissions: {
          guardian_visible: true,
          student_visible: false,
          archive_visible: true,
        },
        conferencePacket: {
          family_view_enabled: true,
          student_led_prompts: ["What growth feels strongest right now?"],
        },
        currentVersion: {
          id: 70,
          versionNumber: 3,
          status: "signed_off",
          templateKey: "ib.reporting.conference_packet.guardian.v1",
          contentPayload: {
            sections: [
              {
                title: "Progress highlights",
                items: [
                  { title: "Water systems", detail: "Students connected evidence to action." },
                ],
              },
            ],
          },
          renderPayload: {
            web_viewer: { route: "/ib/reports#report-7" },
            artifact_bundle: { pdf_url: "/artifacts/reports/7/versions/3.pdf" },
          },
          proofingSummary: {},
        },
        versions: [],
        deliveries: [
          {
            id: 71,
            audienceRole: "guardian",
            channel: "web",
            locale: "en",
            status: "delivered",
            deliveredAt: "2026-03-07T12:00:00Z",
            readAt: null,
            acknowledgedAt: null,
            artifactUrl: "/ib/reports#report-7",
            archiveKey: "pyp/conference_packet/7/guardian/en",
            feedbackWindow: "7 days",
            analytics: { acknowledged: false },
            proofingState: {},
          },
        ],
      },
    ],
    mutate: mutateReportsMock,
  })),
  createIbReport: (payload: Record<string, unknown>) => createIbReportMock(payload),
  updateIbReport: (id: number, payload: Record<string, unknown>) => updateIbReportMock(id, payload),
}));

vi.mock("@/features/ib/phase9/data", () => ({
  useIbReportingOps: vi.fn(() => ({
    data: {
      generatedAt: "2026-03-07T12:00:00Z",
      roleMatrix: { author: "Teachers draft" },
      lifecycle: ["draft", "open"],
      canonicalContract: {
        version: "phase10.v1",
        families: ["conference_packet", "pyp_narrative"],
        renderTargets: ["web_view", "print_layout", "pdf_artifact"],
        archivePolicy: "versioned_per_release",
        translationPolicy: "fallback_with_human_review",
      },
      cycles: [],
      templates: [],
      deliverySummary: { reports: 1 },
      proofingQueue: [
        {
          id: 7,
          title: "Spring conference packet",
          status: "signed_off",
          missingSections: 1,
          overlongItems: 0,
          warnings: [],
          href: "/ib/reports#report-7",
        },
      ],
      localizationPipeline: [
        {
          templateId: 1,
          name: "Guardian conference template",
          audience: "guardian",
          defaultLocale: "en",
          requiredLocales: ["en", "es", "fr"],
          fallbackLocales: ["en"],
          humanReviewRequired: true,
        },
      ],
      archiveSummary: { retained_reports: 4 },
      releaseGates: { awaiting_release: 1, localization_review: 1, awaiting_acknowledgement: 2 },
      analyticsSummary: { delivered: 4, read: 2, open_rate: 50 },
    },
  })),
}));

vi.mock("@/features/ib/phase9/Phase9Panels", () => ({
  ReportingOperationsPanel: () => <div>Reporting operations panel</div>,
}));

vi.mock("@/features/ib/reports/ExceptionReportShell", () => ({
  ExceptionReportShell: () => <div>Exception report shell</div>,
}));

describe("IbReportsWorkspace", () => {
  function renderWithToast() {
    return render(
      <ToastProvider>
        <IbReportsWorkspace />
      </ToastProvider>,
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders phase 10 reporting contracts and workflow details", () => {
    renderWithToast();

    expect(screen.getAllByText("Spring conference packet").length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Translation fallback will be visible until review completes/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Archive key:/i)).toBeInTheDocument();
    expect(screen.getByText(/Guardian visible:/i)).toBeInTheDocument();
    expect(screen.getByText("Canonical reporting contract")).toBeInTheDocument();
    expect(screen.getByText(/Version: phase10.v1/i)).toBeInTheDocument();
    expect(screen.getByText(/web_view, print_layout, pdf_artifact/i)).toBeInTheDocument();
    expect(screen.getByText("AI review assist")).toBeInTheDocument();
    expect(screen.getByText("Reporting operations panel")).toBeInTheDocument();
    expect(screen.getByText("Exception report shell")).toBeInTheDocument();
  });

  it("runs generation and release actions against the canonical API", async () => {
    renderWithToast();

    fireEvent.click(screen.getByRole("button", { name: "Generate report" }));
    await waitFor(() => {
      expect(createIbReportMock).toHaveBeenCalledWith(
        expect.objectContaining({ report_family: "conference_packet", audience: "internal" }),
      );
      expect(mutateReportsMock).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Release" }));
    await waitFor(() => {
      expect(updateIbReportMock).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ action: "release", audience_role: "internal" }),
      );
    });
  });
});
