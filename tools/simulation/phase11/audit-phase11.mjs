import fs from "node:fs";
import path from "node:path";
import {
  ARTIFACTS_DIR,
  BROWSER_SCENARIOS,
  DOCS_DIR,
  PERFORMANCE_DIR,
  ROLE_TAXONOMY,
  SUITE_DEFINITIONS,
  TESTS_DIR,
  readTaskFiles,
} from "./catalog.mjs";

const requiredDocs = [
  "README.md",
  "charter-and-foundations.md",
  "fixtures-and-personas.md",
  "engine-and-observability.md",
  "role-scenarios.md",
  "cadence-load-ai-review.md",
  "coverage-audit.md",
];

const requiredArtifactFiles = [
  "manifest.json",
  "events.ndjson",
  "summary.json",
  "summary.md",
  "server/telemetry.json",
  "load/summary.json",
  "recommendations/recommendations.json",
  "recommendations/recommendations.md",
];

const requiredPerformanceScripts = [
  "evidence-publishing.js",
  "reporting-search-queue.js",
  "realtime-collaboration.js",
  "large-school-scale.js",
];

function exists(relativePath, rootDir) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

function main() {
  const taskFiles = readTaskFiles();
  const implementationTasks = taskFiles.filter((task) => task.id >= 469 && task.id <= 612);
  const audit = {
    taskCoverage: {
      expectedImplementationTaskCount: 144,
      actualImplementationTaskCount: implementationTasks.length,
      implementationTaskIds: implementationTasks.map((task) => task.id),
      auditTaskPresent: taskFiles.some((task) => task.id === 613),
      orchestrationPromptPresent: taskFiles.some((task) => task.id === 614),
    },
    roleCoverage: Object.values(ROLE_TAXONOMY).map((role) => role.label),
    scenarioCoverage: {
      expectedRoleScenarioCount: 81,
      actualRoleScenarioCount: BROWSER_SCENARIOS.length,
      programmes: [...new Set(BROWSER_SCENARIOS.map((scenario) => scenario.programmeKey))],
      cadences: [...new Set(BROWSER_SCENARIOS.map((scenario) => scenario.cadence))],
    },
    suiteCoverage: {
      expectedSuiteCount: 17,
      actualSuiteCount: SUITE_DEFINITIONS.length,
      suiteIds: SUITE_DEFINITIONS.map((suite) => suite.suiteId),
    },
    files: {
      docs: requiredDocs.map((file) => ({ file, present: exists(file, DOCS_DIR) })),
      performanceScripts: requiredPerformanceScripts.map((file) => ({ file, present: exists(file, PERFORMANCE_DIR) })),
      catalogs: [
        "foundations/foundations.json",
        "fixtures/fixtures.json",
        "scenarios/catalog.json",
        "manifests/suite-catalog.json",
        "tasks/catalog.json",
      ].map((file) => ({ file, present: exists(file, TESTS_DIR) })),
      latestArtifacts: requiredArtifactFiles.map((file) => ({ file, present: exists(path.join("latest", file), ARTIFACTS_DIR) })),
    },
  };

  const allChecksPass = [
    audit.taskCoverage.actualImplementationTaskCount === audit.taskCoverage.expectedImplementationTaskCount,
    audit.taskCoverage.auditTaskPresent,
    audit.taskCoverage.orchestrationPromptPresent,
    audit.scenarioCoverage.actualRoleScenarioCount === audit.scenarioCoverage.expectedRoleScenarioCount,
    audit.suiteCoverage.actualSuiteCount === audit.suiteCoverage.expectedSuiteCount,
    ...audit.files.docs.map((entry) => entry.present),
    ...audit.files.performanceScripts.map((entry) => entry.present),
    ...audit.files.catalogs.map((entry) => entry.present),
    ...audit.files.latestArtifacts.map((entry) => entry.present),
  ].every(Boolean);

  console.log(JSON.stringify({ ok: allChecksPass, audit }, null, 2));
  process.exit(allChecksPass ? 0 : 1);
}

main();
