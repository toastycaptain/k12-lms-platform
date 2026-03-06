"use client";

import { Fragment, useMemo, useState } from "react";
import { Drawer } from "@k12/ui";
import { useIbPoiPayload, type IbPoiEntry } from "@/features/ib/data";
import { IbSurfaceState } from "@/features/ib/core/IbSurfaceState";
import {
  IbWorkspaceScaffold,
  type WorkspaceMetric,
} from "@/features/ib/shared/IbWorkspaceScaffold";

function metricTone(index: number): WorkspaceMetric["tone"] {
  if (index === 0) return "accent";
  if (index === 1) return "success";
  return "warm";
}

export function ProgrammeOfInquiryUnitCard({
  unit,
  onOpen,
}: {
  unit: IbPoiEntry | null;
  onOpen: (unit: IbPoiEntry) => void;
}) {
  if (!unit) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 p-3 text-sm text-slate-400">
        No mapped unit
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(unit)}
      className="w-full rounded-3xl border border-slate-200 bg-white p-3 text-left shadow-sm hover:bg-slate-50"
    >
      <p className="text-sm font-semibold text-slate-900">{unit.title}</p>
      <p className="mt-2 text-xs text-slate-500">{unit.centralIdea || "Central idea not set"}</p>
    </button>
  );
}

export function ProgrammeOfInquiryGrid({
  units,
  themes,
  years,
  onOpen,
}: {
  units: IbPoiEntry[];
  themes: string[];
  years: string[];
  onOpen: (unit: IbPoiEntry) => void;
}) {
  return (
    <div className="overflow-auto rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <div className="grid min-w-[72rem] grid-cols-[12rem_repeat(6,minmax(10rem,1fr))]">
        <div className="border-b border-r border-slate-200 bg-slate-50 p-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Year
        </div>
        {themes.map((theme) => (
          <div
            key={theme}
            className="border-b border-r border-slate-200 bg-slate-50 p-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 last:border-r-0"
          >
            {theme}
          </div>
        ))}

        {years.map((year) => (
          <Fragment key={year}>
            <div className="border-r border-t border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-900">
              {year}
            </div>
            {themes.map((theme) => {
              const unit =
                units.find((item) => item.yearLevel === year && item.theme === theme) ?? null;
              return (
                <div
                  key={`${year}-${theme}`}
                  className="border-r border-t border-slate-200 p-3 last:border-r-0"
                >
                  <ProgrammeOfInquiryUnitCard unit={unit} onOpen={onOpen} />
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

export function ProgrammeOfInquiryDrawer({
  unit,
  open,
  onClose,
}: {
  unit: IbPoiEntry | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!unit) {
    return null;
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={unit.title}
      description={`${unit.yearLevel} • ${unit.theme}`}
    >
      <div className="space-y-5">
        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Central idea
          </p>
          <p className="mt-2 text-sm text-slate-700">
            {unit.centralIdea || "No central idea yet."}
          </p>
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Review state
          </p>
          <p className="mt-2 text-sm text-slate-700">{unit.reviewState}</p>
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Coherence signal
          </p>
          <p className="mt-2 text-sm text-slate-700">{unit.coherenceSignal}</p>
        </section>
      </div>
    </Drawer>
  );
}

export function ProgrammeOfInquiryFilters() {
  return (
    <>
      <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700">
        Compare years
      </span>
      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
        Specialist overlay
      </span>
      <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-900">
        Coherence signals
      </span>
    </>
  );
}

export function ProgrammeOfInquiryBoard() {
  const { data } = useIbPoiPayload();
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);

  const selectedUnit = useMemo(
    () => data?.board?.entries.find((item) => item.id === selectedUnitId) ?? null,
    [data?.board?.entries, selectedUnitId],
  );

  if (!data) {
    return <IbSurfaceState status="loading" ready={null} />;
  }

  const years =
    data.years.length > 0
      ? data.years
      : Array.from(new Set(data.board?.entries.map((item) => item.yearLevel) || []));
  const themes =
    data.themes.length > 0
      ? data.themes
      : Array.from(new Set(data.board?.entries.map((item) => item.theme) || []));
  const metrics: WorkspaceMetric[] = data.summaryMetrics.map((metric, index) => ({
    label: metric.label,
    value: metric.value,
    detail: index === 0 ? "Current mapped entries" : "Live governance signal",
    tone: metricTone(index),
  }));

  return (
    <>
      <IbWorkspaceScaffold
        title="Programme of inquiry"
        description="Live PYP coherence mapping with drilldown into the underlying units and signals."
        badges={<ProgrammeOfInquiryFilters />}
        metrics={metrics}
        main={
          <ProgrammeOfInquiryGrid
            units={data.board?.entries || []}
            themes={themes}
            years={years}
            onOpen={(unit) => setSelectedUnitId(unit.id)}
          />
        }
      />
      <ProgrammeOfInquiryDrawer
        unit={selectedUnit}
        open={Boolean(selectedUnit)}
        onClose={() => setSelectedUnitId(null)}
      />
    </>
  );
}
