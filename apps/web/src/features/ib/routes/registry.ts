"use client";

export type IbWorkspaceKey =
  | "home"
  | "continuum"
  | "planning"
  | "learning"
  | "assessment"
  | "portfolio"
  | "projects-core"
  | "families"
  | "standards-practices"
  | "reports"
  | "student"
  | "guardian"
  | "operations"
  | "review";

export type IbRouteId =
  | "ib.home"
  | "ib.continuum"
  | "ib.planning"
  | "ib.learning"
  | "ib.assessment"
  | "ib.portfolio"
  | "ib.evidence"
  | "ib.evidence.item"
  | "ib.families"
  | "ib.families.story"
  | "ib.families.publishing"
  | "ib.families.publishing.item"
  | "ib.projects-core"
  | "ib.standards-practices"
  | "ib.standards.cycle"
  | "ib.standards.packet"
  | "ib.operations"
  | "ib.settings"
  | "ib.rollout"
  | "ib.readiness"
  | "ib.review"
  | "ib.reports"
  | "ib.reports.exceptions"
  | "ib.pyp.poi"
  | "ib.pyp.unit"
  | "ib.pyp.unit.weekly-flow"
  | "ib.pyp.exhibition"
  | "ib.myp.unit"
  | "ib.myp.interdisciplinary"
  | "ib.myp.projects"
  | "ib.myp.project"
  | "ib.myp.service"
  | "ib.myp.service.entry"
  | "ib.myp.coverage"
  | "ib.myp.review"
  | "ib.myp.student.project"
  | "ib.dp.course"
  | "ib.dp.internal-assessment"
  | "ib.dp.ia-risk"
  | "ib.dp.core"
  | "ib.dp.core.ee"
  | "ib.dp.core.tok"
  | "ib.dp.core.cas"
  | "ib.dp.cas"
  | "ib.dp.cas.record"
  | "ib.dp.ee"
  | "ib.dp.tok"
  | "ib.dp.coordinator"
  | "ib.dp.student.overview"
  | "ib.specialist"
  | "ib.student.home"
  | "ib.student.learning"
  | "ib.student.calendar"
  | "ib.student.portfolio"
  | "ib.student.projects"
  | "ib.student.progress"
  | "ib.guardian.home"
  | "ib.guardian.stories"
  | "ib.guardian.current-units"
  | "ib.guardian.portfolio"
  | "ib.guardian.progress"
  | "ib.guardian.calendar"
  | "ib.guardian.messages";

export interface IbBreadcrumb {
  label: string;
  href: string;
}

export interface IbRouteDefinition {
  id: IbRouteId;
  pattern: string;
  pathnameTemplate: string;
  aliases?: string[];
  label: string;
  workspace: IbWorkspaceKey;
  family: string;
  roles: string[];
  permissions: string[];
  programme?: "PYP" | "MYP" | "DP" | "Mixed" | "Student" | "Guardian";
  parentId?: IbRouteId;
  recordKind: string;
  requiredEntities: string[];
  fallbackRoute: IbRouteId;
  featureFlag: string | null;
  pageFile: string;
  breadcrumbLabel?: (params: Record<string, string>) => string;
}

export interface ResolvedIbRoute {
  route: IbRouteDefinition;
  params: Record<string, string>;
  canonicalHref: string;
  breadcrumbs: IbBreadcrumb[];
}

interface RawIbRouteDefinition {
  id: IbRouteId;
  pattern: string;
  aliases?: string[];
  label: string;
  workspace: IbWorkspaceKey;
  family: string;
  roles: string[];
  programme?: "PYP" | "MYP" | "DP" | "Mixed" | "Student" | "Guardian";
  parentId?: IbRouteId;
  breadcrumbLabel?: (params: Record<string, string>) => string;
}

const RAW_IB_ROUTE_DEFINITIONS: RawIbRouteDefinition[] = [
  {
    id: "ib.home",
    pattern: "/ib/home",
    aliases: ["/ib", "/dashboard"],
    label: "Home",
    workspace: "home",
    family: "home",
    roles: ["admin", "curriculum_lead", "teacher", "district_admin"],
    programme: "Mixed",
  },
  {
    id: "ib.continuum",
    pattern: "/ib/continuum",
    label: "Continuum",
    workspace: "continuum",
    family: "continuum",
    roles: ["admin", "curriculum_lead", "teacher", "district_admin"],
    programme: "Mixed",
  },
  {
    id: "ib.planning",
    pattern: "/ib/planning",
    label: "Planning",
    workspace: "planning",
    family: "planning",
    roles: ["admin", "curriculum_lead", "teacher"],
    programme: "Mixed",
  },
  {
    id: "ib.learning",
    pattern: "/ib/learning",
    label: "Learning",
    workspace: "learning",
    family: "learning",
    roles: ["admin", "curriculum_lead", "teacher"],
    programme: "Mixed",
  },
  {
    id: "ib.assessment",
    pattern: "/ib/assessment",
    label: "Assessment",
    workspace: "assessment",
    family: "assessment",
    roles: ["admin", "curriculum_lead", "teacher"],
    programme: "Mixed",
  },
  {
    id: "ib.portfolio",
    pattern: "/ib/portfolio",
    aliases: ["/learn/portfolio"],
    label: "Portfolio",
    workspace: "portfolio",
    family: "portfolio",
    roles: ["admin", "curriculum_lead", "teacher", "student"],
    programme: "Mixed",
  },
  {
    id: "ib.evidence",
    pattern: "/ib/evidence",
    label: "Evidence Inbox",
    workspace: "portfolio",
    family: "evidence",
    roles: ["admin", "curriculum_lead", "teacher"],
    programme: "Mixed",
    parentId: "ib.portfolio",
  },
  {
    id: "ib.evidence.item",
    pattern: "/ib/evidence/items/:evidenceItemId",
    label: "Evidence Detail",
    workspace: "portfolio",
    family: "evidence",
    roles: ["admin", "curriculum_lead", "teacher"],
    programme: "Mixed",
    parentId: "ib.evidence",
    breadcrumbLabel: (params) => `Evidence ${params.evidenceItemId}`,
  },
  {
    id: "ib.families",
    pattern: "/ib/families",
    label: "Families",
    workspace: "families",
    family: "families",
    roles: ["admin", "curriculum_lead", "teacher"],
    programme: "Mixed",
  },
  {
    id: "ib.families.story",
    pattern: "/ib/families/stories/:storyId",
    label: "Learning Story",
    workspace: "families",
    family: "families",
    roles: ["admin", "curriculum_lead", "teacher", "guardian"],
    programme: "Mixed",
    parentId: "ib.families",
    breadcrumbLabel: (params) => `Story ${params.storyId}`,
  },
  {
    id: "ib.families.publishing",
    pattern: "/ib/families/publishing",
    label: "Publishing Queue",
    workspace: "families",
    family: "families",
    roles: ["admin", "curriculum_lead", "teacher"],
    programme: "Mixed",
    parentId: "ib.families",
  },
  {
    id: "ib.families.publishing.item",
    pattern: "/ib/families/publishing/:queueItemId",
    label: "Publishing Queue Detail",
    workspace: "families",
    family: "families",
    roles: ["admin", "curriculum_lead", "teacher"],
    programme: "Mixed",
    parentId: "ib.families.publishing",
    breadcrumbLabel: (params) => `Queue ${params.queueItemId}`,
  },
  {
    id: "ib.projects-core",
    pattern: "/ib/projects-core",
    label: "Projects & Core",
    workspace: "projects-core",
    family: "projects-core",
    roles: ["admin", "curriculum_lead", "teacher", "student"],
    programme: "Mixed",
  },
  {
    id: "ib.standards-practices",
    pattern: "/ib/standards-practices",
    label: "Standards & Practices",
    workspace: "standards-practices",
    family: "standards-practices",
    roles: ["admin", "curriculum_lead", "teacher", "district_admin"],
    programme: "Mixed",
  },
  {
    id: "ib.standards.cycle",
    pattern: "/ib/standards-practices/cycles/:cycleId",
    label: "Standards Cycle",
    workspace: "standards-practices",
    family: "standards-practices",
    roles: ["admin", "curriculum_lead", "teacher", "district_admin"],
    programme: "Mixed",
    parentId: "ib.standards-practices",
    breadcrumbLabel: (params) => `Cycle ${params.cycleId}`,
  },
  {
    id: "ib.standards.packet",
    pattern: "/ib/standards-practices/packets/:packetId",
    label: "Standards Packet",
    workspace: "standards-practices",
    family: "standards-practices",
    roles: ["admin", "curriculum_lead", "teacher", "district_admin"],
    programme: "Mixed",
    parentId: "ib.standards-practices",
    breadcrumbLabel: (params) => `Packet ${params.packetId}`,
  },
  {
    id: "ib.operations",
    pattern: "/ib/operations",
    label: "Operations Center",
    workspace: "operations",
    family: "operations",
    roles: ["admin", "curriculum_lead", "teacher", "district_admin"],
    programme: "Mixed",
  },
  {
    id: "ib.settings",
    pattern: "/ib/settings",
    label: "Programme Settings",
    workspace: "operations",
    family: "operations",
    roles: ["admin", "curriculum_lead", "teacher", "district_admin"],
    programme: "Mixed",
    parentId: "ib.operations",
  },
  {
    id: "ib.rollout",
    pattern: "/ib/rollout",
    label: "Rollout Console",
    workspace: "operations",
    family: "operations",
    roles: ["admin", "curriculum_lead", "teacher", "district_admin"],
    programme: "Mixed",
    parentId: "ib.operations",
  },
  {
    id: "ib.readiness",
    pattern: "/ib/readiness",
    label: "Pilot Readiness",
    workspace: "operations",
    family: "operations",
    roles: ["admin", "curriculum_lead", "teacher", "district_admin"],
    programme: "Mixed",
    parentId: "ib.operations",
  },
  {
    id: "ib.review",
    pattern: "/ib/review",
    aliases: ["/admin/approvals"],
    label: "Review Queue",
    workspace: "review",
    family: "review",
    roles: ["admin", "curriculum_lead", "teacher", "district_admin"],
    programme: "Mixed",
  },
  {
    id: "ib.reports",
    pattern: "/ib/reports",
    label: "Reports",
    workspace: "reports",
    family: "reports",
    roles: ["admin", "curriculum_lead", "teacher", "district_admin"],
    programme: "Mixed",
  },
  {
    id: "ib.reports.exceptions",
    pattern: "/ib/reports/exceptions",
    label: "Exceptions",
    workspace: "reports",
    family: "reports",
    roles: ["admin", "curriculum_lead", "teacher", "district_admin"],
    programme: "Mixed",
    parentId: "ib.reports",
  },
  {
    id: "ib.pyp.poi",
    pattern: "/ib/pyp/poi",
    aliases: ["/ib/continuum/pyp-poi"],
    label: "PYP POI",
    workspace: "continuum",
    family: "pyp",
    roles: ["admin", "curriculum_lead", "teacher", "district_admin"],
    programme: "PYP",
    parentId: "ib.continuum",
  },
  {
    id: "ib.pyp.unit",
    pattern: "/ib/pyp/units/:unitId",
    aliases: ["/ib/planning/pyp/units/:unitId", "/plan/units/:unitId"],
    label: "PYP Unit Studio",
    workspace: "planning",
    family: "pyp",
    roles: ["admin", "curriculum_lead", "teacher"],
    programme: "PYP",
    parentId: "ib.planning",
    breadcrumbLabel: (params) => `Unit ${params.unitId}`,
  },
  {
    id: "ib.pyp.unit.weekly-flow",
    pattern: "/ib/pyp/units/:unitId/weekly-flow",
    label: "Weekly Flow",
    workspace: "planning",
    family: "pyp",
    roles: ["admin", "curriculum_lead", "teacher"],
    programme: "PYP",
    parentId: "ib.pyp.unit",
  },
  {
    id: "ib.pyp.exhibition",
    pattern: "/ib/pyp/exhibition",
    aliases: ["/ib/projects-core/pyp-exhibition"],
    label: "PYP Exhibition",
    workspace: "projects-core",
    family: "pyp",
    roles: ["admin", "curriculum_lead", "teacher", "student"],
    programme: "PYP",
    parentId: "ib.projects-core",
  },
  {
    id: "ib.myp.unit",
    pattern: "/ib/myp/units/:unitId",
    aliases: ["/ib/planning/myp/units/:unitId"],
    label: "MYP Unit Studio",
    workspace: "planning",
    family: "myp",
    roles: ["admin", "curriculum_lead", "teacher"],
    programme: "MYP",
    parentId: "ib.planning",
    breadcrumbLabel: (params) => `Unit ${params.unitId}`,
  },
  {
    id: "ib.myp.interdisciplinary",
    pattern: "/ib/myp/interdisciplinary/:unitId",
    aliases: ["/ib/planning/myp/interdisciplinary/:unitId"],
    label: "Interdisciplinary Planning",
    workspace: "planning",
    family: "myp",
    roles: ["admin", "curriculum_lead", "teacher"],
    programme: "MYP",
    parentId: "ib.planning",
    breadcrumbLabel: (params) => `Interdisciplinary ${params.unitId}`,
  },
  {
    id: "ib.myp.projects",
    pattern: "/ib/myp/projects",
    label: "MYP Projects",
    workspace: "projects-core",
    family: "myp",
    roles: ["admin", "curriculum_lead", "teacher", "student"],
    programme: "MYP",
    parentId: "ib.projects-core",
  },
  {
    id: "ib.myp.project",
    pattern: "/ib/myp/projects/:projectId",
    label: "MYP Project Detail",
    workspace: "projects-core",
    family: "myp",
    roles: ["admin", "curriculum_lead", "teacher", "student"],
    programme: "MYP",
    parentId: "ib.myp.projects",
    breadcrumbLabel: (params) => `Project ${params.projectId}`,
  },
  {
    id: "ib.myp.service",
    pattern: "/ib/myp/service",
    label: "Service as Action",
    workspace: "projects-core",
    family: "myp",
    roles: ["admin", "curriculum_lead", "teacher", "student"],
    programme: "MYP",
    parentId: "ib.projects-core",
  },
  {
    id: "ib.myp.service.entry",
    pattern: "/ib/myp/service/:serviceEntryId",
    label: "Service Entry",
    workspace: "projects-core",
    family: "myp",
    roles: ["admin", "curriculum_lead", "teacher", "student"],
    programme: "MYP",
    parentId: "ib.myp.service",
    breadcrumbLabel: (params) => `Service ${params.serviceEntryId}`,
  },
  {
    id: "ib.myp.coverage",
    pattern: "/ib/myp/coverage",
    label: "MYP Coverage",
    workspace: "operations",
    family: "myp",
    roles: ["admin", "curriculum_lead", "teacher", "district_admin"],
    programme: "MYP",
    parentId: "ib.operations",
  },
  {
    id: "ib.myp.review",
    pattern: "/ib/myp/review",
    label: "MYP Review",
    workspace: "review",
    family: "myp",
    roles: ["admin", "curriculum_lead", "teacher", "district_admin"],
    programme: "MYP",
    parentId: "ib.review",
  },
  {
    id: "ib.myp.student.project",
    pattern: "/ib/myp/students/:studentId/projects/:projectId",
    label: "Student Project View",
    workspace: "projects-core",
    family: "myp",
    roles: ["admin", "curriculum_lead", "teacher", "student"],
    programme: "MYP",
    parentId: "ib.myp.projects",
    breadcrumbLabel: (params) => `Student ${params.studentId} Project ${params.projectId}`,
  },
  {
    id: "ib.dp.course",
    pattern: "/ib/dp/course-maps/:courseId",
    aliases: ["/ib/planning/dp/courses/:courseId", "/ib/dp/courses/:courseId"],
    label: "DP Course Map",
    workspace: "planning",
    family: "dp",
    roles: ["admin", "curriculum_lead", "teacher"],
    programme: "DP",
    parentId: "ib.planning",
    breadcrumbLabel: (params) => `Course ${params.courseId}`,
  },
  {
    id: "ib.dp.internal-assessment",
    pattern: "/ib/dp/internal-assessments/:recordId",
    label: "Internal Assessment",
    workspace: "assessment",
    family: "dp",
    roles: ["admin", "curriculum_lead", "teacher", "student"],
    programme: "DP",
    parentId: "ib.assessment",
    breadcrumbLabel: (params) => `IA ${params.recordId}`,
  },
  {
    id: "ib.dp.ia-risk",
    pattern: "/ib/dp/assessment/ia-risk",
    label: "IA Risk",
    workspace: "assessment",
    family: "dp",
    roles: ["admin", "curriculum_lead", "teacher"],
    programme: "DP",
    parentId: "ib.assessment",
  },
  {
    id: "ib.dp.core",
    pattern: "/ib/dp/core",
    label: "DP Core",
    workspace: "projects-core",
    family: "dp",
    roles: ["admin", "curriculum_lead", "teacher", "student"],
    programme: "DP",
    parentId: "ib.projects-core",
  },
  {
    id: "ib.dp.core.ee",
    pattern: "/ib/dp/core/ee",
    aliases: ["/ib/projects-core/dp/ee"],
    label: "Extended Essay",
    workspace: "projects-core",
    family: "dp",
    roles: ["admin", "curriculum_lead", "teacher", "student"],
    programme: "DP",
    parentId: "ib.dp.core",
  },
  {
    id: "ib.dp.ee",
    pattern: "/ib/dp/ee/:recordId",
    label: "Extended Essay Record",
    workspace: "projects-core",
    family: "dp",
    roles: ["admin", "curriculum_lead", "teacher", "student"],
    programme: "DP",
    parentId: "ib.dp.core.ee",
    breadcrumbLabel: (params) => `EE ${params.recordId}`,
  },
  {
    id: "ib.dp.core.tok",
    pattern: "/ib/dp/core/tok",
    aliases: ["/ib/projects-core/dp/tok"],
    label: "TOK",
    workspace: "projects-core",
    family: "dp",
    roles: ["admin", "curriculum_lead", "teacher", "student"],
    programme: "DP",
    parentId: "ib.dp.core",
  },
  {
    id: "ib.dp.tok",
    pattern: "/ib/dp/tok/:recordId",
    label: "TOK Record",
    workspace: "projects-core",
    family: "dp",
    roles: ["admin", "curriculum_lead", "teacher", "student"],
    programme: "DP",
    parentId: "ib.dp.core.tok",
    breadcrumbLabel: (params) => `TOK ${params.recordId}`,
  },
  {
    id: "ib.dp.core.cas",
    pattern: "/ib/dp/core/cas",
    aliases: ["/ib/projects-core/dp/cas"],
    label: "CAS",
    workspace: "projects-core",
    family: "dp",
    roles: ["admin", "curriculum_lead", "teacher", "student"],
    programme: "DP",
    parentId: "ib.dp.core",
  },
  {
    id: "ib.dp.cas",
    pattern: "/ib/dp/cas",
    label: "CAS Overview",
    workspace: "projects-core",
    family: "dp",
    roles: ["admin", "curriculum_lead", "teacher", "student"],
    programme: "DP",
    parentId: "ib.dp.core.cas",
  },
  {
    id: "ib.dp.cas.record",
    pattern: "/ib/dp/cas/records/:recordId",
    label: "CAS Record",
    workspace: "projects-core",
    family: "dp",
    roles: ["admin", "curriculum_lead", "teacher", "student"],
    programme: "DP",
    parentId: "ib.dp.cas",
    breadcrumbLabel: (params) => `CAS ${params.recordId}`,
  },
  {
    id: "ib.dp.coordinator",
    pattern: "/ib/dp/coordinator",
    label: "DP Coordinator",
    workspace: "operations",
    family: "dp",
    roles: ["admin", "curriculum_lead", "teacher", "district_admin"],
    programme: "DP",
    parentId: "ib.operations",
  },
  {
    id: "ib.dp.student.overview",
    pattern: "/ib/dp/students/:studentId/overview",
    label: "DP Student Overview",
    workspace: "student",
    family: "dp",
    roles: ["admin", "curriculum_lead", "teacher", "student"],
    programme: "DP",
    parentId: "ib.student.home",
    breadcrumbLabel: (params) => `Student ${params.studentId}`,
  },
  {
    id: "ib.specialist",
    pattern: "/ib/specialist",
    label: "Specialist",
    workspace: "operations",
    family: "specialist",
    roles: ["admin", "curriculum_lead", "teacher"],
    programme: "Mixed",
    parentId: "ib.operations",
  },
  {
    id: "ib.student.home",
    pattern: "/ib/student/home",
    aliases: ["/learn/dashboard"],
    label: "Student Home",
    workspace: "student",
    family: "student",
    roles: ["student"],
    programme: "Student",
  },
  {
    id: "ib.student.learning",
    pattern: "/ib/student/learning",
    aliases: ["/learn/courses"],
    label: "My Learning",
    workspace: "student",
    family: "student",
    roles: ["student"],
    programme: "Student",
    parentId: "ib.student.home",
  },
  {
    id: "ib.student.calendar",
    pattern: "/ib/student/calendar",
    aliases: ["/learn/calendar"],
    label: "Calendar",
    workspace: "student",
    family: "student",
    roles: ["student"],
    programme: "Student",
    parentId: "ib.student.home",
  },
  {
    id: "ib.student.portfolio",
    pattern: "/ib/student/portfolio",
    aliases: ["/learn/portfolio"],
    label: "Portfolio",
    workspace: "student",
    family: "student",
    roles: ["student"],
    programme: "Student",
    parentId: "ib.student.home",
  },
  {
    id: "ib.student.projects",
    pattern: "/ib/student/projects",
    label: "Projects",
    workspace: "student",
    family: "student",
    roles: ["student"],
    programme: "Student",
    parentId: "ib.student.home",
  },
  {
    id: "ib.student.progress",
    pattern: "/ib/student/progress",
    aliases: ["/learn/progress"],
    label: "Progress",
    workspace: "student",
    family: "student",
    roles: ["student"],
    programme: "Student",
    parentId: "ib.student.home",
  },
  {
    id: "ib.guardian.home",
    pattern: "/ib/guardian/home",
    aliases: ["/guardian/dashboard"],
    label: "Guardian Home",
    workspace: "guardian",
    family: "guardian",
    roles: ["guardian"],
    programme: "Guardian",
  },
  {
    id: "ib.guardian.stories",
    pattern: "/ib/guardian/stories",
    label: "Learning Stories",
    workspace: "guardian",
    family: "guardian",
    roles: ["guardian"],
    programme: "Guardian",
    parentId: "ib.guardian.home",
  },
  {
    id: "ib.guardian.current-units",
    pattern: "/ib/guardian/current-units",
    label: "Current Units",
    workspace: "guardian",
    family: "guardian",
    roles: ["guardian"],
    programme: "Guardian",
    parentId: "ib.guardian.home",
  },
  {
    id: "ib.guardian.portfolio",
    pattern: "/ib/guardian/portfolio",
    label: "Portfolio",
    workspace: "guardian",
    family: "guardian",
    roles: ["guardian"],
    programme: "Guardian",
    parentId: "ib.guardian.home",
  },
  {
    id: "ib.guardian.progress",
    pattern: "/ib/guardian/progress",
    aliases: ["/guardian/progress/:studentId"],
    label: "Progress",
    workspace: "guardian",
    family: "guardian",
    roles: ["guardian"],
    programme: "Guardian",
    parentId: "ib.guardian.home",
  },
  {
    id: "ib.guardian.calendar",
    pattern: "/ib/guardian/calendar",
    label: "Calendar",
    workspace: "guardian",
    family: "guardian",
    roles: ["guardian"],
    programme: "Guardian",
    parentId: "ib.guardian.home",
  },
  {
    id: "ib.guardian.messages",
    pattern: "/ib/guardian/messages",
    aliases: ["/communicate"],
    label: "Messages",
    workspace: "guardian",
    family: "guardian",
    roles: ["guardian"],
    programme: "Guardian",
    parentId: "ib.guardian.home",
  },
];

function routePatterns(route: IbRouteDefinition): string[] {
  return [route.pattern, ...(route.aliases ?? [])];
}

const ROUTE_FEATURE_FLAGS: Partial<Record<IbRouteId, string | null>> = {
  "ib.evidence": "ib_evidence_subsystem_v1",
  "ib.evidence.item": "ib_evidence_subsystem_v1",
  "ib.families": "ib_family_publishing_v1",
  "ib.families.story": "ib_family_publishing_v1",
  "ib.families.publishing": "ib_family_publishing_v1",
  "ib.families.publishing.item": "ib_family_publishing_v1",
  "ib.standards-practices": "ib_standards_practices_live_v1",
  "ib.standards.cycle": "ib_standards_practices_live_v1",
  "ib.standards.packet": "ib_standards_practices_live_v1",
  "ib.settings": "ib_programme_settings_v1",
  "ib.rollout": "ib_pack_v2",
  "ib.readiness": "ib_pack_v2",
  "ib.operations": "ib_operations_center_v1",
  "ib.review": "ib_operations_center_v1",
  "ib.pyp.poi": "ib_pyp_vertical_slice_v1",
  "ib.pyp.exhibition": "ib_pyp_exhibition_live_v1",
  "ib.myp.interdisciplinary": "ib_myp_interdisciplinary_slice_v1",
  "ib.myp.project": "ib_myp_projects_slice_v1",
  "ib.myp.projects": "ib_myp_projects_slice_v1",
  "ib.myp.service": "ib_myp_service_slice_v1",
  "ib.myp.service.entry": "ib_myp_service_slice_v1",
  "ib.myp.coverage": "ib_myp_vertical_slice_v1",
  "ib.myp.review": "ib_myp_vertical_slice_v1",
  "ib.dp.course": "ib_dp_vertical_slice_v1",
  "ib.dp.internal-assessment": "ib_dp_ia_slice_v1",
  "ib.dp.ee": "ib_dp_ee_slice_v1",
  "ib.dp.tok": "ib_dp_tok_slice_v1",
  "ib.dp.cas": "ib_dp_cas_slice_v1",
  "ib.dp.cas.record": "ib_dp_cas_slice_v1",
  "ib.dp.coordinator": "ib_dp_vertical_slice_v1",
};

const ROUTE_PAGE_FILES: Partial<Record<IbRouteId, string>> = {
  "ib.home": "apps/web/src/app/ib/home/page.tsx",
  "ib.continuum": "apps/web/src/app/ib/continuum/page.tsx",
  "ib.planning": "apps/web/src/app/ib/planning/page.tsx",
  "ib.learning": "apps/web/src/app/ib/learning/page.tsx",
  "ib.assessment": "apps/web/src/app/ib/assessment/page.tsx",
  "ib.portfolio": "apps/web/src/app/ib/portfolio/page.tsx",
  "ib.evidence": "apps/web/src/app/ib/evidence/page.tsx",
  "ib.evidence.item": "apps/web/src/app/ib/evidence/items/[evidenceItemId]/page.tsx",
  "ib.families": "apps/web/src/app/ib/families/page.tsx",
  "ib.families.story": "apps/web/src/app/ib/families/stories/[storyId]/page.tsx",
  "ib.families.publishing": "apps/web/src/app/ib/families/publishing/page.tsx",
  "ib.families.publishing.item": "apps/web/src/app/ib/families/publishing/[queueItemId]/page.tsx",
  "ib.projects-core": "apps/web/src/app/ib/projects-core/page.tsx",
  "ib.standards-practices": "apps/web/src/app/ib/standards-practices/page.tsx",
  "ib.standards.cycle": "apps/web/src/app/ib/standards-practices/cycles/[cycleId]/page.tsx",
  "ib.standards.packet": "apps/web/src/app/ib/standards-practices/packets/[packetId]/page.tsx",
  "ib.operations": "apps/web/src/app/ib/operations/page.tsx",
  "ib.settings": "apps/web/src/app/ib/settings/page.tsx",
  "ib.rollout": "apps/web/src/app/ib/rollout/page.tsx",
  "ib.readiness": "apps/web/src/app/ib/readiness/page.tsx",
  "ib.review": "apps/web/src/app/ib/review/page.tsx",
  "ib.reports": "apps/web/src/app/ib/reports/page.tsx",
  "ib.reports.exceptions": "apps/web/src/app/ib/reports/exceptions/page.tsx",
  "ib.pyp.poi": "apps/web/src/app/ib/pyp/poi/page.tsx",
  "ib.pyp.unit": "apps/web/src/app/ib/pyp/units/[unitId]/page.tsx",
  "ib.pyp.unit.weekly-flow": "apps/web/src/app/ib/pyp/units/[unitId]/weekly-flow/page.tsx",
  "ib.pyp.exhibition": "apps/web/src/app/ib/pyp/exhibition/page.tsx",
  "ib.myp.unit": "apps/web/src/app/ib/myp/units/[unitId]/page.tsx",
  "ib.myp.interdisciplinary": "apps/web/src/app/ib/myp/interdisciplinary/[unitId]/page.tsx",
  "ib.myp.projects": "apps/web/src/app/ib/myp/projects/page.tsx",
  "ib.myp.project": "apps/web/src/app/ib/myp/projects/[projectId]/page.tsx",
  "ib.myp.service": "apps/web/src/app/ib/myp/service/page.tsx",
  "ib.myp.service.entry": "apps/web/src/app/ib/myp/service/[serviceEntryId]/page.tsx",
  "ib.myp.coverage": "apps/web/src/app/ib/myp/coverage/page.tsx",
  "ib.myp.review": "apps/web/src/app/ib/myp/review/page.tsx",
  "ib.myp.student.project":
    "apps/web/src/app/ib/myp/students/[studentId]/projects/[projectId]/page.tsx",
  "ib.dp.course": "apps/web/src/app/ib/dp/course-maps/[courseId]/page.tsx",
  "ib.dp.internal-assessment": "apps/web/src/app/ib/dp/internal-assessments/[recordId]/page.tsx",
  "ib.dp.ia-risk": "apps/web/src/app/ib/dp/assessment/ia-risk/page.tsx",
  "ib.dp.core": "apps/web/src/app/ib/dp/core/page.tsx",
  "ib.dp.core.ee": "apps/web/src/app/ib/dp/core/ee/page.tsx",
  "ib.dp.ee": "apps/web/src/app/ib/dp/ee/[recordId]/page.tsx",
  "ib.dp.core.tok": "apps/web/src/app/ib/dp/core/tok/page.tsx",
  "ib.dp.tok": "apps/web/src/app/ib/dp/tok/[recordId]/page.tsx",
  "ib.dp.core.cas": "apps/web/src/app/ib/dp/core/cas/page.tsx",
  "ib.dp.cas": "apps/web/src/app/ib/dp/cas/page.tsx",
  "ib.dp.cas.record": "apps/web/src/app/ib/dp/cas/records/[recordId]/page.tsx",
  "ib.dp.coordinator": "apps/web/src/app/ib/dp/coordinator/page.tsx",
  "ib.dp.student.overview": "apps/web/src/app/ib/dp/students/[studentId]/overview/page.tsx",
  "ib.specialist": "apps/web/src/app/ib/specialist/page.tsx",
  "ib.student.home": "apps/web/src/app/ib/student/home/page.tsx",
  "ib.student.learning": "apps/web/src/app/ib/student/learning/page.tsx",
  "ib.student.calendar": "apps/web/src/app/ib/student/calendar/page.tsx",
  "ib.student.portfolio": "apps/web/src/app/ib/student/portfolio/page.tsx",
  "ib.student.projects": "apps/web/src/app/ib/student/projects/page.tsx",
  "ib.student.progress": "apps/web/src/app/ib/student/progress/page.tsx",
  "ib.guardian.home": "apps/web/src/app/ib/guardian/home/page.tsx",
  "ib.guardian.stories": "apps/web/src/app/ib/guardian/stories/page.tsx",
  "ib.guardian.current-units": "apps/web/src/app/ib/guardian/current-units/page.tsx",
  "ib.guardian.portfolio": "apps/web/src/app/ib/guardian/portfolio/page.tsx",
  "ib.guardian.progress": "apps/web/src/app/ib/guardian/progress/page.tsx",
  "ib.guardian.calendar": "apps/web/src/app/ib/guardian/calendar/page.tsx",
  "ib.guardian.messages": "apps/web/src/app/ib/guardian/messages/page.tsx",
};

function defaultRecordKind(route: RawIbRouteDefinition): string {
  if (
    route.id.startsWith("ib.pyp.unit") ||
    route.id === "ib.myp.unit" ||
    route.id === "ib.myp.interdisciplinary" ||
    route.id === "ib.dp.course"
  ) {
    return "curriculum_document";
  }
  if (
    route.id === "ib.myp.project" ||
    route.id === "ib.myp.service.entry" ||
    route.id === "ib.myp.student.project" ||
    route.id === "ib.dp.internal-assessment" ||
    route.id === "ib.dp.ee" ||
    route.id === "ib.dp.tok" ||
    route.id === "ib.dp.cas.record"
  ) {
    return "ib_operational_record";
  }
  if (route.id === "ib.evidence.item") return "ib_evidence_item";
  if (route.id === "ib.families.story") return "ib_learning_story";
  if (route.id === "ib.families.publishing.item") return "ib_publishing_queue_item";
  if (route.id === "ib.standards.packet") return "ib_standards_packet";
  if (route.id === "ib.standards.cycle") return "ib_standards_cycle";
  return route.family;
}

function defaultRequiredEntities(route: RawIbRouteDefinition): string[] {
  if (route.pattern.includes(":unitId")) return ["unitId"];
  if (route.pattern.includes(":projectId")) return ["projectId"];
  if (route.pattern.includes(":serviceEntryId")) return ["serviceEntryId"];
  if (route.pattern.includes(":courseId")) return ["courseId"];
  if (route.pattern.includes(":recordId")) return ["recordId"];
  if (route.pattern.includes(":studentId"))
    return route.pattern.includes(":projectId") ? ["studentId", "projectId"] : ["studentId"];
  if (route.pattern.includes(":evidenceItemId")) return ["evidenceItemId"];
  if (route.pattern.includes(":storyId")) return ["storyId"];
  if (route.pattern.includes(":queueItemId")) return ["queueItemId"];
  if (route.pattern.includes(":cycleId")) return ["cycleId"];
  if (route.pattern.includes(":packetId")) return ["packetId"];
  return [];
}

function defaultFallbackRoute(route: RawIbRouteDefinition): IbRouteId {
  if (route.parentId) return route.parentId;
  if (route.family === "student") return "ib.student.home";
  if (route.family === "guardian") return "ib.guardian.home";
  return "ib.home";
}

function permissionsFor(route: RawIbRouteDefinition): string[] {
  return route.roles.map((role) => `role:${role}`);
}

export const IB_ROUTE_DEFINITIONS: IbRouteDefinition[] = RAW_IB_ROUTE_DEFINITIONS.map((route) => ({
  ...route,
  pathnameTemplate: route.pattern,
  permissions: permissionsFor(route),
  recordKind: defaultRecordKind(route),
  requiredEntities: defaultRequiredEntities(route),
  fallbackRoute: defaultFallbackRoute(route),
  featureFlag: ROUTE_FEATURE_FLAGS[route.id] ?? null,
  pageFile: ROUTE_PAGE_FILES[route.id] || "",
}));

function matchPattern(
  pattern: string,
  pathname: string | null | undefined,
): Record<string, string> | null {
  if (!pathname) {
    return null;
  }

  const keys: string[] = [];
  const regex = new RegExp(
    `^${pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/:([A-Za-z0-9_]+)/g, (_, key) => {
      keys.push(String(key));
      return "([^/]+)";
    })}$`,
  );
  const match = pathname.match(regex);

  if (!match) {
    return null;
  }

  return keys.reduce<Record<string, string>>((result, key, index) => {
    result[key] = decodeURIComponent(match[index + 1] || "");
    return result;
  }, {});
}

export function buildIbRoute(id: IbRouteId, params: Record<string, string> = {}): string {
  const route = IB_ROUTE_DEFINITIONS.find((definition) => definition.id === id);
  if (!route) {
    throw new Error(`Unknown IB route id: ${id}`);
  }

  return route.pattern.replace(/:([A-Za-z0-9_]+)/g, (_, key) => params[String(key)] || `:${key}`);
}

export function resolveIbRoute(pathname: string | null | undefined): ResolvedIbRoute | null {
  if (!pathname) {
    return null;
  }

  for (const route of IB_ROUTE_DEFINITIONS) {
    for (const pattern of routePatterns(route)) {
      const params = matchPattern(pattern, pathname);

      if (params) {
        return {
          route,
          params,
          canonicalHref: buildIbRoute(route.id, params),
          breadcrumbs: buildIbBreadcrumbs(route.id, params),
        };
      }
    }
  }

  return null;
}

export function buildIbBreadcrumbs(
  routeId: IbRouteId,
  params: Record<string, string> = {},
): IbBreadcrumb[] {
  const route = IB_ROUTE_DEFINITIONS.find((definition) => definition.id === routeId);
  if (!route) {
    return [];
  }

  const trail = route.parentId ? buildIbBreadcrumbs(route.parentId, params) : [];

  return [
    ...trail,
    {
      label: route.breadcrumbLabel ? route.breadcrumbLabel(params) : route.label,
      href: buildIbRoute(route.id, params),
    },
  ];
}

export function currentIbWorkspaceRoutes() {
  return IB_ROUTE_DEFINITIONS;
}

export function ibRouteAuditRows() {
  return IB_ROUTE_DEFINITIONS.map((route) => ({
    id: route.id,
    programme: route.programme ?? "Mixed",
    pathnameTemplate: route.pathnameTemplate,
    recordKind: route.recordKind,
    requiredEntities: route.requiredEntities.join(", "),
    fallbackRoute: route.fallbackRoute,
    featureFlag: route.featureFlag ?? "always_on",
    permissions: route.permissions.join(", "),
    pageFile: route.pageFile,
  }));
}

export const IB_CANONICAL_ROUTES = {
  home: buildIbRoute("ib.home"),
  continuum: buildIbRoute("ib.continuum"),
  planning: buildIbRoute("ib.planning"),
  learning: buildIbRoute("ib.learning"),
  assessment: buildIbRoute("ib.assessment"),
  portfolio: buildIbRoute("ib.portfolio"),
  evidence: buildIbRoute("ib.evidence"),
  evidenceItem: (evidenceItemId: string | number) =>
    buildIbRoute("ib.evidence.item", {
      evidenceItemId: String(evidenceItemId),
    }),
  families: buildIbRoute("ib.families"),
  familyStory: (storyId: string | number) =>
    buildIbRoute("ib.families.story", { storyId: String(storyId) }),
  familiesPublishing: buildIbRoute("ib.families.publishing"),
  familiesPublishingItem: (queueItemId: string | number) =>
    buildIbRoute("ib.families.publishing.item", {
      queueItemId: String(queueItemId),
    }),
  projectsCore: buildIbRoute("ib.projects-core"),
  standardsPractices: buildIbRoute("ib.standards-practices"),
  standardsCycle: (cycleId: string | number) =>
    buildIbRoute("ib.standards.cycle", { cycleId: String(cycleId) }),
  standardsPacket: (packetId: string | number) =>
    buildIbRoute("ib.standards.packet", { packetId: String(packetId) }),
  operations: buildIbRoute("ib.operations"),
  settings: buildIbRoute("ib.settings"),
  rollout: buildIbRoute("ib.rollout"),
  readiness: buildIbRoute("ib.readiness"),
  review: buildIbRoute("ib.review"),
  reports: buildIbRoute("ib.reports"),
  reportExceptions: buildIbRoute("ib.reports.exceptions"),
  pypPoi: buildIbRoute("ib.pyp.poi"),
  pypUnit: (unitId: string | number) => buildIbRoute("ib.pyp.unit", { unitId: String(unitId) }),
  pypWeeklyFlow: (unitId: string | number) =>
    buildIbRoute("ib.pyp.unit.weekly-flow", { unitId: String(unitId) }),
  pypExhibition: buildIbRoute("ib.pyp.exhibition"),
  mypUnit: (unitId: string | number) => buildIbRoute("ib.myp.unit", { unitId: String(unitId) }),
  mypInterdisciplinary: (unitId: string | number) =>
    buildIbRoute("ib.myp.interdisciplinary", {
      unitId: String(unitId),
    }),
  mypProjects: buildIbRoute("ib.myp.projects"),
  mypProject: (projectId: string | number) =>
    buildIbRoute("ib.myp.project", { projectId: String(projectId) }),
  mypService: buildIbRoute("ib.myp.service"),
  mypServiceEntry: (serviceEntryId: string | number) =>
    buildIbRoute("ib.myp.service.entry", {
      serviceEntryId: String(serviceEntryId),
    }),
  mypCoverage: buildIbRoute("ib.myp.coverage"),
  mypReview: buildIbRoute("ib.myp.review"),
  mypStudentProject: (studentId: string | number, projectId: string | number) =>
    buildIbRoute("ib.myp.student.project", {
      studentId: String(studentId),
      projectId: String(projectId),
    }),
  dpCourse: (courseId: string | number) =>
    buildIbRoute("ib.dp.course", { courseId: String(courseId) }),
  dpInternalAssessment: (recordId: string | number) =>
    buildIbRoute("ib.dp.internal-assessment", {
      recordId: String(recordId),
    }),
  dpIaRisk: buildIbRoute("ib.dp.ia-risk"),
  dpCore: buildIbRoute("ib.dp.core"),
  dpCoreEe: buildIbRoute("ib.dp.core.ee"),
  dpCoreTok: buildIbRoute("ib.dp.core.tok"),
  dpCoreCas: buildIbRoute("ib.dp.core.cas"),
  dpCas: buildIbRoute("ib.dp.cas"),
  dpCasRecord: (recordId: string | number) =>
    buildIbRoute("ib.dp.cas.record", { recordId: String(recordId) }),
  dpEe: (recordId: string | number) => buildIbRoute("ib.dp.ee", { recordId: String(recordId) }),
  dpTok: (recordId: string | number) => buildIbRoute("ib.dp.tok", { recordId: String(recordId) }),
  dpCoordinator: buildIbRoute("ib.dp.coordinator"),
  dpStudentOverview: (studentId: string | number) =>
    buildIbRoute("ib.dp.student.overview", {
      studentId: String(studentId),
    }),
  specialist: buildIbRoute("ib.specialist"),
  studentHome: buildIbRoute("ib.student.home"),
  studentLearning: buildIbRoute("ib.student.learning"),
  studentCalendar: buildIbRoute("ib.student.calendar"),
  studentPortfolio: buildIbRoute("ib.student.portfolio"),
  studentProjects: buildIbRoute("ib.student.projects"),
  studentProgress: buildIbRoute("ib.student.progress"),
  guardianHome: buildIbRoute("ib.guardian.home"),
  guardianStories: buildIbRoute("ib.guardian.stories"),
  guardianCurrentUnits: buildIbRoute("ib.guardian.current-units"),
  guardianPortfolio: buildIbRoute("ib.guardian.portfolio"),
  guardianProgress: buildIbRoute("ib.guardian.progress"),
  guardianCalendar: buildIbRoute("ib.guardian.calendar"),
  guardianMessages: buildIbRoute("ib.guardian.messages"),
} as const;
