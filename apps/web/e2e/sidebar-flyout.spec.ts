import { expect, test } from "@playwright/test";
import { loginAsAdmin, signOutTestSession } from "./helpers/auth";
import { cleanupTestData, seedTestData } from "./helpers/seed";

test.beforeAll(async () => {
  await seedTestData();
});

test.afterAll(async () => {
  await cleanupTestData();
});

test.afterEach(async ({ page }) => {
  await signOutTestSession(page);
});

test("desktop sidebar flyout stays open while moving cursor from parent to submenu", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await loginAsAdmin(page);
  await page.goto("/dashboard");

  const sidebar = page.locator('aside[aria-label="Sidebar"]');
  const planLink = sidebar.getByRole("link", { name: "Plan", exact: true });
  await expect(planLink).toBeVisible();

  await planLink.hover();
  const unitsLink = sidebar.getByRole("link", { name: "Units", exact: true });
  await expect(unitsLink).toBeVisible();

  const planBox = await planLink.boundingBox();
  if (!planBox) throw new Error("Unable to resolve Plan link bounds");

  await page.mouse.move(planBox.x + planBox.width - 2, planBox.y + planBox.height / 2);
  await page.mouse.move(planBox.x + planBox.width + 2, planBox.y + planBox.height / 2);

  await expect(unitsLink).toBeVisible();

  await unitsLink.hover();
  await unitsLink.click();

  await expect(page).toHaveURL(/\/plan\/units/);
});
