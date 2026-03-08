import test from "node:test";
import assert from "node:assert/strict";
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

test("phase11 task pack is fully indexed", () => {
  const tasks = readTaskFiles();
  const implementationTaskIds = tasks.filter((task) => task.id >= 469 && task.id <= 612).map((task) => task.id);
  assert.equal(implementationTaskIds.length, 144);
  assert.equal(implementationTaskIds[0], 469);
  assert.equal(implementationTaskIds.at(-1), 612);
  assert.ok(tasks.some((task) => task.id === 613));
  assert.ok(tasks.some((task) => task.id === 614));
});

test("phase11 scenario catalog covers every required role family", () => {
  assert.equal(BROWSER_SCENARIOS.length, 81);
  const roleKeys = new Set(BROWSER_SCENARIOS.map((scenario) => scenario.roleKey));
  Object.keys(ROLE_TAXONOMY).forEach((roleKey) => {
    assert.ok(roleKeys.has(roleKey), `missing scenario coverage for ${roleKey}`);
  });
});

test("phase11 suite catalog covers cadence, load, ux, ai, and review", () => {
  assert.equal(SUITE_DEFINITIONS.length, 17);
  const suiteTypes = new Set(SUITE_DEFINITIONS.map((suite) => suite.suiteType));
  ["cadence", "k6", "ux", "ai", "review"].forEach((suiteType) => {
    assert.ok(suiteTypes.has(suiteType), `missing ${suiteType} suite coverage`);
  });
});

test("phase11 generated artifacts and docs exist", () => {
  [
    path.join(TESTS_DIR, "foundations", "foundations.json"),
    path.join(TESTS_DIR, "fixtures", "fixtures.json"),
    path.join(TESTS_DIR, "scenarios", "catalog.json"),
    path.join(TESTS_DIR, "manifests", "suite-catalog.json"),
    path.join(PERFORMANCE_DIR, "evidence-publishing.js"),
    path.join(PERFORMANCE_DIR, "reporting-search-queue.js"),
    path.join(PERFORMANCE_DIR, "realtime-collaboration.js"),
    path.join(PERFORMANCE_DIR, "large-school-scale.js"),
    path.join(DOCS_DIR, "README.md"),
    path.join(DOCS_DIR, "coverage-audit.md"),
    path.join(ARTIFACTS_DIR, "latest", "manifest.json"),
    path.join(ARTIFACTS_DIR, "latest", "summary.json"),
    path.join(ARTIFACTS_DIR, "latest", "recommendations", "recommendations.json"),
  ].forEach((filePath) => {
    assert.ok(fs.existsSync(filePath), `expected file to exist: ${filePath}`);
  });
});
