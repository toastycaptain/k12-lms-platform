"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  FilterBar,
  MetricCard,
  SplitPane,
  StickyContextBar,
  type ActivityTimelineItem,
} from "@k12/ui";
import { UnifiedTimelinePanel } from "@/features/curriculum/timeline/UnifiedTimelinePanel";
import { IbContextRail } from "@/features/ib/layout/IbContextRail";
import { MobileActionDock, type MobileActionDockItem } from "@/features/ib/mobile/MobileActionDock";
import { MobileCompactShell } from "@/features/ib/mobile/MobileCompactShell";
import { useMobilePreference } from "@/features/ib/mobile/useMobilePreference";
import { resolveIbRoute } from "@/features/ib/routes/registry";
import { reportInteractionMetric } from "@/lib/performance";

export interface WorkspaceMetric {
  label: string;
  value: string;
  detail?: string;
  tone?: "default" | "accent" | "warm" | "success" | "risk";
}

export function WorkspacePanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

interface IbWorkspaceScaffoldProps {
  title: string;
  description: string;
  badges?: ReactNode;
  actions?: ReactNode;
  filters?: ReactNode;
  metrics?: WorkspaceMetric[];
  main: ReactNode;
  aside?: ReactNode;
  timeline?: ActivityTimelineItem[];
  mobileSummary?: string;
  mobileActions?: MobileActionDockItem[];
  mobilePreferenceKey?: string;
}

function actionableLabel(element: HTMLElement): string | undefined {
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) {
    return ariaLabel;
  }

  const text = element.textContent?.replace(/\s+/g, " ").trim();
  return text ? text.slice(0, 96) : undefined;
}

export function IbWorkspaceScaffold({
  title,
  description,
  badges,
  actions,
  filters,
  metrics = [],
  main,
  aside,
  timeline = [],
  mobileSummary,
  mobileActions = [],
  mobilePreferenceKey = `ib.mobile.low_bandwidth.${title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
}: IbWorkspaceScaffoldProps) {
  const pathname = usePathname();
  const mountedAtRef = useRef<number | null>(null);
  const clickDepthRef = useRef(0);
  const firstInteractionTrackedRef = useRef(false);
  const lowBandwidth = useMobilePreference(mobilePreferenceKey, false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof performance === "undefined") {
      return undefined;
    }

    const mountedAt = performance.now();
    mountedAtRef.current = mountedAt;
    clickDepthRef.current = 0;
    firstInteractionTrackedRef.current = false;

    const frameId = window.requestAnimationFrame(() => {
      reportInteractionMetric("ib_workspace_render", performance.now() - mountedAt, {
        workspace: title,
      });

      const resolved = resolveIbRoute(pathname);
      reportInteractionMetric("ib_route_view", 1, {
        workspace: title,
        routeId: resolved?.route.id,
        href: resolved?.canonicalHref || pathname,
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [pathname, title]);

  function handleClickCapture(event: React.MouseEvent<HTMLDivElement>) {
    if (typeof performance === "undefined") {
      return;
    }

    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const actionable = target.closest("a,button,[role='button'],[role='link']");
    if (!(actionable instanceof HTMLElement)) {
      return;
    }

    const now = performance.now();
    const label = actionableLabel(actionable);

    if (!firstInteractionTrackedRef.current && mountedAtRef.current !== null) {
      firstInteractionTrackedRef.current = true;
      reportInteractionMetric("ib_workspace_first_interaction", now - mountedAtRef.current, {
        workspace: title,
        target: label,
      });
    }

    clickDepthRef.current += 1;
    reportInteractionMetric("ib_workspace_click_depth", clickDepthRef.current, {
      workspace: title,
      target: label,
    });
  }

  const visibleMetrics = lowBandwidth.value ? metrics.slice(0, 2) : metrics;

  const asideContent =
    !lowBandwidth.value && (aside || timeline.length > 0) ? (
      <div className="space-y-4">
        {aside}
        {timeline.length > 0 ? (
          <UnifiedTimelinePanel title="Unified Timeline" items={timeline} />
        ) : null}
      </div>
    ) : null;

  return (
    <div
      className={`space-y-5 ${mobileActions.length > 0 ? "pb-36 md:pb-0" : ""}`}
      onClickCapture={handleClickCapture}
    >
      <MobileCompactShell
        title={title}
        description={description}
        badges={badges}
        summary={mobileSummary}
        lowBandwidth={lowBandwidth.value}
        onToggleLowBandwidth={lowBandwidth.toggle}
      />
      <div className="hidden md:block">
        <IbContextRail />
      </div>
      <div className="hidden md:block">
        <StickyContextBar
          title={title}
          description={description}
          actions={actions}
          badges={badges}
        />
      </div>
      {filters ? <FilterBar controls={filters} /> : null}
      {visibleMetrics.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {visibleMetrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              detail={metric.detail}
              tone={metric.tone}
            />
          ))}
        </div>
      ) : null}
      {asideContent ? <SplitPane primary={main} secondary={asideContent} /> : main}
      <MobileActionDock items={mobileActions} title={`${title} actions`} />
    </div>
  );
}
