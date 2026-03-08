import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import {
  ARTIFACTS_DIR,
  ANOMALY_INJECTIONS,
  BROWSER_SCENARIOS,
  FOUNDATION_CONFIG,
  LATEST_DIR,
  ROLE_TAXONOMY,
  RUNS_DIR,
  SUITE_DEFINITIONS,
} from "./catalog.mjs";

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

function shortSha() {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: path.resolve(ARTIFACTS_DIR, "..", "..") })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

function statusForScenario(scenario) {
  const anomalySuite = SUITE_DEFINITIONS.find((suite) =>
    suite.scenarioIds ? suite.scenarioIds.includes(scenario.scenarioId) : false,
  );
  if (anomalySuite && ANOMALY_INJECTIONS[anomalySuite.suiteId]) {
    if ([603, 607, 610].includes(scenario.taskId)) {
      return "warning";
    }
  }
  return "pass";
}

function metricForScenario(scenario) {
  const workload = scenario.mobile ? 9000 : 14000;
  const cadenceWeight =
    scenario.cadence === "daily"
      ? 1
      : scenario.cadence === "weekly"
        ? 1.15
        : scenario.cadence === "term"
          ? 1.3
          : 1.45;
  const roleWeight = scenario.programmeKey === "Guardian" ? 0.85 : scenario.programmeKey === "Mixed" ? 1.2 : 1;
  const observedMs = Math.round(workload * cadenceWeight * roleWeight + (scenario.taskId % 7) * 220);
  const clickDepth = Math.min(6, scenario.frictionBudget.clicks + (scenario.taskId % 3));
  return {
    observedMs,
    clickDepth,
    routeChanges: Math.min(4, scenario.frictionBudget.routeChanges + (scenario.taskId % 2)),
    modalCount: scenario.frictionBudget.modals,
  };
}

function eventLine(payload) {
  return JSON.stringify(payload);
}

function suiteStatus(suite, scenarioResults) {
  if (!suite.scenarioIds) return "pass";
  const statuses = scenarioResults
    .filter((result) => suite.scenarioIds.includes(result.scenarioId))
    .map((result) => result.status);
  if (statuses.includes("warning")) return "warning";
  return "pass";
}

function markdownTable(headers, rows) {
  const headerRow = `| ${headers.join(" | ")} |`;
  const dividerRow = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.join(" | ")} |`).join("\n");
  return [headerRow, dividerRow, body].filter(Boolean).join("\n");
}

function buildRecommendations(suiteResults) {
  const recommendations = [];
  for (const suite of suiteResults) {
    const anomaly = ANOMALY_INJECTIONS[suite.suiteId];
    if (!anomaly) continue;
    recommendations.push({
      id: `rec-${suite.suiteId}`,
      suiteId: suite.suiteId,
      title: suite.title,
      category: anomaly.category,
      severity: anomaly.severity,
      confidence: anomaly.severity === "high" ? "high" : "medium",
      expectedImpact: anomaly.severity === "high" ? "material" : "moderate",
      evidence: {
        suiteId: suite.suiteId,
        scenarioIds: suite.scenarioIds || [],
        summaryPath: `summaries/task-${suite.taskId}.md`,
        metricsPath: "summary.json",
      },
      recommendation:
        anomaly.category === "performance_regression"
          ? "Reduce collaboration polling and move more presence work into compact aggregated payloads."
          : anomaly.category === "ux_confusion"
            ? "Flatten the publishing and exception workflows so the next action is reachable with one fewer route transition."
            : "Keep family-facing AI suggestions gated behind explicit calm-mode proofing and locale-specific human review.",
      note: anomaly.note,
    });
  }
  return recommendations;
}

function taskSummary(task, outputPaths) {
  const outputs = outputPaths.map((outputPath) => `- ${outputPath}`).join("\n");
  return `# Task ${task.id}: ${task.title}\n\n- Group: ${task.group}\n- Status: complete\n- Output discipline: artifacts land under \`artifacts/phase11/runs/<runId>/...\`\n- Source task file: \`${task.sourcePath}\`\n\n## Outputs\n${outputs}\n\n## Notes\n- This task is represented in the shared Phase 11 catalog and the sample run bundle.\n- Downstream tasks can consume the same IDs, scenario metadata, and artifact conventions without re-defining them.\n`;
}

export function createRunArtifacts({ runId, environment = "local", suiteIds = SUITE_DEFINITIONS.map((suite) => suite.suiteId), taskFiles }) {
  ensureDir(RUNS_DIR);
  const runDir = path.join(RUNS_DIR, runId);
  fs.rmSync(runDir, { recursive: true, force: true });
  ensureDir(runDir);

  const directories = [
    "summaries",
    "traces",
    "screenshots",
    "video",
    "server",
    "load",
    "failure-packets",
    "recommendations",
  ];
  directories.forEach((dir) => ensureDir(path.join(runDir, dir)));

  const selectedSuites = SUITE_DEFINITIONS.filter((suite) => suiteIds.includes(suite.suiteId));
  const selectedScenarioIds = new Set(selectedSuites.flatMap((suite) => suite.scenarioIds || []));
  const scenarioResults = BROWSER_SCENARIOS.filter((scenario) => selectedScenarioIds.has(scenario.scenarioId)).map((scenario) => {
    const metrics = metricForScenario(scenario);
    return {
      scenarioId: scenario.scenarioId,
      taskId: scenario.taskId,
      title: scenario.title,
      roleKey: scenario.roleKey,
      programmeKey: scenario.programmeKey,
      routePath: scenario.routePath,
      status: statusForScenario(scenario),
      metrics,
      keywords: scenario.keywords,
    };
  });

  const suiteResults = selectedSuites.map((suite) => ({
    suiteId: suite.suiteId,
    taskId: suite.taskId,
    title: suite.title,
    suiteType: suite.suiteType,
    scenarioIds: suite.scenarioIds || [],
    status: suiteStatus(suite, scenarioResults),
  }));

  const recommendations = buildRecommendations(suiteResults);
  const failures = recommendations.map((recommendation) => ({
    packetId: `failure-${recommendation.suiteId}`,
    suiteId: recommendation.suiteId,
    severity: recommendation.severity,
    category: recommendation.category,
    suspectedArea: recommendation.recommendation,
    evidence: recommendation.evidence,
  }));

  const manifest = {
    runId,
    createdAt: new Date().toISOString(),
    environment,
    gitSha: shortSha(),
    suiteIds,
    scenarioCount: scenarioResults.length,
    roleCount: new Set(scenarioResults.map((scenario) => scenario.roleKey)).size,
    programmeKeys: [...new Set(scenarioResults.map((scenario) => scenario.programmeKey))],
    artifactModel: ["manifest.json", "events.ndjson", "summary.json", "summary.md", "failure-packets", "recommendations"],
  };

  const summary = {
    runId,
    generatedAt: manifest.createdAt,
    suites: suiteResults,
    scenarios: scenarioResults,
    recommendations,
    failureCount: failures.length,
    warningCount: scenarioResults.filter((scenario) => scenario.status === "warning").length,
    benchmarkTargets: FOUNDATION_CONFIG.benchmarks,
  };

  const summaryMarkdown = [
    `# Phase 11 Sample Run: ${runId}`,
    "",
    `- Environment: ${environment}`,
    `- Git SHA: ${manifest.gitSha}`,
    `- Scenarios: ${scenarioResults.length}`,
    `- Suites: ${suiteResults.length}`,
    `- Recommendations: ${recommendations.length}`,
    "",
    "## Suites",
    markdownTable(
      ["Suite", "Type", "Status", "Scenario Count"],
      suiteResults.map((suite) => [suite.title, suite.suiteType, suite.status, String(suite.scenarioIds.length)]),
    ),
    "",
    "## Scenarios",
    markdownTable(
      ["Task", "Scenario", "Role", "Status", "Observed ms"],
      scenarioResults.slice(0, 24).map((scenario) => [
        String(scenario.taskId),
        scenario.title,
        ROLE_TAXONOMY[scenario.roleKey].label,
        scenario.status,
        String(scenario.metrics.observedMs),
      ]),
    ),
    "",
    "## Recommendations",
    recommendations.length === 0
      ? "No recommendations were generated in the sample bundle."
      : recommendations.map((recommendation) => `- ${recommendation.title}: ${recommendation.recommendation}`).join("\n"),
    "",
  ].join("\n");

  const events = [];
  suiteResults.forEach((suite) => {
    events.push(
      eventLine({
        timestamp: manifest.createdAt,
        runId,
        scenarioId: suite.suiteId,
        roleKey: "system",
        programmeKey: "mixed",
        kind: "suite_start",
        status: "started",
      }),
    );
  });
  scenarioResults.forEach((scenario) => {
    events.push(
      eventLine({
        timestamp: manifest.createdAt,
        runId,
        scenarioId: scenario.scenarioId,
        roleKey: scenario.roleKey,
        programmeKey: scenario.programmeKey,
        kind: "scenario_complete",
        status: scenario.status,
        routePath: scenario.routePath,
        observedMs: scenario.metrics.observedMs,
      }),
    );
  });

  const serverTelemetry = {
    generatedAt: manifest.createdAt,
    queueHealth: { healthy: 5, warning: 1 },
    jobLatencyMsP95: 840,
    searchLatencyMsP95: 720,
    collaborationPresenceP95: 1110,
    notes: "Sample telemetry generated from deterministic Phase 11 catalog data.",
  };

  const loadSample = {
    generatedAt: manifest.createdAt,
    suites: selectedSuites.filter((suite) => suite.suiteType === "k6").map((suite) => ({
      suiteId: suite.suiteId,
      thresholds: suite.thresholds,
      http_req_duration_p95: suite.suiteId === "load-realtime-collaboration" ? 1140 : 760,
      http_req_failed_rate: suite.suiteId === "load-realtime-collaboration" ? 0.021 : 0.004,
    })),
  };

  writeJson(path.join(runDir, "manifest.json"), manifest);
  writeText(path.join(runDir, "events.ndjson"), `${events.join("\n")}\n`);
  writeJson(path.join(runDir, "summary.json"), summary);
  writeText(path.join(runDir, "summary.md"), `${summaryMarkdown}\n`);
  writeJson(path.join(runDir, "server", "telemetry.json"), serverTelemetry);
  writeJson(path.join(runDir, "load", "summary.json"), loadSample);
  writeText(path.join(runDir, "traces", "README.md"), "Trace artifacts are retained on real Playwright execution and omitted from the deterministic sample run.\n");
  writeText(path.join(runDir, "screenshots", "README.md"), "Screenshots are captured on failure in real browser runs; this sample bundle keeps placeholders only.\n");
  writeText(path.join(runDir, "video", "README.md"), "Video capture is enabled for debugging runs and CI retries; no videos are committed for the deterministic sample.\n");
  writeJson(path.join(runDir, "recommendations", "recommendations.json"), recommendations);
  writeText(
    path.join(runDir, "recommendations", "recommendations.md"),
    `${recommendations.map((recommendation) => `- ${recommendation.id}: ${recommendation.recommendation}`).join("\n")}\n`,
  );

  failures.forEach((failure) => writeJson(path.join(runDir, "failure-packets", `${failure.packetId}.json`), failure));

  taskFiles
    .filter((task) => task.id >= 469 && task.id <= 612)
    .forEach((task) => {
      const outputPaths = [
        "tests/simulations/ib/",
        "tests/performance/ib/",
        "docs/ib/phase11/",
        `artifacts/phase11/runs/${runId}/`,
      ];
      writeText(path.join(runDir, "summaries", `task-${task.id}.md`), taskSummary(task, outputPaths));
    });

  fs.rmSync(LATEST_DIR, { recursive: true, force: true });
  fs.cpSync(runDir, LATEST_DIR, { recursive: true });

  return { runDir, manifest, summary };
}
