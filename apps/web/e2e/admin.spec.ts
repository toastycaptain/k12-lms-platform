import { expect, test } from "@playwright/test";
import { loginAsAdmin, signOutTestSession } from "./helpers/auth";
import { cleanupTestData, seedTestData } from "./helpers/seed";

const apiBaseUrl = process.env.E2E_API_BASE_URL || "http://localhost:4000";

interface AiProviderConfigRow {
  id: number;
  provider_name: string;
}

test.beforeAll(async () => {
  await seedTestData();
});

test.afterAll(async () => {
  await cleanupTestData();
});

test.afterEach(async ({ page }) => {
  await signOutTestSession(page);
});

test("admin can manage users, standards, and AI provider settings", async ({ page }) => {
  const stamp = Date.now();
  const userEmail = `e2e-user-${stamp}@e2e.local`;
  const frameworkName = `E2E Framework ${stamp}`;
  const standardCode = `E2E.ADMIN.${stamp}`;
  const providerName = `E2E Provider ${stamp}`;

  await loginAsAdmin(page);

  await page.goto("/admin/users");
  await page.locator("#user-email").fill(userEmail);
  await page.locator("#user-first-name").fill("E2E");
  await page.locator("#user-last-name").fill("Learner");
  await page.locator("#user-role").selectOption("student");
  await page.getByRole("button", { name: "Create User" }).click();
  await expect(page.getByText("User created.")).toBeVisible();
  await expect(page.getByText(userEmail)).toBeVisible();

  await page.goto("/admin/standards");
  await page.getByRole("button", { name: "Add Framework" }).click();
  await page.getByPlaceholder("Name").fill(frameworkName);
  await page.getByPlaceholder("Jurisdiction").fill("E2E");
  await page.getByPlaceholder("Subject").fill("Science");
  await page.getByPlaceholder("Version").fill("1.0");
  await page.getByRole("button", { name: "Save Framework" }).click();
  await expect(page.getByText(frameworkName)).toBeVisible();

  await page
    .getByRole("button", { name: new RegExp(frameworkName) })
    .first()
    .click();
  await page.getByPlaceholder("Code").fill(standardCode);
  await page.getByPlaceholder("Description").fill("E2E admin-created standard for validation.");
  await page.getByRole("button", { name: "Add Standard" }).click();
  const standardsTree = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Standards Tree" }) });
  await expect(standardsTree.locator("p", { hasText: standardCode })).toBeVisible();

  await page.goto("/admin/ai");
  const providersResponse = await page.request.get(`${apiBaseUrl}/api/v1/ai_provider_configs`);
  expect(providersResponse.ok()).toBeTruthy();
  const providers = (await providersResponse.json()) as AiProviderConfigRow[];
  const openAiProvider = providers.find((provider) => provider.provider_name === "openai");

  const providerRequestBody = {
    provider_name: "openai",
    display_name: providerName,
    default_model: "gpt-4.1-mini",
    api_key: "e2e-test-api-key",
  };
  const saveProviderResponse = openAiProvider
    ? await page.request.patch(`${apiBaseUrl}/api/v1/ai_provider_configs/${openAiProvider.id}`, {
        data: providerRequestBody,
      })
    : await page.request.post(`${apiBaseUrl}/api/v1/ai_provider_configs`, {
        data: providerRequestBody,
      });
  expect(saveProviderResponse.ok()).toBeTruthy();

  await page.reload();
  await expect(page.getByText(providerName)).toBeVisible();
});
