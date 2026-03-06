import { KanbanBoard } from "@k12/ui";
import type { IbStandardsPacket } from "@/features/ib/data";

export function StandardsAndPracticesBoard({ packets = [] }: { packets?: IbStandardsPacket[] }) {
  const columns = [
    {
      id: "ready",
      title: "Ready for review",
      cards: packets
        .filter((packet) => packet.reviewState === "approved" || packet.exportStatus === "ready")
        .map((packet) => ({
          id: String(packet.id),
          title: packet.title,
          meta: `Owner packet ${packet.code}`,
          body: `${packet.evidenceStrength} evidence • ${packet.exportStatus.replace(/_/g, " ")}`,
        })),
    },
    {
      id: "in-progress",
      title: "Needs linking",
      cards: packets
        .filter((packet) => packet.reviewState === "in_review")
        .map((packet) => ({
          id: String(packet.id),
          title: packet.title,
          meta: `Packet ${packet.code}`,
          body: `${packet.items.length} source link(s) currently attached.`,
        })),
    },
    {
      id: "gaps",
      title: "Gaps to close",
      cards: packets
        .filter((packet) => packet.reviewState === "draft" || packet.exportStatus === "not_ready")
        .map((packet) => ({
          id: String(packet.id),
          title: packet.title,
          meta: `Packet ${packet.code}`,
          body: `Still ${packet.exportStatus.replace(/_/g, " ")} with ${packet.items.length} source item(s).`,
        })),
    },
  ];

  return <KanbanBoard columns={columns} />;
}
