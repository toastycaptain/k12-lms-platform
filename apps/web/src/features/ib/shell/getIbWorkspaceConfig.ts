import { IB_CANONICAL_ROUTES, type IbWorkspaceKey } from "@/features/ib/core/route-registry";

export type IbWorkspaceId =
  | "home"
  | "continuum"
  | "planning"
  | "learning"
  | "assessment"
  | "portfolio"
  | "projects-core"
  | "families"
  | "operations"
  | "review"
  | "standards-practices"
  | "reports"
  | "student-home"
  | "student-learning"
  | "student-calendar"
  | "student-portfolio"
  | "student-projects"
  | "student-reflection"
  | "student-progress"
  | "guardian-home"
  | "guardian-stories"
  | "guardian-current-units"
  | "guardian-portfolio"
  | "guardian-progress"
  | "guardian-calendar"
  | "guardian-messages";

export interface IbWorkspaceConfig {
  id: IbWorkspaceKey | IbWorkspaceId;
  label: string;
  href: string;
  description: string;
  roles: string[];
}

export const IB_WORKSPACES: Record<IbWorkspaceId, IbWorkspaceConfig> = {
  home: {
    id: "home",
    label: "Home",
    href: IB_CANONICAL_ROUTES.home,
    description: "Daily IB overview across planning, evidence, projects, and family visibility.",
    roles: ["admin", "curriculum_lead", "teacher", "district_admin"],
  },
  continuum: {
    id: "continuum",
    label: "Continuum",
    href: IB_CANONICAL_ROUTES.continuum,
    description: "Track progression across PYP, MYP, and DP with shared concepts and evidence.",
    roles: ["admin", "curriculum_lead", "teacher", "district_admin"],
  },
  planning: {
    id: "planning",
    label: "Planning",
    href: IB_CANONICAL_ROUTES.planning,
    description: "Programme-aware studios for PYP, MYP, DP, and interdisciplinary design.",
    roles: ["admin", "curriculum_lead", "teacher"],
  },
  learning: {
    id: "learning",
    label: "Learning",
    href: IB_CANONICAL_ROUTES.learning,
    description: "Daily learning flow, checkpoints, and reflections connected to live units.",
    roles: ["admin", "curriculum_lead", "teacher"],
  },
  assessment: {
    id: "assessment",
    label: "Assessment",
    href: IB_CANONICAL_ROUTES.assessment,
    description:
      "Criteria, evidence, IA readiness, and feedback signals in one assessment workspace.",
    roles: ["admin", "curriculum_lead", "teacher"],
  },
  portfolio: {
    id: "portfolio",
    label: "Portfolio",
    href: IB_CANONICAL_ROUTES.portfolio,
    description:
      "Evidence, learning stories, and visibility controls across students, teachers, and families.",
    roles: ["admin", "curriculum_lead", "teacher"],
  },
  "projects-core": {
    id: "projects-core",
    label: "Projects & Core",
    href: IB_CANONICAL_ROUTES.projectsCore,
    description:
      "PYP exhibition, MYP projects, CAS, EE, and TOK workflows without spreadsheet sprawl.",
    roles: ["admin", "curriculum_lead", "teacher"],
  },
  families: {
    id: "families",
    label: "Families",
    href: IB_CANONICAL_ROUTES.families,
    description: "Manage learning stories, family windows, and calm communication flows.",
    roles: ["admin", "curriculum_lead", "teacher"],
  },
  operations: {
    id: "operations",
    label: "Operations",
    href: IB_CANONICAL_ROUTES.operations,
    description: "Exception-first programme health, queue status, and support hotspots.",
    roles: ["admin", "curriculum_lead", "teacher", "district_admin"],
  },
  review: {
    id: "review",
    label: "Review",
    href: IB_CANONICAL_ROUTES.review,
    description: "Approvals, moderation, and comment review in one queue.",
    roles: ["admin", "curriculum_lead", "teacher", "district_admin"],
  },
  "standards-practices": {
    id: "standards-practices",
    label: "Standards & Practices",
    href: IB_CANONICAL_ROUTES.standardsPractices,
    description: "Collect authorization and evaluation evidence linked to live curriculum objects.",
    roles: ["admin", "curriculum_lead", "teacher", "district_admin"],
  },
  reports: {
    id: "reports",
    label: "Reports",
    href: IB_CANONICAL_ROUTES.reports,
    description: "Readiness, evidence density, and programme health across the continuum.",
    roles: ["admin", "curriculum_lead", "teacher", "district_admin"],
  },
  "student-home": {
    id: "student-home",
    label: "Home",
    href: IB_CANONICAL_ROUTES.studentHome,
    description: "A daily learning stream with clear next steps and reflection prompts.",
    roles: ["student"],
  },
  "student-learning": {
    id: "student-learning",
    label: "My Learning",
    href: IB_CANONICAL_ROUTES.studentLearning,
    description: "Course and learning experience overview with unit context.",
    roles: ["student"],
  },
  "student-calendar": {
    id: "student-calendar",
    label: "Calendar",
    href: IB_CANONICAL_ROUTES.studentCalendar,
    description: "Upcoming deadlines, checkpoints, and class events.",
    roles: ["student"],
  },
  "student-portfolio": {
    id: "student-portfolio",
    label: "Portfolio",
    href: IB_CANONICAL_ROUTES.studentPortfolio,
    description: "Evidence capture, learning stories, and reflections.",
    roles: ["student"],
  },
  "student-projects": {
    id: "student-projects",
    label: "Projects",
    href: IB_CANONICAL_ROUTES.studentProjects,
    description: "Project milestones and core expectations in one place.",
    roles: ["student"],
  },
  "student-reflection": {
    id: "student-reflection",
    label: "Quick Reflection",
    href: IB_CANONICAL_ROUTES.studentPortfolio,
    description: "Capture evidence and reflections without leaving the student flow.",
    roles: ["student"],
  },
  "student-progress": {
    id: "student-progress",
    label: "Progress",
    href: IB_CANONICAL_ROUTES.studentProgress,
    description: "Criterion, ATL, portfolio, and milestone progress.",
    roles: ["student"],
  },
  "guardian-home": {
    id: "guardian-home",
    label: "Home",
    href: IB_CANONICAL_ROUTES.guardianHome,
    description: "A calm family view of current learning, milestones, and support windows.",
    roles: ["guardian"],
  },
  "guardian-stories": {
    id: "guardian-stories",
    label: "Learning Stories",
    href: IB_CANONICAL_ROUTES.guardianStories,
    description: "Narrative family updates about learning moments.",
    roles: ["guardian"],
  },
  "guardian-current-units": {
    id: "guardian-current-units",
    label: "Current Units",
    href: IB_CANONICAL_ROUTES.guardianCurrentUnits,
    description: "Family-friendly summaries of current explorations and inquiry.",
    roles: ["guardian"],
  },
  "guardian-portfolio": {
    id: "guardian-portfolio",
    label: "Portfolio",
    href: IB_CANONICAL_ROUTES.guardianPortfolio,
    description: "Approved highlights from the student portfolio.",
    roles: ["guardian"],
  },
  "guardian-progress": {
    id: "guardian-progress",
    label: "Progress Reports",
    href: IB_CANONICAL_ROUTES.guardianProgress,
    description: "Progress summaries and support signals translated for families.",
    roles: ["guardian"],
  },
  "guardian-calendar": {
    id: "guardian-calendar",
    label: "Calendar",
    href: IB_CANONICAL_ROUTES.guardianCalendar,
    description: "Upcoming dates and visible deadlines.",
    roles: ["guardian"],
  },
  "guardian-messages": {
    id: "guardian-messages",
    label: "Messages",
    href: IB_CANONICAL_ROUTES.guardianMessages,
    description: "Family communication without noisy workflow clutter.",
    roles: ["guardian"],
  },
};

export function getIbWorkspaceConfig(id: IbWorkspaceId) {
  return IB_WORKSPACES[id];
}
