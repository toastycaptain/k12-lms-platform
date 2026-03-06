import Link from "next/link";
import { VirtualDataGrid } from "@k12/ui";
import { useIbStandardsCycles } from "@/features/ib/data";
import { IB_CANONICAL_ROUTES } from "@/features/ib/routes/registry";
import { IbSurfaceState } from "@/features/ib/core/IbSurfaceState";
import { StandardsAndPracticesBoard } from "@/features/ib/coordinator/StandardsAndPracticesBoard";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

export function StandardsPracticesEvidenceCenter() {
  const { data } = useIbStandardsCycles();
  const cycle = data?.[0];
  const packets = cycle?.packets || [];

  if (!data) {
    return <IbSurfaceState status="loading" ready={null} />;
  }

  return (
    <IbWorkspaceScaffold
      title="Standards and Practices evidence center"
      description="Authorization and evaluation evidence stays tied to live work instead of a separate compliance archive."
      metrics={[
        {
          label: "Cycles",
          value: String(data.length),
          detail: "Historical cycle continuity",
          tone: "accent",
        },
        {
          label: "Packets",
          value: String(packets.length),
          detail: "Live evidence packets in the active cycle",
          tone: "warm",
        },
        {
          label: "Ready sections",
          value: String(packets.filter((packet) => packet.exportStatus === "ready").length),
          detail: "Can export once reviewed",
          tone: "success",
        },
        {
          label: "Gaps",
          value: String(packets.filter((packet) => packet.exportStatus === "not_ready").length),
          detail: "Still need source links or review",
        },
      ]}
      main={
        <div className="space-y-5">
          <WorkspacePanel
            title="Evidence board"
            description="The board shows what is review-ready, what still needs linking, and where gaps remain."
          >
            <StandardsAndPracticesBoard packets={packets} />
          </WorkspacePanel>
          <WorkspacePanel
            title="Packet completeness"
            description="Each row opens the live standards packet workflow instead of a dead export screen."
          >
            <VirtualDataGrid
              columns={[
                { key: "section", header: "Section" },
                { key: "status", header: "Status" },
                {
                  key: "destination",
                  header: "Destination",
                  render: (row) => (
                    <Link
                      href={row.destination}
                      className="font-semibold text-slate-900 underline-offset-4 hover:underline"
                    >
                      Open route
                    </Link>
                  ),
                },
              ]}
              rows={packets.map((packet) => ({
                section: `${packet.code} • ${packet.title}`,
                status: `${packet.reviewState} • ${packet.exportStatus.replace(/_/g, " ")}`,
                destination: packet.href || IB_CANONICAL_ROUTES.standardsPacket(packet.id),
              }))}
            />
          </WorkspacePanel>
        </div>
      }
      aside={
        <div className="space-y-5">
          <WorkspacePanel
            title="Active cycle"
            description="Cycle detail is now a first-class route for comparisons and approvals."
          >
            {cycle ? (
              <Link
                href={IB_CANONICAL_ROUTES.standardsCycle(cycle.id)}
                className="font-semibold text-slate-900 underline-offset-4 hover:underline"
              >
                Open {cycle.title}
              </Link>
            ) : null}
          </WorkspacePanel>
          <WorkspacePanel
            title="Evidence rule"
            description="Packet-building should feel like collecting trustworthy links, not rewriting the same story into a second system."
          >
            <ul className="space-y-3 text-sm text-slate-600">
              <li>Link live curriculum artifacts whenever possible.</li>
              <li>Keep gaps explicit and route-linked.</li>
              <li>Do not export until missing evidence is resolved.</li>
            </ul>
          </WorkspacePanel>
        </div>
      }
    />
  );
}
