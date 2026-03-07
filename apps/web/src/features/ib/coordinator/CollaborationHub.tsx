"use client";

import Link from "next/link";
import { CollaborationOperationsPanel } from "@/features/ib/phase9/Phase9Panels";

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

      <CollaborationOperationsPanel />
    </div>
  );
}
