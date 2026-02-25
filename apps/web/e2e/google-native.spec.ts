import { expect, test, type Page } from "@playwright/test";
import { loginAsTeacher, signOutTestSession } from "./helpers/auth";
import { cleanupTestData, E2E_FIXTURES, seedTestData } from "./helpers/seed";

const apiBaseUrl = process.env.E2E_API_BASE_URL || "http://localhost:4000";

interface CourseRow {
  id: number;
  name: string;
}

interface AssignmentRow {
  id: number;
}

async function readJson<T>(page: Page, path: string): Promise<T> {
  const response = await page.request.get(`${apiBaseUrl}${path}`);
  if (!response.ok()) {
    throw new Error(`GET ${path} failed: ${response.status()} ${await response.text()}`);
  }

  return (await response.json()) as T;
}

async function createDraftAssignment(page: Page, courseId: number, title: string): Promise<number> {
  const response = await page.request.post(`${apiBaseUrl}/api/v1/courses/${courseId}/assignments`, {
    data: {
      title,
      description: "E2E Google Drive assignment",
      assignment_type: "written",
      points_possible: 10,
    },
  });

  if (!response.ok()) {
    throw new Error(
      `POST /api/v1/courses/${courseId}/assignments failed: ${response.status()} ${await response.text()}`,
    );
  }

  const assignment = (await response.json()) as AssignmentRow;
  return assignment.id;
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

test("teacher can attach a Google Drive link to an assignment resource list", async ({ page }) => {
  await loginAsTeacher(page);

  const courses = await readJson<CourseRow[]>(page, "/api/v1/courses");
  const course = courses.find((row) => row.name === E2E_FIXTURES.courseName);
  expect(course).toBeTruthy();
  if (!course) return;

  const assignmentId = await createDraftAssignment(
    page,
    course.id,
    `E2E Drive Assignment ${Date.now()}`,
  );

  await page.goto(`/teach/courses/${course.id}/assignments/${assignmentId}`);

  const manualTitle = `Drive Worksheet ${Date.now()}`;
  const driveUrl = `https://drive.google.com/file/d/e2e-${Date.now()}/view`;

  await page.getByLabel("Resource Title").fill(manualTitle);
  await page.getByLabel("Resource URL").fill(driveUrl);
  await page.getByRole("button", { name: "Attach URL" }).click();

  await expect(page.getByRole("link", { name: manualTitle })).toBeVisible();
});

test("teacher can open Google Drive picker when Google integration is enabled", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const actionKey = "action";
    const docsKey = "docs";
    const pickedAction = "picked";

    const pickerApi = {
      Action: { PICKED: pickedAction },
      Response: { ACTION: actionKey, DOCUMENTS: docsKey },
      Document: { ID: "id", NAME: "name", MIME_TYPE: "mimeType", URL: "url" },
      Feature: { MULTISELECT_ENABLED: "MULTISELECT_ENABLED" },
      ViewId: { DOCS: "DOCS", PRESENTATIONS: "PRESENTATIONS", SPREADSHEETS: "SPREADSHEETS" },
      PickerBuilder: function PickerBuilder() {
        let callback: ((data: Record<string, unknown>) => void) | null = null;

        return {
          setDeveloperKey() {
            return this;
          },
          setAppId() {
            return this;
          },
          addView() {
            return this;
          },
          setOAuthToken() {
            return this;
          },
          setCallback(cb: (data: Record<string, unknown>) => void) {
            callback = cb;
            return this;
          },
          enableFeature() {
            return this;
          },
          build() {
            return {
              setVisible(isVisible: boolean) {
                if (!isVisible || !callback) return;

                callback({
                  [actionKey]: pickedAction,
                  [docsKey]: [
                    {
                      id: "mock-drive-id",
                      name: "E2E Mocked Drive Doc",
                      mimeType: "application/pdf",
                      url: "https://drive.google.com/file/d/mock-drive-id/view",
                    },
                  ],
                });
              },
            };
          },
        };
      },
    };

    (window as unknown as { gapi: Record<string, unknown> }).gapi = {
      load: (_name: string, cb: () => void) => cb(),
    };
    (window as unknown as { google: Record<string, unknown> }).google = { picker: pickerApi };
  });

  await page.route(`${apiBaseUrl}/api/v1/drive/picker_token`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        api_key: "test-api-key",
        app_id: "test-app-id",
        access_token: "test-access-token",
      }),
    });
  });

  await loginAsTeacher(page);

  const courses = await readJson<CourseRow[]>(page, "/api/v1/courses");
  const course = courses.find((row) => row.name === E2E_FIXTURES.courseName);
  expect(course).toBeTruthy();
  if (!course) return;

  const assignmentId = await createDraftAssignment(page, course.id, `E2E Picker ${Date.now()}`);
  await page.goto(`/teach/courses/${course.id}/assignments/${assignmentId}`);

  const pickerButton = page.getByText("Attach from Google Drive").first();
  if (!(await pickerButton.isVisible())) {
    test.skip();
    return;
  }

  await pickerButton.click();
  await expect(page.getByRole("link", { name: "E2E Mocked Drive Doc" })).toBeVisible();
});
