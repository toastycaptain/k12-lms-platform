import { test } from "@playwright/test";
import { signOutTestSession } from "../helpers/auth";
import { cleanupTestData, seedTestData } from "../helpers/seed";

export function registerPhase7Lifecycle() {
  test.beforeAll(async () => {
    await seedTestData();
  });

  test.afterAll(async () => {
    await cleanupTestData();
  });

  test.afterEach(async ({ page }) => {
    await signOutTestSession(page);
  });
}
