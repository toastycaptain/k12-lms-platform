import type { NavigationItem } from "./types";
import { IB_WORKSPACES } from "@/features/ib/shell/getIbWorkspaceConfig";
import { IB_CANONICAL_ROUTES } from "@/features/ib/core/route-registry";

export const GENERIC_NAV_ITEMS: NavigationItem[] = [
  {
    id: "guardian",
    label: "My Students",
    href: "/guardian/dashboard",
    roles: ["guardian"],
    children: [
      { id: "guardian.dashboard", label: "Dashboard", href: "/guardian/dashboard" },
      { id: "guardian.messages", label: "Messages", href: "/communicate" },
    ],
  },
  {
    id: "learn",
    label: "Learn",
    href: "/learn/dashboard",
    roles: ["student"],
    children: [
      { id: "learn.dashboard", label: "Dashboard", href: "/learn/dashboard" },
      { id: "learn.courses", label: "My Courses", href: "/learn/courses" },
      { id: "learn.calendar", label: "Calendar", href: "/learn/calendar" },
      { id: "learn.portfolio", label: "Portfolio", href: "/learn/portfolio" },
      { id: "learn.progress", label: "Progress", href: "/learn/progress" },
    ],
  },
  {
    id: "plan",
    label: "Plan",
    href: "/plan/units",
    roles: ["admin", "curriculum_lead", "teacher"],
    children: [
      { id: "plan.units", label: "Units", href: "/plan/units" },
      { id: "plan.calendar", label: "Calendar", href: "/plan/calendar" },
      { id: "plan.templates", label: "Templates", href: "/plan/templates" },
      { id: "plan.contexts", label: "Contexts", href: "/plan/contexts" },
      { id: "plan.standards", label: "Frameworks", href: "/plan/standards" },
    ],
  },
  {
    id: "teach",
    label: "Teach",
    href: "/teach/courses",
    roles: ["admin", "teacher"],
    children: [
      { id: "teach.courses", label: "Courses", href: "/teach/courses" },
      { id: "teach.submissions", label: "Submissions", href: "/teach/submissions" },
    ],
  },
  {
    id: "assess",
    label: "Assess",
    href: "/assess/quizzes",
    roles: ["admin", "curriculum_lead", "teacher"],
    children: [
      { id: "assess.quizzes", label: "Quizzes", href: "/assess/quizzes" },
      { id: "assess.banks", label: "Question Banks", href: "/assess/banks" },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    href: "/admin/dashboard",
    roles: ["admin", "curriculum_lead"],
    children: [
      { id: "admin.dashboard", label: "Dashboard", href: "/admin/dashboard" },
      { id: "admin.users", label: "Users & Roles", href: "/admin/users" },
      {
        id: "admin.curriculum",
        label: "Curriculum Packs",
        href: "/admin/curriculum-profiles",
        roles: ["admin"],
      },
    ],
  },
  {
    id: "district",
    label: "District",
    href: "/district/dashboard",
    roles: ["district_admin"],
    children: [
      { id: "district.dashboard", label: "Dashboard", href: "/district/dashboard" },
      { id: "district.schools", label: "Schools", href: "/district/schools" },
    ],
  },
  {
    id: "report",
    label: "Report",
    href: "/report",
    roles: ["admin", "curriculum_lead", "teacher"],
    children: [{ id: "report.overview", label: "Overview", href: "/report" }],
  },
  {
    id: "communicate",
    label: "Communicate",
    href: "/communicate",
    roles: ["admin", "curriculum_lead", "teacher", "student", "guardian"],
    children: [
      { id: "communicate.overview", label: "Overview", href: "/communicate" },
      { id: "communicate.compose", label: "Compose", href: "/communicate/compose" },
    ],
  },
];

export const IB_TEACHER_NAV_ITEMS: NavigationItem[] = [
  {
    id: IB_WORKSPACES.home.id,
    label: IB_WORKSPACES.home.label,
    href: IB_WORKSPACES.home.href,
    description: IB_WORKSPACES.home.description,
    roles: IB_WORKSPACES.home.roles,
  },
  {
    id: IB_WORKSPACES.continuum.id,
    label: IB_WORKSPACES.continuum.label,
    href: IB_WORKSPACES.continuum.href,
    description: IB_WORKSPACES.continuum.description,
    roles: IB_WORKSPACES.continuum.roles,
    children: [{ id: "ib.continuum.poi", label: "PYP POI", href: IB_CANONICAL_ROUTES.pypPoi }],
  },
  {
    id: IB_WORKSPACES.planning.id,
    label: IB_WORKSPACES.planning.label,
    href: IB_WORKSPACES.planning.href,
    description: IB_WORKSPACES.planning.description,
    roles: IB_WORKSPACES.planning.roles,
    children: [
      { id: "ib.planning.pyp", label: "PYP Unit Studio", href: "/ib/pyp/units/new" },
      { id: "ib.planning.myp", label: "MYP Unit Studio", href: "/ib/myp/units/new" },
      {
        id: "ib.planning.interdisciplinary",
        label: "Interdisciplinary",
        href: "/ib/myp/interdisciplinary/new",
      },
      { id: "ib.planning.dp", label: "DP Course Map", href: "/ib/dp/course-maps/new" },
      {
        id: "ib.planning.collaboration",
        label: "Collaboration Hub",
        href: "/ib/planning/collaboration",
      },
    ],
  },
  {
    id: IB_WORKSPACES.learning.id,
    label: IB_WORKSPACES.learning.label,
    href: IB_WORKSPACES.learning.href,
    description: IB_WORKSPACES.learning.description,
    roles: IB_WORKSPACES.learning.roles,
  },
  {
    id: IB_WORKSPACES.assessment.id,
    label: IB_WORKSPACES.assessment.label,
    href: IB_WORKSPACES.assessment.href,
    description: IB_WORKSPACES.assessment.description,
    roles: IB_WORKSPACES.assessment.roles,
    children: [
      {
        id: "ib.assessment.dp",
        label: "DP Internal Assessments",
        href: IB_CANONICAL_ROUTES.dpIaRisk,
      },
      {
        id: "ib.assessment.myp.review",
        label: "MYP Review",
        href: IB_CANONICAL_ROUTES.mypReview,
      },
    ],
  },
  {
    id: IB_WORKSPACES.portfolio.id,
    label: IB_WORKSPACES.portfolio.label,
    href: IB_WORKSPACES.portfolio.href,
    description: IB_WORKSPACES.portfolio.description,
    roles: IB_WORKSPACES.portfolio.roles,
    children: [
      {
        id: "ib.portfolio.evidence",
        label: "Evidence Inbox",
        href: IB_CANONICAL_ROUTES.evidence,
      },
    ],
  },
  {
    id: IB_WORKSPACES["projects-core"].id,
    label: IB_WORKSPACES["projects-core"].label,
    href: IB_WORKSPACES["projects-core"].href,
    description: IB_WORKSPACES["projects-core"].description,
    roles: IB_WORKSPACES["projects-core"].roles,
    children: [
      { id: "ib.projects.pyp", label: "PYP Exhibition", href: IB_CANONICAL_ROUTES.pypExhibition },
      { id: "ib.projects.myp", label: "MYP Projects", href: IB_CANONICAL_ROUTES.mypProjects },
      {
        id: "ib.projects.service",
        label: "Service as Action",
        href: IB_CANONICAL_ROUTES.mypService,
      },
      { id: "ib.projects.cas", label: "CAS", href: IB_CANONICAL_ROUTES.dpCas },
      { id: "ib.projects.ee", label: "EE", href: IB_CANONICAL_ROUTES.dpCoreEe },
      { id: "ib.projects.tok", label: "TOK", href: IB_CANONICAL_ROUTES.dpCoreTok },
    ],
  },
  {
    id: IB_WORKSPACES.families.id,
    label: IB_WORKSPACES.families.label,
    href: IB_WORKSPACES.families.href,
    description: IB_WORKSPACES.families.description,
    roles: IB_WORKSPACES.families.roles,
    children: [
      {
        id: "ib.families.publishing",
        label: "Publishing Queue",
        href: IB_CANONICAL_ROUTES.familiesPublishing,
      },
    ],
  },
  {
    id: IB_WORKSPACES.operations.id,
    label: IB_WORKSPACES.operations.label,
    href: IB_WORKSPACES.operations.href,
    description: IB_WORKSPACES.operations.description,
    roles: IB_WORKSPACES.operations.roles,
    children: [
      {
        id: "ib.operations.myp.coverage",
        label: "MYP Coverage",
        href: IB_CANONICAL_ROUTES.mypCoverage,
      },
      {
        id: "ib.operations.dp.coordinator",
        label: "DP Coordinator",
        href: IB_CANONICAL_ROUTES.dpCoordinator,
      },
      {
        id: "ib.operations.specialist",
        label: "Specialist",
        href: IB_CANONICAL_ROUTES.specialist,
      },
    ],
  },
  {
    id: IB_WORKSPACES.review.id,
    label: IB_WORKSPACES.review.label,
    href: IB_WORKSPACES.review.href,
    description: IB_WORKSPACES.review.description,
    roles: IB_WORKSPACES.review.roles,
  },
  {
    id: IB_WORKSPACES["standards-practices"].id,
    label: IB_WORKSPACES["standards-practices"].label,
    href: IB_WORKSPACES["standards-practices"].href,
    description: IB_WORKSPACES["standards-practices"].description,
    roles: IB_WORKSPACES["standards-practices"].roles,
  },
  {
    id: IB_WORKSPACES.reports.id,
    label: IB_WORKSPACES.reports.label,
    href: IB_WORKSPACES.reports.href,
    description: IB_WORKSPACES.reports.description,
    roles: IB_WORKSPACES.reports.roles,
  },
];

export const IB_STUDENT_NAV_ITEMS: NavigationItem[] = [
  {
    id: IB_WORKSPACES["student-home"].id,
    label: IB_WORKSPACES["student-home"].label,
    href: IB_WORKSPACES["student-home"].href,
    description: IB_WORKSPACES["student-home"].description,
  },
  {
    id: IB_WORKSPACES["student-learning"].id,
    label: IB_WORKSPACES["student-learning"].label,
    href: IB_WORKSPACES["student-learning"].href,
    description: IB_WORKSPACES["student-learning"].description,
  },
  {
    id: IB_WORKSPACES["student-calendar"].id,
    label: IB_WORKSPACES["student-calendar"].label,
    href: IB_WORKSPACES["student-calendar"].href,
    description: IB_WORKSPACES["student-calendar"].description,
  },
  {
    id: IB_WORKSPACES["student-portfolio"].id,
    label: IB_WORKSPACES["student-portfolio"].label,
    href: IB_WORKSPACES["student-portfolio"].href,
    description: IB_WORKSPACES["student-portfolio"].description,
  },
  {
    id: IB_WORKSPACES["student-projects"].id,
    label: IB_WORKSPACES["student-projects"].label,
    href: IB_WORKSPACES["student-projects"].href,
    description: IB_WORKSPACES["student-projects"].description,
  },
  {
    id: IB_WORKSPACES["student-reflection"].id,
    label: IB_WORKSPACES["student-reflection"].label,
    href: IB_WORKSPACES["student-reflection"].href,
    description: IB_WORKSPACES["student-reflection"].description,
  },
  {
    id: IB_WORKSPACES["student-progress"].id,
    label: IB_WORKSPACES["student-progress"].label,
    href: IB_WORKSPACES["student-progress"].href,
    description: IB_WORKSPACES["student-progress"].description,
  },
];

export const IB_GUARDIAN_NAV_ITEMS: NavigationItem[] = [
  {
    id: IB_WORKSPACES["guardian-home"].id,
    label: IB_WORKSPACES["guardian-home"].label,
    href: IB_WORKSPACES["guardian-home"].href,
    description: IB_WORKSPACES["guardian-home"].description,
  },
  {
    id: IB_WORKSPACES["guardian-stories"].id,
    label: IB_WORKSPACES["guardian-stories"].label,
    href: IB_WORKSPACES["guardian-stories"].href,
    description: IB_WORKSPACES["guardian-stories"].description,
  },
  {
    id: IB_WORKSPACES["guardian-current-units"].id,
    label: IB_WORKSPACES["guardian-current-units"].label,
    href: IB_WORKSPACES["guardian-current-units"].href,
    description: IB_WORKSPACES["guardian-current-units"].description,
  },
  {
    id: IB_WORKSPACES["guardian-portfolio"].id,
    label: IB_WORKSPACES["guardian-portfolio"].label,
    href: IB_WORKSPACES["guardian-portfolio"].href,
    description: IB_WORKSPACES["guardian-portfolio"].description,
  },
  {
    id: IB_WORKSPACES["guardian-progress"].id,
    label: IB_WORKSPACES["guardian-progress"].label,
    href: IB_WORKSPACES["guardian-progress"].href,
    description: IB_WORKSPACES["guardian-progress"].description,
  },
  {
    id: IB_WORKSPACES["guardian-calendar"].id,
    label: IB_WORKSPACES["guardian-calendar"].label,
    href: IB_WORKSPACES["guardian-calendar"].href,
    description: IB_WORKSPACES["guardian-calendar"].description,
  },
  {
    id: IB_WORKSPACES["guardian-messages"].id,
    label: IB_WORKSPACES["guardian-messages"].label,
    href: IB_WORKSPACES["guardian-messages"].href,
    description: IB_WORKSPACES["guardian-messages"].description,
  },
];
