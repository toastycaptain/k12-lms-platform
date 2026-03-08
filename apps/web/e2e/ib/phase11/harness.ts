import fs from "node:fs";
import path from "node:path";
import type { Page, TestInfo } from "@playwright/test";
import {
  loginAsAdmin,
  loginAsCasAdvisor,
  loginAsCoordinator,
  loginAsDiplomaStudent,
  loginAsDirector,
  loginAsDpTeacher,
  loginAsEeSupervisor,
  loginAsGuardian,
  loginAsMiddleYearsStudent,
  loginAsMultiChildGuardian,
  loginAsMypTeacher,
  loginAsPrimaryStudent,
  loginAsSpecialist,
  loginAsTeacher,
  loginAsTokTeacher,
} from "../../helpers/auth";

export interface Phase11Scenario {
  taskId: number;
  scenarioId: string;
  title: string;
  roleKey: string;
  programmeKey: string;
  cadence: string;
  routePath: string;
  heading: string;
  keywords: string[];
  mobile?: boolean;
}

const repoRoot = path.resolve(process.cwd(), "..", "..");
const defaultWebPort = process.env.E2E_WEB_PORT || "3200";
const webBaseUrl = process.env.E2E_WEB_BASE_URL || `http://localhost:${defaultWebPort}`;
const scenarioCatalogPath = path.join(repoRoot, "tests/simulations/ib/scenarios/catalog.json");
const runId = process.env.PHASE11_PLAYWRIGHT_RUN_ID || "playwright-smoke";
const runDir = path.join(repoRoot, "artifacts/phase11/runs", runId);
const eventsPath = path.join(runDir, "events.ndjson");
const summaryPath = path.join(runDir, "playwright-smoke-summary.json");
const summariesDir = path.join(runDir, "summaries");

const smokeTaskIds = [
  515, 523, 530, 536, 544, 550, 558, 564, 568, 572, 576, 582, 585, 587, 590, 594,
];
const scenarioCatalog = JSON.parse(
  fs.readFileSync(scenarioCatalogPath, "utf8"),
) as Phase11Scenario[];
const smokeScenarios = scenarioCatalog.filter((scenario) => smokeTaskIds.includes(scenario.taskId));
const executionResults: Array<Record<string, unknown>> = [];

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function appendEvent(event: Record<string, unknown>): void {
  ensureDir(runDir);
  fs.appendFileSync(eventsPath, `${JSON.stringify(event)}\n`);
}

function writeSummary(): void {
  ensureDir(summariesDir);
  fs.writeFileSync(
    summaryPath,
    `${JSON.stringify(
      {
        runId,
        generatedAt: new Date().toISOString(),
        scenarioCount: executionResults.length,
        results: executionResults,
      },
      null,
      2,
    )}\n`,
  );
  fs.writeFileSync(
    path.join(summariesDir, "phase11-playwright-smoke.md"),
    `# Phase 11 Playwright Smoke\n\n- Run ID: ${runId}\n- Scenario count: ${executionResults.length}\n\n${executionResults
      .map(
        (result) =>
          `- ${String(result.title)} (${String(result.roleKey)}): ${String(result.status)} in ${String(result.durationMs)}ms`,
      )
      .join("\n")}\n`,
  );
}

async function loginForRole(page: Page, roleKey: string): Promise<void> {
  switch (roleKey) {
    case "pyp_homeroom_teacher":
      await loginAsTeacher(page);
      break;
    case "pyp_specialist_teacher":
      await loginAsSpecialist(page);
      break;
    case "pyp_coordinator":
    case "myp_coordinator":
    case "dp_coordinator":
      await loginAsCoordinator(page);
      break;
    case "myp_subject_teacher":
      await loginAsMypTeacher(page);
      break;
    case "dp_subject_teacher":
      await loginAsDpTeacher(page);
      break;
    case "cas_advisor":
      await loginAsCasAdvisor(page);
      break;
    case "ee_supervisor":
      await loginAsEeSupervisor(page);
      break;
    case "tok_teacher":
      await loginAsTokTeacher(page);
      break;
    case "ib_director":
      await loginAsDirector(page);
      break;
    case "primary_student":
      await loginAsPrimaryStudent(page);
      break;
    case "middle_years_student":
      await loginAsMiddleYearsStudent(page);
      break;
    case "diploma_student":
      await loginAsDiplomaStudent(page);
      break;
    case "guardian":
      await loginAsGuardian(page);
      break;
    case "guardian_multichild":
      await loginAsMultiChildGuardian(page);
      break;
    default:
      await loginAsAdmin(page);
      break;
  }
}

export function getPhase11SmokeScenarios(): Phase11Scenario[] {
  return smokeScenarios;
}

export async function executePhase11Scenario(
  page: Page,
  scenario: Phase11Scenario,
  testInfo: TestInfo,
): Promise<void> {
  const startedAt = Date.now();
  if (scenario.mobile) {
    await page.setViewportSize({ width: 390, height: 844 });
  }

  appendEvent({
    timestamp: new Date().toISOString(),
    runId,
    scenarioId: scenario.scenarioId,
    roleKey: scenario.roleKey,
    programmeKey: scenario.programmeKey,
    kind: "scenario_start",
    path: scenario.routePath,
  });

  await loginForRole(page, scenario.roleKey);
  const targetUrl = new URL(scenario.routePath, webBaseUrl).toString();
  try {
    await page.goto(targetUrl, { waitUntil: "commit" });
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("ERR_ABORTED")) {
      throw error;
    }
  }
  await testInfo.attach(`${scenario.scenarioId}-route`, {
    body: Buffer.from(scenario.routePath, "utf8"),
    contentType: "text/plain",
  });
  await testInfo.attach(`${scenario.scenarioId}-keywords`, {
    body: Buffer.from(scenario.keywords.join(", "), "utf8"),
    contentType: "text/plain",
  });

  await page.getByRole("heading", { name: scenario.heading }).first().waitFor();

  const durationMs = Date.now() - startedAt;
  const result = {
    taskId: scenario.taskId,
    scenarioId: scenario.scenarioId,
    title: scenario.title,
    roleKey: scenario.roleKey,
    status: "pass",
    durationMs,
    path: scenario.routePath,
  };
  executionResults.push(result);
  appendEvent({
    timestamp: new Date().toISOString(),
    runId,
    scenarioId: scenario.scenarioId,
    roleKey: scenario.roleKey,
    programmeKey: scenario.programmeKey,
    kind: "scenario_complete",
    status: "pass",
    durationMs,
  });
  writeSummary();
}
