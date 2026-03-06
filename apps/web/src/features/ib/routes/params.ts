import {
  buildIbBreadcrumbs,
  type IbBreadcrumb,
  type IbRouteId,
} from "@/features/ib/routes/registry";

type ParamValue = string | string[] | undefined;

function firstParam(value: ParamValue): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return typeof value === "string" && value.length > 0 ? value : null;
}

export function parseDocumentRouteParams(
  params: Record<string, ParamValue>,
  key: "unitId" | "courseId",
) {
  return {
    id: firstParam(params[key]),
    valid: Boolean(firstParam(params[key])),
  };
}

export function parseOperationalRouteParams(
  params: Record<string, ParamValue>,
  key: "recordId" | "projectId" | "serviceEntryId" | "evidenceItemId" | "queueItemId" | "storyId",
) {
  return {
    id: firstParam(params[key]),
    valid: Boolean(firstParam(params[key])),
  };
}

export function parseStandardsRouteParams(
  params: Record<string, ParamValue>,
  key: "cycleId" | "packetId",
) {
  return {
    id: firstParam(params[key]),
    valid: Boolean(firstParam(params[key])),
  };
}

export function buildEntityBreadcrumbs(
  routeId: IbRouteId,
  params: Record<string, string>,
  currentLabel?: string | null,
): IbBreadcrumb[] {
  const breadcrumbs = buildIbBreadcrumbs(routeId, params);
  if (!currentLabel || breadcrumbs.length === 0) {
    return breadcrumbs;
  }

  return breadcrumbs.map((item, index) =>
    index === breadcrumbs.length - 1 ? { ...item, label: currentLabel } : item,
  );
}
