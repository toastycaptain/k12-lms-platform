import { type Page } from "@playwright/test";
import { E2E_FIXTURES } from "./seed";

const defaultWebPort = process.env.E2E_WEB_PORT || "3200";
const defaultApiPort = process.env.E2E_API_PORT || "4200";
const webBaseUrl = process.env.E2E_WEB_BASE_URL || `http://localhost:${defaultWebPort}`;
const apiBaseUrl = process.env.E2E_API_BASE_URL || `http://localhost:${defaultApiPort}`;
const webOrigin = new URL(webBaseUrl);

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
        url: webBaseUrl,
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

export async function loginAsSpecialist(page: Page): Promise<void> {
  await loginAsRole(page, "teacher", E2E_FIXTURES.specialistEmail);
}

export async function loginAsStudent(page: Page): Promise<void> {
  await loginAsRole(page, "student", E2E_FIXTURES.studentEmail);
}

export async function loginAsAdmin(page: Page): Promise<void> {
  await loginAsRole(page, "admin", E2E_FIXTURES.adminEmail);
}

export async function loginAsCoordinator(page: Page): Promise<void> {
  await loginAsRole(page, "admin", E2E_FIXTURES.coordinatorEmail);
}

export async function loginAsDirector(page: Page): Promise<void> {
  await loginAsRole(page, "admin", E2E_FIXTURES.directorEmail);
}

export async function loginAsMypTeacher(page: Page): Promise<void> {
  await loginAsRole(page, "teacher", E2E_FIXTURES.mypTeacherEmail);
}

export async function loginAsDpTeacher(page: Page): Promise<void> {
  await loginAsRole(page, "teacher", E2E_FIXTURES.dpTeacherEmail);
}

export async function loginAsCasAdvisor(page: Page): Promise<void> {
  await loginAsRole(page, "teacher", E2E_FIXTURES.casAdvisorEmail);
}

export async function loginAsEeSupervisor(page: Page): Promise<void> {
  await loginAsRole(page, "teacher", E2E_FIXTURES.eeSupervisorEmail);
}

export async function loginAsTokTeacher(page: Page): Promise<void> {
  await loginAsRole(page, "teacher", E2E_FIXTURES.tokTeacherEmail);
}

export async function loginAsGuardian(page: Page): Promise<void> {
  await loginAsRole(page, "guardian", E2E_FIXTURES.guardianEmail);
}

export async function loginAsMultiChildGuardian(page: Page): Promise<void> {
  await loginAsRole(page, "guardian", E2E_FIXTURES.guardianMultiChildEmail);
}

export async function loginAsPrimaryStudent(page: Page): Promise<void> {
  await loginAsRole(page, "student", E2E_FIXTURES.primaryStudentEmail);
}

export async function loginAsMiddleYearsStudent(page: Page): Promise<void> {
  await loginAsRole(page, "student", E2E_FIXTURES.middleYearsStudentEmail);
}

export async function loginAsDiplomaStudent(page: Page): Promise<void> {
  await loginAsRole(page, "student", E2E_FIXTURES.diplomaStudentEmail);
}

export async function signOutTestSession(page: Page): Promise<void> {
  await page.request.delete(`${apiBaseUrl}/api/v1/testing/session`);
  await page.context().clearCookies();
}
