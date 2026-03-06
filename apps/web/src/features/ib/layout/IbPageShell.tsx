"use client";

import type { ReactNode } from "react";
import { IbPageLoading } from "@/features/ib/layout/IbPageStates";
import {
  IbWorkspaceScaffold,
  type WorkspaceMetric,
} from "@/features/ib/shared/IbWorkspaceScaffold";

interface IbPageShellProps {
  title: string;
  description: string;
  actions?: ReactNode;
  badges?: ReactNode;
  filters?: ReactNode;
  metrics?: WorkspaceMetric[];
  aside?: ReactNode;
  timeline?: Parameters<typeof IbWorkspaceScaffold>[0]["timeline"];
  children: ReactNode;
}

export function IbPageShell({
  title,
  description,
  actions,
  badges,
  filters,
  metrics,
  aside,
  timeline,
  children,
}: IbPageShellProps) {
  return (
    <IbWorkspaceScaffold
      title={title}
      description={description}
      actions={actions}
      badges={badges}
      filters={filters}
      metrics={metrics}
      aside={aside}
      timeline={timeline}
      main={children}
    />
  );
}

export function IbDetailPageShell(props: IbPageShellProps) {
  return <IbPageShell {...props} />;
}

export function IbQueuePageShell(props: IbPageShellProps) {
  return <IbPageShell {...props} />;
}

export function IbCoordinatorPageShell(props: IbPageShellProps) {
  return <IbPageShell {...props} />;
}

export { IbPageLoading };
