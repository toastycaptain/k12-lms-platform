import { test } from "@playwright/test";
import { loginAsAdmin, loginAsTeacher } from "../helpers/auth";
import { gotoAndMeasure } from "./helpers";
import { registerPhase7Lifecycle } from "./lifecycle";

registerPhase7Lifecycle();

test("@ib-phase7-performance seeded IB routes stay within Phase 7 E2E guardrails", async ({
  page,
}, testInfo) => {
  await loginAsTeacher(page);
  await gotoAndMeasure(page, "/ib/home", "Teacher action console", testInfo, 12_000);
  await gotoAndMeasure(page, "/ib/evidence", "Evidence inbox", testInfo, 10_000);
  await gotoAndMeasure(
    page,
    "/ib/families/publishing",
    "Family publishing queue",
    testInfo,
    10_000,
  );

  await loginAsAdmin(page);
  await gotoAndMeasure(page, "/ib/operations", "Programme operations center", testInfo, 12_000);
});
