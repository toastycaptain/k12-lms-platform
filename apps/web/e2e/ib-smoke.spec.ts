import { expect, test } from "@playwright/test";
import { loginAsAdmin, loginAsGuardian, loginAsTeacher, signOutTestSession } from "./helpers/auth";
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

test("@ib-smoke admin can open rollout and readiness consoles", async ({ page }) => {
  await loginAsAdmin(page);

  await page.goto("/ib/rollout");
  await expect(page.getByRole("heading", { name: "Rollout console" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pilot setup wizard" })).toBeVisible();

  await page.goto("/ib/readiness");
  await expect(page.getByRole("heading", { name: "Pilot readiness" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Refresh readiness" })).toBeVisible();
});

test("@ib-smoke teacher can open IB evidence, publishing, PYP, and DP surfaces", async ({
  page,
}) => {
  await loginAsTeacher(page);

  await page.goto("/ib/evidence");
  await expect(page.getByRole("heading", { name: "Evidence inbox" })).toBeVisible();

  await page.goto("/ib/families/publishing");
  await expect(page.getByRole("heading", { name: "Family publishing queue" })).toBeVisible();

  await page.goto("/ib/pyp/poi");
  await expect(page.getByRole("heading", { name: "Programme of inquiry" })).toBeVisible();

  await page.goto("/ib/dp/coordinator");
  await expect(page.getByRole("heading", { name: "DP coordinator" })).toBeVisible();
});

test("@ib-smoke guardian can open the IB family home", async ({ page }) => {
  await loginAsGuardian(page);

  await page.goto("/ib/guardian/home");

  await expect(page.getByRole("heading", { name: "Family home" })).toBeVisible();
});
