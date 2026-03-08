import fs from "node:fs";
import path from "node:path";
import {
  BROWSER_SCENARIOS,
  DOCS_DIR,
  FIXTURE_CONFIG,
  FOUNDATION_CONFIG,
  LOAD_ENDPOINTS,
  PERFORMANCE_DIR,
  REPO_ROOT,
  SUITE_DEFINITIONS,
  TESTS_DIR,
  getPhase11Catalog,
  readTaskFiles,
} from "./catalog.mjs";
import { createRunArtifacts } from "./artifacts.mjs";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, value);
}

function makeSchema(kind) {
  if (kind === "scenario") {
    return {
      type: "object",
      required: ["taskId", "scenarioId", "title", "roleKey", "programmeKey", "cadence", "routePath", "heading", "keywords"],
      properties: {
        taskId: { type: "number" },
        scenarioId: { type: "string" },
        title: { type: "string" },
        roleKey: { type: "string" },
        programmeKey: { type: "string" },
        cadence: { type: "string" },
        routePath: { type: "string" },
        heading: { type: "string" },
        keywords: { type: "array", items: { type: "string" } },
      },
    };
  }
  if (kind === "suite") {
    return {
      type: "object",
      required: ["taskId", "suiteId", "title", "suiteType"],
      properties: {
        taskId: { type: "number" },
        suiteId: { type: "string" },
        title: { type: "string" },
        suiteType: { type: "string" },
        scenarioIds: { type: "array", items: { type: "string" } },
      },
    };
  }
  return {
    type: "object",
    required: ["runId", "generatedAt", "suites", "scenarios"],
  };
}

function performanceScript(title, workloadMix) {
  return `import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = __ENV.PHASE11_API_BASE_URL || "http://localhost:4000";
const schoolId = __ENV.PHASE11_SCHOOL_ID || "1";
const headers = { "X-School-Id": schoolId };

export const options = {
  thresholds: {
    http_req_failed: ["rate<0.03"],
    http_req_duration: ["p(95)<1200"],
  },
  scenarios: {
    workload: {
      executor: "per-vu-iterations",
      vus: Number(__ENV.PHASE11_VUS || 5),
      iterations: Number(__ENV.PHASE11_ITERATIONS || 20),
      maxDuration: __ENV.PHASE11_MAX_DURATION || "2m",
    },
  },
};

const requests = ${JSON.stringify(workloadMix, null, 2)};

export default function () {
  requests.forEach((request) => {
    const response = http.get(baseUrl + request.path, { headers });
    check(response, { [${JSON.stringify(title)} + " " + request.name]: (result) => result.status < 500 });
  });
  sleep(1);
}
`;
}

function runId() {
  return "sample-phase11-20260308T000000Z";
}

function main() {
  const catalog = getPhase11Catalog();
  const taskFiles = readTaskFiles();

  ensureDir(TESTS_DIR);
  ensureDir(PERFORMANCE_DIR);
  ensureDir(DOCS_DIR);

  writeJson(path.join(TESTS_DIR, "tasks", "catalog.json"), taskFiles);
  writeJson(path.join(TESTS_DIR, "foundations", "foundations.json"), FOUNDATION_CONFIG);
  writeJson(path.join(TESTS_DIR, "fixtures", "fixtures.json"), FIXTURE_CONFIG);
  writeJson(path.join(TESTS_DIR, "scenarios", "catalog.json"), BROWSER_SCENARIOS);
  writeJson(path.join(TESTS_DIR, "manifests", "suite-catalog.json"), SUITE_DEFINITIONS);
  SUITE_DEFINITIONS.forEach((suite) => {
    writeJson(path.join(TESTS_DIR, "manifests", `${suite.suiteId}.json`), suite);
  });
  writeJson(path.join(TESTS_DIR, "load", "endpoints.json"), LOAD_ENDPOINTS);

  writeJson(path.join(TESTS_DIR, "schemas", "scenario.schema.json"), makeSchema("scenario"));
  writeJson(path.join(TESTS_DIR, "schemas", "suite.schema.json"), makeSchema("suite"));
  writeJson(path.join(TESTS_DIR, "schemas", "summary.schema.json"), makeSchema("summary"));

  writeText(
    path.join(PERFORMANCE_DIR, "evidence-publishing.js"),
    performanceScript("evidence-publishing", LOAD_ENDPOINTS.filter((endpoint) => ["evidence_items", "publishing_queue", "home"].includes(endpoint.name))),
  );
  writeText(
    path.join(PERFORMANCE_DIR, "reporting-search-queue.js"),
    performanceScript("reporting-search-queue", LOAD_ENDPOINTS.filter((endpoint) => ["reports", "search", "operations"].includes(endpoint.name))),
  );
  writeText(
    path.join(PERFORMANCE_DIR, "realtime-collaboration.js"),
    performanceScript("realtime-collaboration", LOAD_ENDPOINTS.filter((endpoint) => ["collaboration_workbench", "home", "search"].includes(endpoint.name))),
  );
  writeText(
    path.join(PERFORMANCE_DIR, "large-school-scale.js"),
    performanceScript("large-school-scale", LOAD_ENDPOINTS),
  );
  writeText(
    path.join(PERFORMANCE_DIR, "README.md"),
    "# Phase 11 k6 Workloads\n\nThese scripts model the Phase 11 load and scale tasks. They are designed to run against local, CI, or staging using the environment guardrails documented in `docs/ib/phase11/engine-and-observability.md`.\n",
  );

  createRunArtifacts({ runId: runId(), environment: "local", taskFiles });

  writeText(
    path.join(REPO_ROOT, "artifacts", "phase11", "README.md"),
    "# Phase 11 Artifacts\n\n`runs/` holds durable run bundles. `latest/` is a copy of the most recent deterministic sample output generated by `node tools/simulation/phase11/build-phase11.mjs`.\n",
  );

  console.log(
    JSON.stringify(
      {
        tasks: catalog.taskFiles.length,
        scenarios: catalog.browserScenarios.length,
        suites: catalog.suites.length,
        sampleRun: runId(),
      },
      null,
      2,
    ),
  );
}

main();
