import { expect, test } from "@playwright/test";
import { loginAsStudent } from "../helpers/auth";
import { gotoAndMeasure } from "./helpers";
import { registerPhase7Lifecycle } from "./lifecycle";

registerPhase7Lifecycle();

test("@ib-phase7-student student home keeps timeline, portfolio, and release gates coherent", async ({
  page,
}, testInfo) => {
  await loginAsStudent(page);
  await gotoAndMeasure(page, "/ib/student/home", "Student home", testInfo, 12_000);

  await expect(page.getByText("Unified learning timeline")).toBeVisible();
  await expect(page.getByText("Portfolio search and collections")).toBeVisible();
  await expect(page.getByText("Release gates")).toBeVisible();
});
