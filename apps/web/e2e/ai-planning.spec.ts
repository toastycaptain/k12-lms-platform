import { expect, test, type Page } from "@playwright/test";
import { loginAsAdmin, signOutTestSession } from "./helpers/auth";
import { cleanupTestData, E2E_FIXTURES, seedTestData } from "./helpers/seed";

const apiBaseUrl = process.env.E2E_API_BASE_URL || "http://localhost:4000";

interface UnitPlanRow {
  id: number;
}

interface AiProviderConfigRow {
  id: number;
  provider_name: string;
  status: "active" | "inactive";
}

interface AiTaskPolicyRow {
  id: number;
  task_type: string;
  ai_provider_config_id: number;
}

async function readJson<T>(page: Page, path: string): Promise<T> {
  const response = await page.request.get(`${apiBaseUrl}${path}`);
  if (!response.ok()) {
    throw new Error(`GET ${path} failed: ${response.status()} ${await response.text()}`);
  }
  return (await response.json()) as T;
}

async function ensureTeacherAiCapabilities(page: Page): Promise<void> {
  await loginAsAdmin(page);

  const providersResponse = await page.request.get(`${apiBaseUrl}/api/v1/ai_provider_configs`);
  if (!providersResponse.ok()) {
    throw new Error(
      `GET /api/v1/ai_provider_configs failed: ${providersResponse.status()} ${await providersResponse.text()}`,
    );
  }
  const providers = (await providersResponse.json()) as AiProviderConfigRow[];
  const openAiProvider = providers.find((provider) => provider.provider_name === "openai");

  const providerPayload = {
    provider_name: "openai",
    display_name: `E2E Teacher Provider ${Date.now()}`,
    default_model: "gpt-4.1-mini",
    api_key: "e2e-test-api-key",
  };

  const saveProviderResponse = openAiProvider
    ? await page.request.patch(`${apiBaseUrl}/api/v1/ai_provider_configs/${openAiProvider.id}`, {
        data: providerPayload,
      })
    : await page.request.post(`${apiBaseUrl}/api/v1/ai_provider_configs`, {
        data: providerPayload,
      });

  if (!saveProviderResponse.ok()) {
    throw new Error(
      `Save AI provider failed: ${saveProviderResponse.status()} ${await saveProviderResponse.text()}`,
    );
  }

  const refreshedProvidersResponse = await page.request.get(
    `${apiBaseUrl}/api/v1/ai_provider_configs`,
  );
  if (!refreshedProvidersResponse.ok()) {
    throw new Error(
      `GET /api/v1/ai_provider_configs failed: ${refreshedProvidersResponse.status()} ${await refreshedProvidersResponse.text()}`,
    );
  }

  const refreshedProviders = (await refreshedProvidersResponse.json()) as AiProviderConfigRow[];
  const configuredProvider = refreshedProviders.find(
    (provider) => provider.provider_name === "openai",
  );
  if (!configuredProvider) {
    throw new Error("OpenAI provider missing after save.");
  }

  if (configuredProvider.status !== "active") {
    const activateResponse = await page.request.post(
      `${apiBaseUrl}/api/v1/ai_provider_configs/${configuredProvider.id}/activate`,
    );
    if (!activateResponse.ok()) {
      throw new Error(
        `Activate AI provider failed: ${activateResponse.status()} ${await activateResponse.text()}`,
      );
    }
  }

  const policiesResponse = await page.request.get(`${apiBaseUrl}/api/v1/ai_task_policies`);
  if (!policiesResponse.ok()) {
    throw new Error(
      `GET /api/v1/ai_task_policies failed: ${policiesResponse.status()} ${await policiesResponse.text()}`,
    );
  }

  const policies = (await policiesResponse.json()) as AiTaskPolicyRow[];
  const existingUnitPolicy =
    policies.find(
      (policy) =>
        policy.task_type === "unit_plan" && policy.ai_provider_config_id === configuredProvider.id,
    ) ?? policies.find((policy) => policy.task_type === "unit_plan");

  const policyPayload = {
    ai_provider_config_id: configuredProvider.id,
    task_type: "unit_plan",
    enabled: true,
    requires_approval: false,
    allowed_roles: ["teacher"],
    max_tokens_limit: 4096,
    temperature_limit: 0.7,
    model_override: null,
  };

  const savePolicyResponse = existingUnitPolicy
    ? await page.request.patch(`${apiBaseUrl}/api/v1/ai_task_policies/${existingUnitPolicy.id}`, {
        data: policyPayload,
      })
    : await page.request.post(`${apiBaseUrl}/api/v1/ai_task_policies`, { data: policyPayload });

  if (!savePolicyResponse.ok()) {
    throw new Error(
      `Save AI task policy failed: ${savePolicyResponse.status()} ${await savePolicyResponse.text()}`,
    );
  }

  const teacherSessionResponse = await page.request.post(`${apiBaseUrl}/api/v1/testing/session`, {
    data: {
      role: "teacher",
      email: E2E_FIXTURES.teacherEmail,
      tenant_slug: E2E_FIXTURES.tenantSlug,
    },
  });
  if (!teacherSessionResponse.ok()) {
    throw new Error(
      `Failed to restore teacher session: ${teacherSessionResponse.status()} ${await teacherSessionResponse.text()}`,
    );
  }
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

test("teacher can generate AI content and apply it to a unit plan", async ({ page }) => {
  const stamp = Date.now();
  const generatedDescription = `A student-centered unit generated by the E2E AI mock ${stamp}.`;
  const generatedEssentialQuestionOne = `How do ratios help us compare quantities in scenario ${stamp}?`;
  const generatedEssentialQuestionTwo = `Where do we use fractions in everyday decisions for case ${stamp}?`;
  const generatedUnderstandingOne = `Mathematical models help us reason about real situations in case ${stamp}.`;
  const generatedUnderstandingTwo = `Multiple representations can describe the same relationship in case ${stamp}.`;

  await ensureTeacherAiCapabilities(page);
  await page.route(/\/api\/v1\/ai\/stream(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "stream disabled in e2e" }),
    });
  });

  await page.route(/\/api\/v1\/ai_invocations(?:\?.*)?$/, async (route, request) => {
    if (request.method() !== "POST") {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: 999,
        content: [
          "Description",
          generatedDescription,
          "",
          "Essential Questions",
          `- ${generatedEssentialQuestionOne}`,
          `- ${generatedEssentialQuestionTwo}`,
          "",
          "Enduring Understandings",
          `- ${generatedUnderstandingOne}`,
          `- ${generatedUnderstandingTwo}`,
        ].join("\n"),
        provider: "mock-provider",
        model: "mock-model",
        status: "completed",
      }),
    });
  });

  const units = await readJson<UnitPlanRow[]>(page, "/api/v1/unit_plans");
  if (units.length === 0) {
    test.skip();
    return;
  }

  const unitId = units[0].id;
  await page.goto(`/plan/units/${unitId}`);

  await page.getByRole("button", { name: "AI Assistant" }).click();
  await expect(page.getByRole("heading", { name: "AI Assistant" })).toBeVisible();
  await expect(page.getByText("AI actions are governed by your school's policy.")).toBeVisible();

  await page
    .getByPlaceholder("Describe what you'd like the AI to help with...")
    .fill(`Generate a standards-aligned unit draft for grade 6 ratios (${stamp}).`);
  await expect(page.getByRole("button", { name: "Generate" })).toBeEnabled();
  await page.getByRole("button", { name: "Generate" }).click();

  await expect(page.getByText(generatedDescription)).toBeVisible();

  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByRole("heading", { name: "Apply AI Changes to Unit" })).toBeVisible();

  await page.getByRole("button", { name: "Confirm Apply" }).click();
  await expect(page.getByText("AI draft applied and saved as a new unit version.")).toBeVisible();
});
