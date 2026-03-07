import { type Page } from "@playwright/test";
import { E2E_FIXTURES } from "./seed";

const webBaseUrl = process.env.E2E_WEB_BASE_URL || "http://localhost:3000";
const webOrigin = new URL(webBaseUrl);

type UserRole = "admin" | "teacher" | "student" | "guardian";

async function loginAsRole(page: Page, role: UserRole, email: string): Promise<void> {
  await page.context().clearCookies();

  const response = await page.request.post(`${webBaseUrl}/api/v1/testing/session`, {
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

  const sessionCookies = response
    .headersArray()
    .filter((header) => header.name.toLowerCase() === "set-cookie")
    .map((header) => header.value.split(";", 2)[0])
    .map((cookie) => {
      const [name, ...valueParts] = cookie.split("=");
      return {
        name,
        value: valueParts.join("="),
      };
    })
    .filter((cookie) => cookie.name.length > 0);

  if (sessionCookies.length > 0) {
    await page.context().addCookies(
      sessionCookies.map((cookie) => ({
        ...cookie,
        domain: webOrigin.hostname,
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
        secure: webOrigin.protocol === "https:",
      })),
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
  await page.request.delete(`${webBaseUrl}/api/v1/testing/session`);
  await page.context().clearCookies();
}
