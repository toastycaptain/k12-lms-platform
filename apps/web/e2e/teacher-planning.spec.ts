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

test("teacher can create, align, lesson-plan, and publish a unit", async ({ page }) => {
  const unitTitle = `E2E Unit ${Date.now()}`;
  const lessonTitle = `E2E Lesson ${Date.now()}`;

  await loginAsTeacher(page);
  await page.goto("/plan/units/new");

  await page.getByPlaceholder("e.g., Ecosystems and Biodiversity").fill(unitTitle);
  await page.getByLabel("Grade Level").selectOption({ label: "9" });
  await page.getByLabel("Course Subject").selectOption({ label: "Science" });
  await page.getByLabel("Course", { exact: true }).selectOption({ label: "E2E Biology 101" });
  await page.getByRole("button", { name: "Create Unit Plan" }).click();

  await expect(page).toHaveURL(/\/plan\/units\/\d+$/);
  const unitUrl = page.url();

  await page.getByPlaceholder("Search standards by code or description...").fill("E2E.BIO.1");
  await page.locator("li").filter({ hasText: "E2E.BIO.1" }).first().click();
  await expect(page.getByText("E2E.BIO.1")).toBeVisible();

  await page.getByRole("link", { name: "+ Add Lesson" }).click();
  await expect(page).toHaveURL(/\/plan\/units\/\d+\/lessons\/new$/);
  await page.getByPlaceholder("e.g., Introduction to Ecosystems").fill(lessonTitle);
  await page.getByRole("button", { name: "Create Lesson" }).click();
  await expect(page).toHaveURL(/\/plan\/units\/\d+\/lessons\/\d+$/);

  await page.goto(unitUrl);

  await page.getByRole("button", { name: "Save New Version" }).click();
  await expect(page.getByText(/v\d+/).first()).toBeVisible();

  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByText("published")).toBeVisible();

  await page.goto("/plan/units");
  await expect(page.getByText(unitTitle)).toBeVisible();
});
