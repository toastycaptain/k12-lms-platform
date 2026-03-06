"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SegmentedControl } from "@k12/ui";
import {
  IbSurfaceState,
  IbTonePill,
  type IbSurfaceStatus,
} from "@/features/ib/core/IbSurfaceState";
import { useIbHomePayload } from "@/features/ib/home/useIbHomePayload";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

const STORAGE_KEY = "k12.ib.coordinator.home.filters";

type ProgrammeFilter = "Mixed" | "PYP" | "MYP" | "DP";
type StatusFilter = "all" | "healthy" | "watch" | "risk";

function readStoredFilters(): {
  programme: ProgrammeFilter;
  status: StatusFilter;
} {
  if (typeof window === "undefined") {
    return {
      programme: "Mixed",
      status: "all",
    };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {
      programme: "Mixed",
      status: "all",
    };
  }

  try {
    const parsed = JSON.parse(raw) as {
      programme?: ProgrammeFilter;
      status?: StatusFilter;
    };

    return {
      programme: parsed.programme ?? "Mixed",
      status: parsed.status ?? "all",
    };
  } catch {
    return {
      programme: "Mixed",
      status: "all",
    };
  }
}

export function CoordinatorOverview({ state = "ready" }: { state?: IbSurfaceStatus }) {
  const { data: payload } = useIbHomePayload();
  const [filters, setFilters] = useState(readStoredFilters);
  const { programme, status } = filters;
  const coordinatorCards = useMemo(
    () => payload?.coordinatorCards || [],
    [payload?.coordinatorCards],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  const filteredCards = useMemo(
    () =>
      coordinatorCards.filter((card) => {
        const programmeMatch = programme === "Mixed" ? true : card.programme === programme;
        const statusMatch = status === "all" ? true : card.status === status;
        return programmeMatch && statusMatch;
      }),
    [coordinatorCards, programme, status],
  );

  if (!payload) {
    return (
      <IbSurfaceState
        status="loading"
        ready={null}
        emptyTitle="Loading coordinator overview"
        emptyDescription="Fetching current IB exceptions."
      />
    );
  }

  const ready = (
    <IbWorkspaceScaffold
      title="Coordinator overview"
      description="Find the top exceptions first, then drill straight into the queues and workspaces that need support."
      badges={
        <>
          <IbTonePill label="Review-first" tone="accent" />
          <IbTonePill label={payload.schoolLabel} tone="default" />
        </>
      }
      filters={
        <div className="flex flex-wrap gap-4">
          <SegmentedControl
            label="Programme"
            value={programme}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                programme: value as ProgrammeFilter,
              }))
            }
            options={[
              { value: "Mixed", label: "Whole school" },
              { value: "PYP", label: "PYP" },
              { value: "MYP", label: "MYP" },
              { value: "DP", label: "DP" },
            ]}
          />
          <SegmentedControl
            label="Status"
            value={status}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                status: value as StatusFilter,
              }))
            }
            options={[
              { value: "all", label: "All" },
              { value: "risk", label: "Risk" },
              { value: "watch", label: "Watch" },
              { value: "healthy", label: "Healthy" },
            ]}
          />
        </div>
      }
      metrics={[
        {
          label: "Top issues visible",
          value: String(filteredCards.length),
          detail: "No giant home-table required",
          tone: "accent",
        },
        {
          label: "Approvals and review",
          value: String(
            payload.coordinatorCards.filter((card) => card.href.includes("/review")).length,
          ),
          detail: "Moderation, comments, and sign-off decisions",
          tone: "warm",
        },
        {
          label: "Family cadence",
          value: String(
            payload.coordinatorCards.filter((card) => card.href.includes("/families")).length,
          ),
          detail: "Calm digest rhythm is being protected",
          tone: "success",
        },
        {
          label: "Standards evidence",
          value: String(
            payload.coordinatorCards.filter((card) => card.href.includes("/standards-practices"))
              .length,
          ),
          detail: "Linked to live artifacts and exportable",
        },
      ]}
      main={
        <div className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-2">
            {filteredCards.map((card) => (
              <Link
                key={card.id}
                href={card.href}
                className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-950">{card.label}</p>
                    <p className="mt-2 text-sm text-slate-600">{card.detail}</p>
                  </div>
                  <IbTonePill
                    label={
                      card.status === "risk"
                        ? "Risk"
                        : card.status === "watch"
                          ? "Watch"
                          : "Healthy"
                    }
                    tone={card.tone}
                  />
                </div>
              </Link>
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <WorkspacePanel
              title="Operations center"
              description="Whole-school health, workload hotspots, and team support stay one click away."
            >
              <Link
                href="/ib/operations"
                className="text-sm font-semibold text-slate-900 underline-offset-4 hover:underline"
              >
                Open programme operations center
              </Link>
            </WorkspacePanel>
            <WorkspacePanel
              title="Review queue"
              description="Approvals and moderation remain action-linked, not trapped in summary-only widgets."
            >
              <Link
                href="/ib/review"
                className="text-sm font-semibold text-slate-900 underline-offset-4 hover:underline"
              >
                Open review workflow
              </Link>
            </WorkspacePanel>
            <WorkspacePanel
              title="Exception reports"
              description="Reports preserve filter context and drill into live work rather than dead-end charts."
            >
              <Link
                href="/ib/reports/exceptions"
                className="text-sm font-semibold text-slate-900 underline-offset-4 hover:underline"
              >
                Open exception reports
              </Link>
            </WorkspacePanel>
          </div>
        </div>
      }
      aside={
        <WorkspacePanel
          title="Home-level scope"
          description="This surface is intentionally terse so coordinators can identify the top three issues within seconds."
        >
          <ul className="space-y-3 text-sm text-slate-600">
            <li>Programme filters persist between visits.</li>
            <li>Only exception cards stay at the top.</li>
            <li>Every card opens a real route, queue, or report.</li>
          </ul>
        </WorkspacePanel>
      }
    />
  );

  return (
    <IbSurfaceState
      status={state}
      ready={ready}
      emptyTitle="Coordinator overview is clear"
      emptyDescription="No urgent exceptions are currently surfacing across the selected programme and status filters."
    />
  );
}
