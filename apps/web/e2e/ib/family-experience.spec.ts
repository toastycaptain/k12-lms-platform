import { expect, test } from "@playwright/test";
import { loginAsGuardian } from "../helpers/auth";
import { gotoAndMeasure } from "./helpers";
import { registerPhase7Lifecycle } from "./lifecycle";

registerPhase7Lifecycle();

test("@ib-phase7-family family home stays calm, current, and permission-safe", async ({
  page,
}, testInfo) => {
  await loginAsGuardian(page);
  await gotoAndMeasure(page, "/ib/guardian/home", "Family home", testInfo, 12_000);

  await expect(page.getByRole("heading", { name: "Upcoming milestones" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Calendar digest" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Family interactions" })).toBeVisible();
});
