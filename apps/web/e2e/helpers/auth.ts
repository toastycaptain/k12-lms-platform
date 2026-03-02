import { type Page } from "@playwright/test";
import { E2E_FIXTURES } from "./seed";

const apiBaseUrl = process.env.E2E_API_BASE_URL || "http://localhost:4000";

type UserRole = "admin" | "teacher" | "student" | "guardian";

async function loginAsRole(page: Page, role: UserRole, email: string): Promise<void> {
  await page.context().clearCookies();

  const response = await page.request.post(`${apiBaseUrl}/api/v1/testing/session`, {
    data: {
      role,
      email,
      tenant_slug: E2E_FIXTURES.tenantSlug,
    },
  });

  if (!response.ok()) {
    throw new Error(
      `Failed to create ${role} test session: ${response.status()} ${await response.text()}`,
    );
  }
}

export async function loginAsTeacher(page: Page): Promise<void> {
  await loginAsRole(page, "teacher", E2E_FIXTURES.teacherEmail);
}

export async function loginAsStudent(page: Page): Promise<void> {
  await loginAsRole(page, "student", E2E_FIXTURES.studentEmail);
}

export async function loginAsAdmin(page: Page): Promise<void> {
  await loginAsRole(page, "admin", E2E_FIXTURES.adminEmail);
}

export async function loginAsGuardian(page: Page): Promise<void> {
  await loginAsRole(page, "guardian", E2E_FIXTURES.guardianEmail);
}

export async function signOutTestSession(page: Page): Promise<void> {
  await page.request.delete(`${apiBaseUrl}/api/v1/testing/session`);
  await page.context().clearCookies();
}
