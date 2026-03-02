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

test("unauthenticated users are redirected to login", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "K-12 Planning + LMS" })).toBeVisible();
});

test("teacher session can access dashboard", async ({ page }) => {
  await loginAsTeacher(page);
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: /Welcome,/ })).toBeVisible();
});

test("sign out clears session and returns to login", async ({ page }) => {
  await loginAsTeacher(page);
  await page.goto("/dashboard");

  await page.getByRole("button", { name: /E2E Teacher/i }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);
});
