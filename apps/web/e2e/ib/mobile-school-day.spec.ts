import { expect, test } from "@playwright/test";
import { loginAsGuardian, loginAsTeacher } from "../helpers/auth";
import { registerPhase7Lifecycle } from "./lifecycle";

registerPhase7Lifecycle();

test.describe("@ib-phase10-mobile mobile school-day flows", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("teacher evidence mobile shell opens capture and reflection flows", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto("/ib/evidence");

    await expect(page.getByText("Mobile workspace")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Evidence inbox" }).first()).toBeVisible();

    await page.getByRole("button", { name: /Capture evidence/i }).click();
    await expect(page.getByRole("heading", { name: "Mobile evidence capture" })).toBeVisible();

    await page.getByLabel("Title").fill("Playwright mobile evidence");
    await page.getByLabel("Summary").fill("Saved from the mobile evidence drawer.");
    await page.getByRole("button", { name: "Save capture" }).click();

    await expect(page.getByRole("heading", { name: "Mobile evidence capture" })).not.toBeVisible();

    await page.getByRole("button", { name: /Review reflection/i }).click();
    await expect(page.getByRole("heading", { name: "Reflection review" })).toBeVisible();
  });

  test("guardian home keeps the mobile dock available", async ({ page }) => {
    await loginAsGuardian(page);
    await page.goto("/ib/guardian/home");

    await expect(page.getByRole("heading", { name: "Family home" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Released report/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Current unit/i })).toBeVisible();
  });
});
