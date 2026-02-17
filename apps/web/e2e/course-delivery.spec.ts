import { expect, test, type Page } from "@playwright/test";
import { loginAsStudent, loginAsTeacher, signOutTestSession } from "./helpers/auth";
import { cleanupTestData, E2E_FIXTURES, seedTestData } from "./helpers/seed";

const apiBaseUrl = process.env.E2E_API_BASE_URL || "http://localhost:4000";

interface CourseRow {
  id: number;
  name: string;
}

interface SubmissionRow {
  id: number;
}

async function readJson<T>(page: Page, path: string): Promise<T> {
  const response = await page.request.get(`${apiBaseUrl}${path}`);
  if (!response.ok()) {
    throw new Error(`GET ${path} failed: ${response.status()} ${await response.text()}`);
  }
  return (await response.json()) as T;
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

test("teacher creates assignment, student submits, teacher grades, student sees feedback", async ({
  page,
}) => {
  const assignmentTitle = `E2E Assignment ${Date.now()}`;
  const feedback = "Excellent work on the response details.";

  await loginAsTeacher(page);
  const courses = await readJson<CourseRow[]>(page, "/api/v1/courses");
  const course = courses.find((row) => row.name === E2E_FIXTURES.courseName);
  expect(course).toBeTruthy();
  if (!course) return;

  await page.goto(`/teach/courses/${course.id}/assignments/new`);
  await page.getByLabel("Title").fill(assignmentTitle);
  await page.getByLabel("Points Possible").fill("100");
  await page.getByRole("button", { name: "Create Assignment" }).click();

  await expect(page.getByRole("heading", { name: "Assignment Editor" })).toBeVisible();
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Assignment published." })).toBeVisible();

  const match = page.url().match(/\/teach\/courses\/(\d+)\/assignments\/(\d+)/);
  expect(match).not.toBeNull();
  if (!match) return;
  const courseId = Number(match[1]);
  const assignmentId = Number(match[2]);

  await signOutTestSession(page);

  await loginAsStudent(page);
  await page.goto(`/learn/courses/${courseId}/assignments/${assignmentId}`);
  await page.getByLabel("Text Entry").fill("This is my E2E submission.");
  const submissionResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().endsWith(`/api/v1/assignments/${assignmentId}/submissions`),
  );
  await page.getByRole("button", { name: "Submit Assignment" }).click();
  const submissionResponse = await submissionResponsePromise;
  expect(submissionResponse.ok()).toBeTruthy();
  const submission = (await submissionResponse.json()) as SubmissionRow;
  expect(submission.id).toBeTruthy();
  await expect(page.getByText("Assignment submitted.")).toBeVisible();

  await signOutTestSession(page);

  await loginAsTeacher(page);
  const gradeResponse = await page.request.patch(
    `${apiBaseUrl}/api/v1/submissions/${submission.id}`,
    {
      data: {
        grade: 95,
        feedback,
      },
    },
  );
  expect(gradeResponse.ok()).toBeTruthy();

  await signOutTestSession(page);

  await loginAsStudent(page);
  await page.goto(`/learn/courses/${courseId}/assignments/${assignmentId}`);
  await expect(page.getByText(/Graded:/)).toBeVisible();
  await expect(page.getByText(feedback)).toBeVisible();
});
