import { expect, test } from "@playwright/test";
import { loginAsAdmin, loginAsStudent, loginAsTeacher, signOutTestSession } from "./helpers/auth";
import { cleanupTestData, seedTestData } from "./helpers/seed";

const apiBaseUrl = process.env.E2E_API_BASE_URL || "http://localhost:4000";

test.beforeAll(async () => {
  await seedTestData();
});

test.afterAll(async () => {
  await cleanupTestData();
});

test.afterEach(async ({ page }) => {
  await signOutTestSession(page);
});

test.describe("Cross-cutting RBAC boundaries", () => {
  test("student cannot access teacher routes", async ({ page }) => {
    await loginAsStudent(page);
    await page.goto("/teach/courses/new");
    await page.waitForLoadState("domcontentloaded");

    const bodyText = ((await page.locator("body").textContent()) || "").toLowerCase();
    const blocked =
      !page.url().includes("/teach/courses/new") ||
      bodyText.includes("forbidden") ||
      bodyText.includes("unauthorized") ||
      bodyText.includes("not authorized") ||
      bodyText.includes("access denied");

    expect(blocked).toBeTruthy();
  });

  test("student cannot access admin routes", async ({ page }) => {
    await loginAsStudent(page);
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");

    const bodyText = ((await page.locator("body").textContent()) || "").toLowerCase();
    const blocked =
      !page.url().includes("/admin/users") ||
      bodyText.includes("forbidden") ||
      bodyText.includes("unauthorized") ||
      bodyText.includes("not authorized") ||
      bodyText.includes("access denied");

    expect(blocked).toBeTruthy();
  });

  test("teacher cannot access admin user management", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");

    const bodyText = ((await page.locator("body").textContent()) || "").toLowerCase();
    const blocked =
      !page.url().includes("/admin/users") ||
      bodyText.includes("forbidden") ||
      bodyText.includes("unauthorized") ||
      bodyText.includes("not authorized") ||
      bodyText.includes("access denied");

    expect(blocked).toBeTruthy();
  });
});

test.describe("Cross-cutting admin workflows", () => {
  test("admin can open dashboard and approvals surfaces", async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto("/admin/dashboard");
    await expect(page.getByRole("heading").first()).toBeVisible();

    await page.goto("/admin/approvals");
    const hasError = await page
      .locator("text=Error, text=Something went wrong")
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasError).toBeFalsy();
  });
});

test.describe("Cross-cutting tenant/session isolation", () => {
  test("API denies unauthenticated requests", async ({ request }) => {
    const coursesResponse = await request.get(`${apiBaseUrl}/api/v1/courses`);
    expect([401, 403]).toContain(coursesResponse.status());

    const unitPlansResponse = await request.get(`${apiBaseUrl}/api/v1/unit_plans`);
    expect([401, 403]).toContain(unitPlansResponse.status());
  });
});
