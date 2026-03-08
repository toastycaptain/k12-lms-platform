import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, "../../..");
export const SPEC_DIR = path.join(REPO_ROOT, "spec/ib-phase11-codex-tasks");
export const DOCS_DIR = path.join(REPO_ROOT, "docs/ib/phase11");
export const TESTS_DIR = path.join(REPO_ROOT, "tests/simulations/ib");
export const PERFORMANCE_DIR = path.join(REPO_ROOT, "tests/performance/ib");
export const ARTIFACTS_DIR = path.join(REPO_ROOT, "artifacts/phase11");
export const RUNS_DIR = path.join(ARTIFACTS_DIR, "runs");
export const LATEST_DIR = path.join(ARTIFACTS_DIR, "latest");

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function titleCaseFromSlug(slug) {
  return slug
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function taskGroup(taskId) {
  if (taskId >= 469 && taskId <= 480) return "foundations";
  if (taskId >= 481 && taskId <= 492) return "fixtures";
  if (taskId >= 493 && taskId <= 506) return "engine";
  if (taskId >= 507 && taskId <= 514) return "logging";
  if (taskId >= 515 && taskId <= 522) return "pyp_homeroom";
  if (taskId >= 523 && taskId <= 529) return "pyp_specialist";
  if (taskId >= 530 && taskId <= 535) return "pyp_coordinator";
  if (taskId >= 536 && taskId <= 543) return "myp_teacher";
  if (taskId >= 544 && taskId <= 549) return "myp_coordinator";
  if (taskId >= 550 && taskId <= 557) return "dp_teacher";
  if (taskId >= 558 && taskId <= 563) return "dp_coordinator";
  if (taskId >= 564 && taskId <= 567) return "cas_advisor";
  if (taskId >= 568 && taskId <= 571) return "ee_supervisor";
  if (taskId >= 572 && taskId <= 575) return "tok_teacher";
  if (taskId >= 576 && taskId <= 581) return "ib_director";
  if (taskId >= 582 && taskId <= 589) return "student";
  if (taskId >= 590 && taskId <= 595) return "guardian";
  if (taskId >= 596 && taskId <= 600) return "cadence";
  if (taskId >= 601 && taskId <= 604) return "load_scale";
  if (taskId >= 605 && taskId <= 608) return "ux_recovery";
  if (taskId >= 609 && taskId <= 611) return "ai";
  if (taskId === 612) return "review_loop";
  if (taskId === 613) return "audit";
  return "phase11";
}

export function readTaskFiles() {
  return fs
    .readdirSync(SPEC_DIR)
    .filter((entry) => /^\d+_/.test(entry))
    .sort((left, right) => Number(left.split("_", 1)[0]) - Number(right.split("_", 1)[0]))
    .map((entry) => {
      const [idText, ...slugParts] = entry.replace(/\.md$/, "").split("_");
      const id = Number(idText);
      const slug = slugParts.join("_");
      return {
        id,
        file: entry,
        slug,
        title: titleCaseFromSlug(slug),
        group: taskGroup(id),
        sourcePath: path.join("spec/ib-phase11-codex-tasks", entry),
      };
    });
}

export const ROLE_TAXONOMY = {
  pyp_homeroom_teacher: {
    label: "PYP Homeroom Teacher",
    authRole: "teacher",
    emailKey: "teacherEmail",
    programmeKey: "PYP",
    responsibilities: ["daily planning", "evidence capture", "family publishing"],
    deviceMix: ["desktop", "tablet"],
    permissions: ["ib.home", "ib.planning", "ib.evidence", "ib.families.publishing"],
  },
  pyp_specialist_teacher: {
    label: "PYP Specialist Teacher",
    authRole: "teacher",
    emailKey: "specialistEmail",
    programmeKey: "PYP",
    responsibilities: ["multi-class day", "quick evidence triage", "co-planning"],
    deviceMix: ["desktop", "mobile"],
    permissions: ["ib.specialist", "ib.evidence", "ib.planning"],
  },
  pyp_coordinator: {
    label: "PYP Coordinator",
    authRole: "admin",
    emailKey: "coordinatorEmail",
    programmeKey: "PYP",
    responsibilities: ["POI governance", "review queues", "family publishing health"],
    deviceMix: ["desktop"],
    permissions: ["ib.home", "ib.pyp.poi", "ib.review", "ib.operations"],
  },
  myp_subject_teacher: {
    label: "MYP Subject Teacher",
    authRole: "teacher",
    emailKey: "mypTeacherEmail",
    programmeKey: "MYP",
    responsibilities: ["unit planning", "criteria feedback", "projects"],
    deviceMix: ["desktop", "tablet"],
    permissions: ["ib.myp.unit", "ib.assessment", "ib.myp.projects"],
  },
  myp_coordinator: {
    label: "MYP Coordinator",
    authRole: "admin",
    emailKey: "coordinatorEmail",
    programmeKey: "MYP",
    responsibilities: ["coverage", "interdisciplinary approvals", "service monitoring"],
    deviceMix: ["desktop"],
    permissions: ["ib.myp.coverage", "ib.myp.review", "ib.operations"],
  },
  dp_subject_teacher: {
    label: "DP Subject Teacher",
    authRole: "teacher",
    emailKey: "dpTeacherEmail",
    programmeKey: "DP",
    responsibilities: ["course maps", "IA feedback", "predicted grades"],
    deviceMix: ["desktop", "mobile"],
    permissions: ["ib.dp.course", "ib.dp.internal-assessment", "ib.reports"],
  },
  dp_coordinator: {
    label: "DP Coordinator",
    authRole: "admin",
    emailKey: "coordinatorEmail",
    programmeKey: "DP",
    responsibilities: ["IA readiness", "core oversight", "exceptions"],
    deviceMix: ["desktop"],
    permissions: ["ib.dp.coordinator", "ib.dp.ia-risk", "ib.operations"],
  },
  cas_advisor: {
    label: "CAS Advisor",
    authRole: "teacher",
    emailKey: "casAdvisorEmail",
    programmeKey: "DP",
    responsibilities: ["experience review", "nudges", "completion exceptions"],
    deviceMix: ["desktop", "mobile"],
    permissions: ["ib.dp.core.cas", "ib.projects-core", "ib.review"],
  },
  ee_supervisor: {
    label: "EE Supervisor",
    authRole: "teacher",
    emailKey: "eeSupervisorEmail",
    programmeKey: "DP",
    responsibilities: ["meeting logging", "draft review", "risk escalation"],
    deviceMix: ["desktop"],
    permissions: ["ib.dp.core.ee", "ib.projects-core"],
  },
  tok_teacher: {
    label: "TOK Teacher",
    authRole: "teacher",
    emailKey: "tokTeacherEmail",
    programmeKey: "DP",
    responsibilities: ["essay and exhibition", "feedback", "deadline handling"],
    deviceMix: ["desktop"],
    permissions: ["ib.dp.core.tok", "ib.projects-core"],
  },
  ib_director: {
    label: "School Administrator / IB Director",
    authRole: "admin",
    emailKey: "directorEmail",
    programmeKey: "Mixed",
    responsibilities: ["global programme health", "accreditation readiness", "governance recovery"],
    deviceMix: ["desktop"],
    permissions: ["ib.home", "ib.operations", "ib.readiness", "ib.rollout"],
  },
  primary_student: {
    label: "Primary Student",
    authRole: "student",
    emailKey: "primaryStudentEmail",
    programmeKey: "PYP",
    responsibilities: ["daily journey", "reflection", "portfolio submission"],
    deviceMix: ["tablet", "mobile"],
    permissions: ["ib.student.home", "ib.student.portfolio"],
  },
  middle_years_student: {
    label: "Middle Years Student",
    authRole: "student",
    emailKey: "middleYearsStudentEmail",
    programmeKey: "MYP",
    responsibilities: ["project journey", "criteria reflection"],
    deviceMix: ["laptop", "mobile"],
    permissions: ["ib.student.projects", "ib.student.progress"],
  },
  diploma_student: {
    label: "Diploma Student",
    authRole: "student",
    emailKey: "diplomaStudentEmail",
    programmeKey: "DP",
    responsibilities: ["IA and core dashboard", "submission cycles"],
    deviceMix: ["laptop", "mobile"],
    permissions: ["ib.student.projects", "ib.student.progress", "ib.student.calendar"],
  },
  guardian: {
    label: "Guardian / Family",
    authRole: "guardian",
    emailKey: "guardianEmail",
    programmeKey: "Guardian",
    responsibilities: ["digest", "progress acknowledgement", "conference prep"],
    deviceMix: ["mobile", "desktop"],
    permissions: ["ib.guardian.home", "ib.guardian.progress", "ib.guardian.calendar"],
  },
  guardian_multichild: {
    label: "Guardian / Multi-child Household",
    authRole: "guardian",
    emailKey: "guardianMultiChildEmail",
    programmeKey: "Guardian",
    responsibilities: ["multi-child feed", "calm communication", "mobile-only access"],
    deviceMix: ["mobile"],
    permissions: ["ib.guardian.home", "ib.guardian.messages", "ib.guardian.stories"],
  },
};

export const FOUNDATION_CONFIG = {
  charter: {
    inScope: [
      "role-based browser simulations",
      "deterministic seed fixtures",
      "cadence suites",
      "load and UX benchmarks",
      "AI assistance validation",
      "Codex-readable artifacts",
    ],
    outOfScope: [
      "shipping Phase 12 optimizations",
      "replacing the agreed Playwright plus k6 toolchain",
      "using production or real student data",
    ],
    successCriteria: {
      roleCoverageCount: Object.keys(ROLE_TAXONOMY).length,
      cadenceSuites: ["daily", "weekly", "term", "annual", "monte_carlo"],
      requiredOutputs: [
        "manifest.json",
        "events.ndjson",
        "summary.json",
        "summary.md",
        "failure-packets",
        "recommendations",
      ],
    },
  },
  naming: {
    runIdPattern: "phase11-<suite>-<yyyymmddThhmmssZ>",
    scenarioIdPattern: "<taskId>-<slug>",
    artifactKeyPattern: "<runId>/<scenarioId>/<artifactKind>",
    taskSummaryPattern: "task-<taskId>.md",
  },
  academicCalendar: {
    timezone: "America/Chicago",
    schoolYear: "2025-2026",
    terms: [
      { key: "term1", label: "Fall Term", startsOn: "2025-08-18", endsOn: "2025-12-19" },
      { key: "term2", label: "Spring Term", startsOn: "2026-01-06", endsOn: "2026-06-05" },
    ],
    milestones: [
      { key: "pyp_exhibition", window: "2026-04-06/2026-04-24" },
      { key: "myp_projects", window: "2026-03-02/2026-05-15" },
      { key: "dp_submission", window: "2026-02-09/2026-04-30" },
    ],
    timetable: {
      homeroom: ["08:00 planning", "09:00 inquiry", "11:00 evidence", "14:00 reflection"],
      specialist: ["08:15 class A", "09:10 class B", "10:45 triage", "13:30 handoff"],
      coordinator: ["08:00 dashboard", "10:30 review", "13:00 POI or coverage", "15:00 escalation"],
    },
  },
  yearSectionModel: {
    pyp: ["K", "1", "2", "3", "4", "5"],
    myp: ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"],
    dp: ["Year 1", "Year 2"],
    crossProgrammeLinks: ["guardian households", "school-wide calendar", "reporting cycles"],
  },
  environments: {
    local: {
      headless: false,
      seedVolume: "minimal",
      browserWorkers: 1,
      k6Scale: "reduced",
      runtimeBudgetMinutes: 20,
    },
    ci: {
      headless: true,
      seedVolume: "representative",
      browserWorkers: 2,
      k6Scale: "smoke",
      runtimeBudgetMinutes: 25,
    },
    staging: {
      headless: true,
      seedVolume: "large",
      browserWorkers: 4,
      k6Scale: "representative",
      runtimeBudgetMinutes: 45,
    },
  },
  privacy: {
    syntheticOnly: true,
    reservedEmailDomains: ["@e2e.local", "@phase11.local"],
    redactions: ["email", "phone", "household address", "free-text PII"],
    screenshotPolicy: "failure-only by default, sanitized summaries always retained",
  },
  benchmarks: {
    unitCreateMs: 45000,
    evidenceCaptureMs: 20000,
    reportReviewMs: 35000,
    publishingQueueMs: 20000,
    searchP95Ms: 800,
    mobileQuickActionMs: 12000,
    aiReviewMs: 30000,
    clickDepthTargets: {
      teacher_home_resume: 2,
      specialist_capture: 3,
      guardian_digest: 1,
      coordinator_exception_triage: 3,
    },
    competitorThresholds: {
      toddle: "equal or better on publishing, evidence, and POI clarity",
      managebac: "equal or better on DP milestone oversight and reporting calmness",
    },
  },
  failureTaxonomy: [
    { key: "functional_breakage", severity: "critical", description: "User cannot complete the workflow." },
    { key: "permission_mismatch", severity: "high", description: "Role fit or access boundary is wrong." },
    { key: "performance_regression", severity: "high", description: "Workflow exceeds stated speed budget." },
    { key: "data_integrity_gap", severity: "high", description: "State or counts become inconsistent." },
    { key: "ux_confusion", severity: "medium", description: "The route works but causes avoidable hesitation." },
    { key: "resilience_gap", severity: "medium", description: "Recovery from offline or retry conditions is weak." },
    { key: "ai_guardrail_gap", severity: "medium", description: "AI suggestion path is insufficiently reviewable." },
  ],
  changeManagement: {
    branchConvention: "phase11/<stream>",
    commitDiscipline: "small grouped commits by task family; generated artifacts rebuilt in the same change",
    retention: "latest plus run-specific durable samples are committed only as reference artifacts",
  },
};

export const FIXTURE_CONFIG = {
  schoolProfiles: {
    minimal: {
      label: "Single-school deterministic IB slice",
      programmes: ["PYP", "MYP", "DP"],
      users: 16,
      planningContexts: 6,
      evidenceItems: 24,
      reports: 8,
      queueItems: 10,
    },
    representative: {
      label: "Representative pilot school",
      programmes: ["PYP", "MYP", "DP"],
      users: 64,
      planningContexts: 18,
      evidenceItems: 200,
      reports: 48,
      queueItems: 72,
    },
    large: {
      label: "Large multi-programme scale school",
      programmes: ["PYP", "MYP", "DP"],
      users: 240,
      planningContexts: 42,
      evidenceItems: 2000,
      reports: 380,
      queueItems: 420,
    },
  },
  programmeSeeds: {
    pyp: {
      units: ["Water systems", "Identity and expression", "How the world works"],
      poiThemes: 6,
      exhibitionWindows: 1,
      familyStories: 18,
    },
    myp: {
      units: ["Sustainable design", "Patterns and change", "Power and systems"],
      interdisciplinaryUnits: 2,
      serviceEntries: 12,
      projectRecords: 10,
    },
    dp: {
      courseMaps: ["Biology", "History", "English A"],
      iaRecords: 18,
      eeRecords: 8,
      tokRecords: 12,
      casRecords: 24,
    },
  },
  adultPersonas: {
    teacher: { workloadProfile: "steady-planning", notificationMode: "digest-first", device: "laptop" },
    specialist: { workloadProfile: "rapid-context-switching", notificationMode: "mobile-priority", device: "phone" },
    coordinator: { workloadProfile: "oversight-and-escalation", notificationMode: "queue-focused", device: "desktop" },
    director: { workloadProfile: "cross-programme governance", notificationMode: "summary-first", device: "desktop" },
  },
  learnerPersonas: {
    primary: { reflectionCadence: "daily", device: "tablet", guardianLinked: true },
    middle_years: { reflectionCadence: "weekly", device: "laptop", guardianLinked: true },
    diploma: { reflectionCadence: "milestone", device: "laptop", guardianLinked: true },
  },
  guardianPersonas: {
    standard: { locale: "en", digestCadence: "weekly_digest", householdSize: 1 },
    multilingual: { locale: "es", digestCadence: "weekly_digest", householdSize: 1 },
    multichild: { locale: "en", digestCadence: "fortnightly", householdSize: 2 },
  },
  artifactFactories: {
    evidence: ["validated", "pending_review", "guardian_visible"],
    stories: ["draft", "ready_for_digest", "published"],
    reports: ["draft", "signed_off", "released"],
    operationalQueues: ["review", "publishing", "migration", "exceptions"],
  },
  migrations: {
    toddle: { connectors: ["curriculum", "poi", "stories"], failureModes: ["mapping_gap", "relationship_missing"] },
    managebac: { connectors: ["dp_core", "reporting", "ia"], failureModes: ["date_conflict", "record_duplication"] },
  },
  searchScale: {
    unitDocuments: 1200,
    evidenceItems: 4000,
    comments: 2400,
    stories: 900,
    reports: 600,
    operationalRecords: 850,
  },
};

function browserScenario(taskId, roleKey, programmeKey, cadence, routePath, heading, keywords, extras = {}) {
  const task = readTaskFiles().find((entry) => entry.id === taskId);
  const title = task ? task.title : `Task ${taskId}`;
  return {
    taskId,
    scenarioId: `${taskId}-${slugify(title)}`,
    title,
    roleKey,
    programmeKey,
    cadence,
    routePath,
    heading,
    keywords,
    surface: extras.surface || "browser",
    tags: extras.tags || [roleKey, programmeKey.toLowerCase(), cadence],
    mobile: Boolean(extras.mobile),
    aiAssisted: Boolean(extras.aiAssisted),
    recoveryFocus: Boolean(extras.recoveryFocus),
    benchmarkKey: extras.benchmarkKey || null,
    frictionBudget: extras.frictionBudget || { clicks: 4, routeChanges: 2, modals: 1 },
    checkpoints: extras.checkpoints || keywords.map((keyword) => ({ type: "text", value: keyword })),
  };
}

const SCENARIO_DEFINITIONS = [
  browserScenario(515, "pyp_homeroom_teacher", "PYP", "daily", "/ib/home", "Teacher action console", ["Quick actions", "Resume work"], { benchmarkKey: "teacher_home_resume" }),
  browserScenario(516, "pyp_homeroom_teacher", "PYP", "weekly", "/ib/learning", "Learning workspace", ["Weekly flow", "Student learning stream preview"]),
  browserScenario(517, "pyp_homeroom_teacher", "PYP", "weekly", "/ib/evidence", "Evidence inbox", ["Evidence queue", "Queue discipline"]),
  browserScenario(518, "pyp_homeroom_teacher", "PYP", "weekly", "/ib/families/publishing", "Family publishing queue", ["Publishing queue", "Publishing quick actions"]),
  browserScenario(519, "pyp_homeroom_teacher", "PYP", "weekly", "/ib/planning/collaboration", "Live collaboration", ["Discussion thread", "Live collaboration"]),
  browserScenario(520, "pyp_homeroom_teacher", "PYP", "term", "/ib/reports", "IB reports", ["Generated reports", "Release workflow"]),
  browserScenario(521, "pyp_homeroom_teacher", "PYP", "term", "/ib/reports", "IB reports", ["Localization and archive", "Proofing queue and locales"]),
  browserScenario(522, "pyp_homeroom_teacher", "PYP", "daily", "/ib/review", "Approval and review queue", ["Returned context", "Review quick actions"], { recoveryFocus: true }),

  browserScenario(523, "pyp_specialist_teacher", "PYP", "daily", "/ib/specialist", "Specialist dashboard", ["Where you are needed this week", "Requested contributions"]),
  browserScenario(524, "pyp_specialist_teacher", "PYP", "weekly", "/ib/specialist", "Specialist dashboard", ["Pending handoffs", "Assigned units"]),
  browserScenario(525, "pyp_specialist_teacher", "PYP", "daily", "/ib/evidence", "Evidence inbox", ["Evidence queue", "Queue filters"], { benchmarkKey: "specialist_capture" }),
  browserScenario(526, "pyp_specialist_teacher", "PYP", "weekly", "/ib/planning/collaboration", "Live collaboration", ["Discussion thread", "Live collaboration"]),
  browserScenario(527, "pyp_specialist_teacher", "PYP", "weekly", "/ib/specialist", "Specialist dashboard", ["Specialist quick hits", "Evidence to sort"]),
  browserScenario(528, "pyp_specialist_teacher", "PYP", "daily", "/ib/evidence", "Evidence inbox", ["Mobile evidence capture", "Reflection review"], { mobile: true }),
  browserScenario(529, "pyp_specialist_teacher", "PYP", "daily", "/ib/review", "Approval and review queue", ["Queue", "Returned context"], { recoveryFocus: true }),

  browserScenario(530, "pyp_coordinator", "PYP", "weekly", "/ib/pyp/poi", "Programme of inquiry", ["Programme of inquiry", "Continuum map"]),
  browserScenario(531, "pyp_coordinator", "PYP", "weekly", "/ib/review", "Approval and review queue", ["Queue", "Review quick actions"]),
  browserScenario(532, "pyp_coordinator", "PYP", "weekly", "/ib/standards-practices", "Standards and Practices evidence center", ["Packet completeness", "Active cycle"]),
  browserScenario(533, "pyp_coordinator", "PYP", "annual", "/ib/pyp/exhibition", "PYP exhibition workspace", ["Family window", "PYP exhibition workspace"]),
  browserScenario(534, "pyp_coordinator", "PYP", "weekly", "/ib/families/publishing", "Family publishing queue", ["Queue states", "Publishing quick actions"]),
  browserScenario(535, "pyp_coordinator", "PYP", "daily", "/ib/reports/exceptions", "Exception reports", ["Prioritized findings", "Report discipline"], { recoveryFocus: true, benchmarkKey: "coordinator_exception_triage" }),

  browserScenario(536, "myp_subject_teacher", "MYP", "daily", "/ib/myp/units/new", "Create MYP unit", ["Create MYP unit"]),
  browserScenario(537, "myp_subject_teacher", "MYP", "weekly", "/ib/assessment", "Assessment workspace", ["Criteria planning", "DP assessment dashboard"]),
  browserScenario(538, "myp_subject_teacher", "MYP", "weekly", "/ib/reports", "IB reports", ["Generated reports", "Release workflow"]),
  browserScenario(539, "myp_subject_teacher", "MYP", "weekly", "/ib/planning/collaboration", "Live collaboration", ["Live collaboration", "Discussion thread"]),
  browserScenario(540, "myp_subject_teacher", "MYP", "weekly", "/ib/myp/projects", "MYP projects", ["Projects hub", "MYP projects"]),
  browserScenario(541, "myp_subject_teacher", "MYP", "weekly", "/ib/evidence", "Evidence inbox", ["Evidence queue", "Queue discipline"]),
  browserScenario(542, "myp_subject_teacher", "MYP", "term", "/ib/reports", "IB reports", ["Delivery log", "Release workflow"]),
  browserScenario(543, "myp_subject_teacher", "MYP", "daily", "/ib/home", "Teacher action console", ["Workflow benchmark snapshot", "Teacher-speed benchmark refresh"], { recoveryFocus: true }),

  browserScenario(544, "myp_coordinator", "MYP", "weekly", "/ib/myp/coverage", "MYP coverage", ["Subject-unit coverage", "Project and service risk"]),
  browserScenario(545, "myp_coordinator", "MYP", "weekly", "/ib/myp/review", "MYP review", ["Document review", "Projects and service"]),
  browserScenario(546, "myp_coordinator", "MYP", "weekly", "/ib/standards-practices", "Standards and Practices evidence center", ["Evidence board", "Packet completeness"]),
  browserScenario(547, "myp_coordinator", "MYP", "annual", "/ib/myp/projects", "MYP projects", ["Projects hub", "MYP projects"]),
  browserScenario(548, "myp_coordinator", "MYP", "weekly", "/ib/myp/service", "Service as action", ["Service queue", "Service as action"]),
  browserScenario(549, "myp_coordinator", "MYP", "daily", "/ib/reports/exceptions", "Exception reports", ["Prioritized findings", "Report discipline"], { recoveryFocus: true }),

  browserScenario(550, "dp_subject_teacher", "DP", "daily", "/ib/dp/courses/new", "Create DP course map", ["Create DP course map"]),
  browserScenario(551, "dp_subject_teacher", "DP", "weekly", "/ib/dp/core", "DP core overview", ["EE supervision", "TOK workspace", "CAS workspace"]),
  browserScenario(552, "dp_subject_teacher", "DP", "weekly", "/ib/planning/collaboration", "Live collaboration", ["Live collaboration", "Discussion thread"]),
  browserScenario(553, "dp_subject_teacher", "DP", "term", "/ib/dp/assessment/ia-risk", "DP IA risk", ["Readiness by subject", "Student milestone tracker"]),
  browserScenario(554, "dp_subject_teacher", "DP", "term", "/ib/reports", "IB reports", ["Generated reports", "Delivery log"]),
  browserScenario(555, "dp_subject_teacher", "DP", "daily", "/ib/evidence", "Evidence inbox", ["Mobile evidence capture", "Reflection review"], { mobile: true, benchmarkKey: "mobileQuickActionMs" }),
  browserScenario(556, "dp_subject_teacher", "DP", "weekly", "/ib/student/progress", "Progress", ["Released reports", "Communication preferences"]),
  browserScenario(557, "dp_subject_teacher", "DP", "daily", "/ib/review", "Approval and review queue", ["Queue", "Returned context"], { recoveryFocus: true }),

  browserScenario(558, "dp_coordinator", "DP", "weekly", "/ib/dp/coordinator", "DP coordinator", ["Coordinator risk console", "DP coordinator"]),
  browserScenario(559, "dp_coordinator", "DP", "annual", "/ib/projects-core", "Projects and core", ["MYP projects hub", "DP core follow-up"]),
  browserScenario(560, "dp_coordinator", "DP", "term", "/ib/dp/assessment/ia-risk", "DP IA risk", ["Readiness by subject", "Student milestone tracker"]),
  browserScenario(561, "dp_coordinator", "DP", "weekly", "/ib/review", "Approval and review queue", ["Queue", "Review quick actions"]),
  browserScenario(562, "dp_coordinator", "DP", "weekly", "/ib/reports", "IB reports", ["Delivery log", "Release workflow"]),
  browserScenario(563, "dp_coordinator", "DP", "daily", "/ib/reports/exceptions", "Exception reports", ["Prioritized findings", "Report discipline"], { recoveryFocus: true }),

  browserScenario(564, "cas_advisor", "DP", "weekly", "/ib/projects-core/dp/cas", "CAS workspace", ["CAS flow", "CAS workspace"]),
  browserScenario(565, "cas_advisor", "DP", "annual", "/ib/dp/core/cas", "CAS", ["CAS workspace", "CAS"]),
  browserScenario(566, "cas_advisor", "DP", "weekly", "/ib/student/projects", "Student projects and core", ["Projects hub", "DP core follow-up"]),
  browserScenario(567, "cas_advisor", "DP", "daily", "/ib/review", "Approval and review queue", ["Queue", "Returned context"], { recoveryFocus: true }),

  browserScenario(568, "ee_supervisor", "DP", "weekly", "/ib/projects-core/dp/ee", "Extended Essay supervision", ["Supervisor workflow", "Extended Essay supervision"]),
  browserScenario(569, "ee_supervisor", "DP", "weekly", "/ib/dp/core/ee", "Extended Essay", ["EE supervision", "Extended Essay"]),
  browserScenario(570, "ee_supervisor", "DP", "term", "/ib/dp/coordinator", "DP coordinator", ["Coordinator risk console", "DP coordinator"]),
  browserScenario(571, "ee_supervisor", "DP", "annual", "/ib/reports", "IB reports", ["Localization and archive", "Release workflow"]),

  browserScenario(572, "tok_teacher", "DP", "weekly", "/ib/projects-core/dp/tok", "TOK workspace", ["TOK planning and review", "TOK workspace"]),
  browserScenario(573, "tok_teacher", "DP", "weekly", "/ib/dp/core/tok", "TOK", ["TOK workspace", "TOK"]),
  browserScenario(574, "tok_teacher", "DP", "term", "/ib/reports", "IB reports", ["Generated reports", "Proofing queue and locales"]),
  browserScenario(575, "tok_teacher", "DP", "daily", "/ib/review", "Approval and review queue", ["Queue", "Returned context"], { recoveryFocus: true }),

  browserScenario(576, "ib_director", "Mixed", "daily", "/ib/home", "Coordinator overview", ["Operations center", "Review queue"]),
  browserScenario(577, "ib_director", "Mixed", "weekly", "/ib/standards-practices", "Standards and Practices evidence center", ["Evidence board", "Active cycle"]),
  browserScenario(578, "ib_director", "Mixed", "weekly", "/ib/operations", "Programme operations center", ["Operational drilldown matrix", "SLA watch"]),
  browserScenario(579, "ib_director", "Mixed", "annual", "/ib/readiness", "Pilot readiness", ["Pilot readiness", "Operational note"]),
  browserScenario(580, "ib_director", "Mixed", "weekly", "/ib/rollout", "Rollout console", ["GA baseline", "Required flags"]),
  browserScenario(581, "ib_director", "Mixed", "daily", "/ib/reports/exceptions", "Exception reports", ["Prioritized findings", "Report discipline"], { recoveryFocus: true }),

  browserScenario(582, "primary_student", "PYP", "daily", "/ib/student/home", "Student home", ["Unified learning timeline", "Communication preferences"]),
  browserScenario(583, "primary_student", "PYP", "weekly", "/ib/student/portfolio", "Portfolio", ["Portfolio search and collections", "Portfolio"]),
  browserScenario(584, "primary_student", "PYP", "weekly", "/ib/guardian/stories", "Published learning stories", ["Published learning stories", "Portfolio"]),
  browserScenario(585, "middle_years_student", "MYP", "daily", "/ib/student/projects", "Student projects and core", ["Projects hub", "DP core follow-up"]),
  browserScenario(586, "middle_years_student", "MYP", "weekly", "/ib/student/progress", "Progress", ["Released reports", "Student trust policy"]),
  browserScenario(587, "diploma_student", "DP", "daily", "/ib/student/home", "Student home", ["Unified learning timeline", "Released reports"]),
  browserScenario(588, "diploma_student", "DP", "term", "/ib/student/calendar", "Student calendar", ["Upcoming", "Student calendar"]),
  browserScenario(589, "diploma_student", "DP", "daily", "/ib/student/home", "Student home", ["Communication preferences", "Calm notifications"], { mobile: true, recoveryFocus: true }),

  browserScenario(590, "guardian", "Guardian", "daily", "/ib/guardian/home", "Family home", ["Upcoming milestones", "Calendar digest"], { benchmarkKey: "guardian_digest" }),
  browserScenario(591, "guardian", "Guardian", "term", "/ib/guardian/progress", "Guardian progress", ["Progress summary", "Guardian progress"]),
  browserScenario(592, "guardian", "Guardian", "weekly", "/ib/guardian/home", "Family home", ["Family interactions", "Released reports"]),
  browserScenario(593, "guardian", "Guardian", "weekly", "/ib/guardian/messages", "Guardian messages", ["Message rhythm", "digest-oriented"]),
  browserScenario(594, "guardian_multichild", "Guardian", "weekly", "/ib/guardian/home", "Family home", ["Upcoming milestones", "Communication preferences"]),
  browserScenario(595, "guardian_multichild", "Guardian", "daily", "/ib/guardian/home", "Family home", ["Calendar digest", "Family interactions"], { mobile: true }),
];

export const BROWSER_SCENARIOS = SCENARIO_DEFINITIONS;

function scenarioIdsFor(filter) {
  return BROWSER_SCENARIOS.filter(filter).map((scenario) => scenario.scenarioId);
}

export const SUITE_DEFINITIONS = [
  {
    taskId: 596,
    suiteId: "daily-operations",
    title: "Daily Simulation Suite Orchestration",
    suiteType: "cadence",
    scenarioIds: scenarioIdsFor((scenario) => scenario.cadence === "daily"),
    executionMode: "playwright",
    parallelism: 2,
    sharedStateRule: "single deterministic seed world per run",
  },
  {
    taskId: 597,
    suiteId: "weekly-operations",
    title: "Weekly Simulation Suite Orchestration",
    suiteType: "cadence",
    scenarioIds: scenarioIdsFor((scenario) => scenario.cadence === "weekly"),
    executionMode: "playwright",
    parallelism: 2,
    sharedStateRule: "weekly seed snapshot with coordinator and family summaries",
  },
  {
    taskId: 598,
    suiteId: "term-operations",
    title: "Term Simulation Suite Orchestration",
    suiteType: "cadence",
    scenarioIds: scenarioIdsFor((scenario) => scenario.cadence === "term"),
    executionMode: "playwright",
    parallelism: 1,
    sharedStateRule: "term reporting and milestone state advanced in phases",
  },
  {
    taskId: 599,
    suiteId: "annual-operations",
    title: "Annual Simulation Suite Orchestration",
    suiteType: "cadence",
    scenarioIds: scenarioIdsFor((scenario) => scenario.cadence === "annual"),
    executionMode: "playwright",
    parallelism: 1,
    sharedStateRule: "annual milestone windows sequenced by simulated calendar",
  },
  {
    taskId: 600,
    suiteId: "monte-carlo-school-year",
    title: "Full School Year Monte Carlo Variation Runs",
    suiteType: "cadence",
    scenarioIds: BROWSER_SCENARIOS.map((scenario) => scenario.scenarioId),
    executionMode: "sample",
    parallelism: 4,
    sharedStateRule: "variation set is reproducible from the runId hash",
    variations: ["timing_jitter", "queue_pressure", "network_flakiness", "guardian_locale_mix"],
  },
  {
    taskId: 601,
    suiteId: "load-evidence-publishing",
    title: "Load Test High Volume Evidence And Publishing",
    suiteType: "k6",
    script: "tests/performance/ib/evidence-publishing.js",
    scenarioIds: scenarioIdsFor((scenario) => [517, 518, 525].includes(scenario.taskId)),
    thresholds: { http_req_failed: "rate<0.02", http_req_duration_p95: "p(95)<900" },
  },
  {
    taskId: 602,
    suiteId: "load-reporting-search-queue",
    title: "Load Test Reporting Search And Queue Pressure",
    suiteType: "k6",
    script: "tests/performance/ib/reporting-search-queue.js",
    scenarioIds: scenarioIdsFor((scenario) => [520, 521, 542, 554, 598].includes(scenario.taskId)),
    thresholds: { http_req_failed: "rate<0.02", http_req_duration_p95: "p(95)<1000" },
  },
  {
    taskId: 603,
    suiteId: "load-realtime-collaboration",
    title: "Load Test Realtime Collaboration And Presence",
    suiteType: "k6",
    script: "tests/performance/ib/realtime-collaboration.js",
    scenarioIds: scenarioIdsFor((scenario) => [519, 526, 539, 552].includes(scenario.taskId)),
    thresholds: { http_req_failed: "rate<0.03", http_req_duration_p95: "p(95)<1100" },
  },
  {
    taskId: 604,
    suiteId: "scale-large-school",
    title: "Scale Test Large School Multi Programme Model",
    suiteType: "k6",
    script: "tests/performance/ib/large-school-scale.js",
    scenarioIds: BROWSER_SCENARIOS.filter((scenario) => ["PYP", "MYP", "DP", "Mixed"].includes(scenario.programmeKey)).map((scenario) => scenario.scenarioId),
    thresholds: { http_req_failed: "rate<0.02", http_req_duration_p95: "p(95)<1200" },
  },
  {
    taskId: 605,
    suiteId: "ux-click-depth-time-on-task",
    title: "UX Friction Benchmark Click Depth And Time On Task",
    suiteType: "ux",
    scenarioIds: scenarioIdsFor((scenario) => [515, 523, 530, 536, 550, 590].includes(scenario.taskId)),
    metrics: ["time_on_task_ms", "click_depth", "route_changes", "modal_count"],
  },
  {
    taskId: 606,
    suiteId: "ux-heavy-days",
    title: "UX Friction Specialist And Coordinator Heavy Days",
    suiteType: "ux",
    scenarioIds: scenarioIdsFor((scenario) => [524, 529, 535, 549, 563, 578].includes(scenario.taskId)),
    metrics: ["time_on_task_ms", "recoveries", "queue_hops", "overlays_opened"],
  },
  {
    taskId: 607,
    suiteId: "competitive-parity",
    title: "Competitive Parity Checklist Toddle And Managebac",
    suiteType: "ux",
    scenarioIds: scenarioIdsFor((scenario) => [518, 530, 559, 560, 590].includes(scenario.taskId)),
    parityTargets: ["toddle", "managebac"],
  },
  {
    taskId: 608,
    suiteId: "user-recovery-and-supportability",
    title: "User Recovery From Failure States And Supportability",
    suiteType: "ux",
    scenarioIds: BROWSER_SCENARIOS.filter((scenario) => scenario.recoveryFocus).map((scenario) => scenario.scenarioId),
    metrics: ["recoveries", "support_steps", "user_confidence_delta"],
  },
  {
    taskId: 609,
    suiteId: "ai-statement-summary-review",
    title: "Ai Assist Statement Summary And Diff Review",
    suiteType: "ai",
    scenarioIds: scenarioIdsFor((scenario) => [520, 538, 609].includes(scenario.taskId)),
    aiWorkflow: "statement_summary",
  },
  {
    taskId: 610,
    suiteId: "ai-family-translation-proofing",
    title: "Ai Assist Family Summary Translation And Proofing",
    suiteType: "ai",
    scenarioIds: scenarioIdsFor((scenario) => [518, 593, 610].includes(scenario.taskId)),
    aiWorkflow: "family_translation",
  },
  {
    taskId: 611,
    suiteId: "ai-coverage-gap-risk-suggestions",
    title: "Ai Assist Coverage Gap Detection And Risk Suggestions",
    suiteType: "ai",
    scenarioIds: scenarioIdsFor((scenario) => [532, 546, 560, 611].includes(scenario.taskId)),
    aiWorkflow: "coverage_gap_detection",
  },
  {
    taskId: 612,
    suiteId: "codex-review-loop",
    title: "Codex Review Loop Architecture Recommendations And Phase12 Signal",
    suiteType: "review",
    inputs: [
      "summary.json",
      "events.ndjson",
      "failure-packets",
      "recommendations",
      "load",
      "server/telemetry.json",
    ],
  },
];

export const LOAD_ENDPOINTS = [
  { name: "home", path: "/api/v1/ib/home", method: "GET", roleKey: "pyp_homeroom_teacher" },
  { name: "evidence_items", path: "/api/v1/ib/evidence_items", method: "GET", roleKey: "pyp_specialist_teacher" },
  { name: "publishing_queue", path: "/api/v1/ib/publishing_queue_items", method: "GET", roleKey: "pyp_homeroom_teacher" },
  { name: "reports", path: "/api/v1/ib/reports", method: "GET", roleKey: "dp_subject_teacher" },
  { name: "search", path: "/api/v1/ib/search?q=reflection", method: "GET", roleKey: "ib_director" },
  { name: "operations", path: "/api/v1/ib/operations", method: "GET", roleKey: "ib_director" },
  { name: "collaboration_workbench", path: "/api/v1/ib/collaboration_workbench", method: "GET", roleKey: "myp_subject_teacher" },
  { name: "guardian_home", path: "/api/v1/ib/guardian", method: "GET", roleKey: "guardian" },
  { name: "student_home", path: "/api/v1/ib/student", method: "GET", roleKey: "diploma_student" },
];

export const ANOMALY_INJECTIONS = {
  "load-realtime-collaboration": {
    severity: "high",
    category: "performance_regression",
    note: "Presence and collaboration workbench latency exceeded the shared p95 threshold under concurrent load.",
  },
  "competitive-parity": {
    severity: "medium",
    category: "ux_confusion",
    note: "Publishing and coordinator exception paths still require more route changes than the parity target.",
  },
  "ai-family-translation-proofing": {
    severity: "medium",
    category: "ai_guardrail_gap",
    note: "One family translation suggestion required full rejection because tone drifted away from calm-mode expectations.",
  },
};

export function getPhase11Catalog() {
  const taskFiles = readTaskFiles();
  return {
    taskFiles,
    roleTaxonomy: ROLE_TAXONOMY,
    foundations: FOUNDATION_CONFIG,
    fixtures: FIXTURE_CONFIG,
    browserScenarios: BROWSER_SCENARIOS,
    suites: SUITE_DEFINITIONS,
    loadEndpoints: LOAD_ENDPOINTS,
    anomalies: ANOMALY_INJECTIONS,
  };
}
