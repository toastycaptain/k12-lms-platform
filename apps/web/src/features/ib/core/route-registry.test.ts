import fs from "node:fs";
import path from "node:path";
import { IB_WORKSPACES } from "@/features/ib/shell/getIbWorkspaceConfig";
import {
  IB_ROUTE_DEFINITIONS,
  ibRouteAuditRows,
  buildIbBreadcrumbs,
  buildIbRoute,
  resolveIbRoute,
} from "@/features/ib/core/route-registry";

const APP_ROOT = path.resolve(process.cwd(), "src/app");

function routePatternToPage(pattern: string) {
  const relative = pattern.replace(/^\/ib/, "/ib").replace(/:([A-Za-z0-9_]+)/g, "[$1]");
  return path.join(APP_ROOT, `${relative}/page.tsx`);
}

describe("IB route registry", () => {
  it("resolves every registered workspace href", () => {
    Object.values(IB_WORKSPACES).forEach((workspace) => {
      expect(resolveIbRoute(workspace.href)).not.toBeNull();
    });
  });

  it("builds canonical dynamic routes and breadcrumbs", () => {
    const href = buildIbRoute("ib.pyp.unit.weekly-flow", { unitId: "unit-42" });
    const resolved = resolveIbRoute(href);

    expect(href).toBe("/ib/pyp/units/unit-42/weekly-flow");
    expect(resolved?.route.id).toBe("ib.pyp.unit.weekly-flow");
    expect(buildIbBreadcrumbs("ib.pyp.unit.weekly-flow", { unitId: "unit-42" })).toEqual([
      { label: "Planning", href: "/ib/planning" },
      { label: "Unit unit-42", href: "/ib/pyp/units/unit-42" },
      { label: "Weekly Flow", href: "/ib/pyp/units/unit-42/weekly-flow" },
    ]);
  });

  it("keeps legacy DP course aliases resolving to canonical course-map routes", () => {
    const resolved = resolveIbRoute("/ib/dp/courses/77");

    expect(resolved?.canonicalHref).toBe("/ib/dp/course-maps/77");
    expect(resolved?.route.id).toBe("ib.dp.course");
  });

  it("builds new MYP project breadcrumbs", () => {
    expect(buildIbBreadcrumbs("ib.myp.project", { projectId: "88" })).toEqual([
      { label: "Projects & Core", href: "/ib/projects-core" },
      { label: "MYP Projects", href: "/ib/myp/projects" },
      { label: "Project 88", href: "/ib/myp/projects/88" },
    ]);
  });

  it("keeps legacy aliases resolving to canonical guardian progress", () => {
    const resolved = resolveIbRoute("/guardian/progress/42");

    expect(resolved?.canonicalHref).toBe("/ib/guardian/progress");
    expect(resolved?.route.id).toBe("ib.guardian.progress");
  });

  it("backs every canonical app route with a real App Router page", () => {
    const missing = IB_ROUTE_DEFINITIONS.map((route) => routePatternToPage(route.pattern)).filter(
      (pagePath) => !fs.existsSync(pagePath),
    );

    expect(missing).toEqual([]);
  });

  it("keeps canonical IB workspaces free of demo hrefs", () => {
    const workspaceHrefs = Object.values(IB_WORKSPACES).map((workspace) => workspace.href);
    const routePatterns = IB_ROUTE_DEFINITIONS.flatMap((route) => [
      route.pattern,
      ...(route.aliases || []),
    ]);

    expect([...workspaceHrefs, ...routePatterns].some((value) => value.includes("/demo"))).toBe(
      false,
    );
  });

  it("exposes audit rows for every canonical route", () => {
    const auditRows = ibRouteAuditRows();

    expect(auditRows).toHaveLength(IB_ROUTE_DEFINITIONS.length);
    expect(auditRows.every((row) => row.pageFile.length > 0)).toBe(true);
    expect(auditRows.find((row) => row.id === "ib.rollout")?.featureFlag).toBe("ib_pack_v2");
  });
});
