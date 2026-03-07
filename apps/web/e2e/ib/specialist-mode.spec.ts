import { expect, test } from "@playwright/test";
import { loginAsSpecialist } from "../helpers/auth";
import { gotoAndMeasure } from "./helpers";
import { registerPhase7Lifecycle } from "./lifecycle";

registerPhase7Lifecycle();

test("@ib-phase7-specialist specialist mode keeps contribution, handoff, and reuse visible", async ({
  page,
}, testInfo) => {
  await loginAsSpecialist(page);
  await gotoAndMeasure(page, "/ib/specialist", "Specialist dashboard", testInfo, 12_000);

  await expect(page.getByRole("heading", { name: "Requested contributions" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pending handoffs" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Reuse library" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Coordinator visibility" })).toBeVisible();
});
