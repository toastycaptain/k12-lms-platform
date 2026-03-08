import { test } from "@playwright/test";
import { registerPhase7Lifecycle } from "../lifecycle";
import { executePhase11Scenario, getPhase11SmokeScenarios } from "./harness";

registerPhase7Lifecycle();

for (const scenario of getPhase11SmokeScenarios()) {
  test(`@ib-phase11-smoke ${scenario.title}`, async ({ page }, testInfo) => {
    await executePhase11Scenario(page, scenario, testInfo);
  });
}
