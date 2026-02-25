import { expect, test } from "@playwright/test";
import { loginAsTeacher, signOutTestSession } from "./helpers/auth";
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

test("shows offline banner and clears after reconnect", async ({ page, context }) => {
  await loginAsTeacher(page);
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /Welcome,/ })).toBeVisible({ timeout: 10000 });

  const offlineBanner = page.locator('div[role="alert"]').filter({ hasText: "You are offline" });
  const restoredBanner = page
    .locator('div[role="status"]')
    .filter({ hasText: "Connection restored" });

  await context.setOffline(true);
  await expect
    .poll(
      async () => {
        await page.evaluate(() => {
          window.dispatchEvent(new Event("offline"));
        });
        return offlineBanner.count();
      },
      { timeout: 8000 },
    )
    .toBeGreaterThan(0);
  await expect(offlineBanner).toBeVisible();

  await context.setOffline(false);
  await page.evaluate(() => {
    window.dispatchEvent(new Event("online"));
  });

  await expect(offlineBanner).toBeHidden({ timeout: 5000 });
  await expect(restoredBanner).toHaveCount(0);
});
