import Link from "next/link";
import { CommentThread } from "@k12/ui";

const COMMENTS = [
  {
    id: "hub-1",
    author: "Amina Coordinator",
    body: "Link the specialist contribution directly to the PYP weekly flow so it is visible in the unit studio.",
    timestamp: "7m ago",
  },
  {
    id: "hub-2",
    author: "Luis Specialist",
    body: "Added the museum visit evidence bundle and aligned it to the Grade 4 inquiry sequence.",
    timestamp: "22m ago",
  },
];

export function CollaborationHub() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <Link
          href="/ib/pyp/units/new"
          className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Linked object
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950">PYP weekly flow</h3>
          <p className="mt-2 text-sm text-slate-600">
            Specialist contributions and family sharing notes now live with the unit rather than in
            detached messages.
          </p>
        </Link>

        <Link
          href="/ib/continuum"
          className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Linked object
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950">Continuum progression</h3>
          <p className="mt-2 text-sm text-slate-600">
            Cross-programme articulation stays anchored to shared concepts and evidence density
            signals.
          </p>
        </Link>
      </div>

      <CommentThread comments={COMMENTS} />
    </div>
  );
}
