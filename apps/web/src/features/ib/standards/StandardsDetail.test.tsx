import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StandardsPacketDetail } from "@/features/ib/standards/StandardsPacketDetail";
import { StandardsCycleDetail } from "@/features/ib/standards/StandardsCycleDetail";
import {
  approveIbStandardsPacket,
  assignIbStandardsReviewer,
  exportIbStandardsPacket,
  returnIbStandardsPacket,
  useIbStandardsCycle,
  useIbStandardsExportPreview,
  useIbStandardsPacket,
  useIbStandardsPacketComparison,
} from "@/features/ib/data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/ib/standards-practices/packets/7",
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/ib/data", () => ({
  useIbStandardsPacket: vi.fn(),
  useIbStandardsPacketComparison: vi.fn(),
  useIbStandardsExportPreview: vi.fn(),
  approveIbStandardsPacket: vi.fn(async () => ({})),
  assignIbStandardsReviewer: vi.fn(async () => ({})),
  returnIbStandardsPacket: vi.fn(async () => ({})),
  exportIbStandardsPacket: vi.fn(async () => ({})),
  useIbStandardsCycle: vi.fn(),
}));

describe("IB standards detail routes", () => {
  const mutate = vi.fn(async () => undefined);

  beforeEach(() => {
    vi.mocked(useIbStandardsPacket).mockReturnValue({
      data: {
        id: 7,
        code: "A.1",
        title: "Leadership packet",
        reviewState: "in_review",
        reviewerId: null,
        evidenceStrength: "established",
        exportStatus: "ready",
        exportHistory: [
          { id: 3, status: "succeeded", artifactUrl: "/rails/active_storage/blobs/1" },
        ],
        scoreSummary: {
          completenessScore: 75,
          reviewedItemCount: 3,
          approvedItemCount: 1,
          totalItemCount: 4,
          evidenceStrength: "established",
        },
        items: [
          {
            id: 11,
            sourceType: "IbEvidenceItem",
            sourceId: 14,
            reviewState: "curated",
            summary: "Annotated evidence item",
            provenanceHref: "/ib/evidence/items/14",
          },
        ],
      },
      mutate,
    } as never);
    vi.mocked(useIbStandardsPacketComparison).mockReturnValue({
      data: { previous_packet: { title: "Prior cycle packet" } },
    } as never);
    vi.mocked(useIbStandardsExportPreview).mockReturnValue({
      data: { preview: { packet: { id: 7 } } },
    } as never);
    vi.mocked(useIbStandardsCycle).mockReturnValue({
      data: {
        id: 9,
        title: "2026 Self-study",
        status: "in_review",
        exportCount: 2,
        packets: [
          {
            id: 7,
            code: "A.1",
            title: "Leadership packet",
            reviewState: "approved",
            evidenceStrength: "strong",
            exportStatus: "exported",
            items: [],
            href: "/ib/standards-practices/packets/7",
          },
        ],
      },
    } as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders packet detail and fires workflow actions", async () => {
    render(<StandardsPacketDetail packetId="7" />);

    fireEvent.click(screen.getByRole("button", { name: "Export" }));
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    fireEvent.change(screen.getByPlaceholderText("Reviewer user id"), { target: { value: "42" } });
    fireEvent.click(screen.getByRole("button", { name: "Assign reviewer" }));
    fireEvent.change(screen.getByPlaceholderText("Return reason"), {
      target: { value: "Need stronger evidence." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Return with comments" }));

    await waitFor(() => {
      expect(exportIbStandardsPacket).toHaveBeenCalledWith(7);
      expect(approveIbStandardsPacket).toHaveBeenCalledWith(7);
      expect(assignIbStandardsReviewer).toHaveBeenCalledWith(7, "42");
      expect(returnIbStandardsPacket).toHaveBeenCalledWith(7, "Need stronger evidence.");
    });

    expect(screen.getByText("Prior cycle packet")).toBeInTheDocument();
    expect(screen.getByText("Open source")).toBeInTheDocument();
  });

  it("renders cycle detail with canonical packet links", () => {
    render(<StandardsCycleDetail cycleId="9" />);

    expect(screen.getAllByText("2026 Self-study").length).toBeGreaterThan(0);
    expect(screen.getByText(/Leadership packet/)).toBeInTheDocument();
    expect(screen.getByText("Open packet")).toBeInTheDocument();
  });
});
