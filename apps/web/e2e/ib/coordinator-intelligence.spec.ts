import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "../helpers/auth";
import { gotoAndMeasure } from "./helpers";
import { registerPhase7Lifecycle } from "./lifecycle";

registerPhase7Lifecycle();

test("@ib-phase7-coordinator coordinator intelligence stays exception-first and shareable", async ({
  page,
}, testInfo) => {
  await loginAsAdmin(page);
  await gotoAndMeasure(page, "/ib/operations", "Programme operations center", testInfo, 12_000);

  await expect(page.getByText("Operational drilldown matrix")).toBeVisible();
  await expect(page.getByText("Data mart snapshot")).toBeVisible();
  await expect(page.getByRole("button", { name: "Share snapshot" })).toBeVisible();
  await expect(page.getByText("SLA watch")).toBeVisible();
});
