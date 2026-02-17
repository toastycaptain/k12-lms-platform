import { expect, test, type Page } from "@playwright/test";
import { loginAsStudent, loginAsTeacher, signOutTestSession } from "./helpers/auth";
import { cleanupTestData, E2E_FIXTURES, seedTestData } from "./helpers/seed";

const apiBaseUrl = process.env.E2E_API_BASE_URL || "http://localhost:4000";

interface CourseRow {
  id: number;
  name: string;
}

interface CreatedResource {
  id: number;
}

interface QuizAnalyticsResponse {
  total_attempts: number;
  item_analysis: Array<{ question_id: number }>;
}

interface AttemptRecord {
  id: number;
  status: string;
}

async function readJson<T>(page: Page, path: string): Promise<T> {
  const response = await page.request.get(`${apiBaseUrl}${path}`);
  if (!response.ok()) {
    throw new Error(`GET ${path} failed: ${response.status()} ${await response.text()}`);
  }
  return (await response.json()) as T;
}

async function postJson<T>(page: Page, path: string, data: Record<string, unknown>): Promise<T> {
  const response = await page.request.post(`${apiBaseUrl}${path}`, { data });
  if (!response.ok()) {
    throw new Error(`POST ${path} failed: ${response.status()} ${await response.text()}`);
  }
  return (await response.json()) as T;
}

async function createPublishedQuiz(page: Page): Promise<{ courseId: number; quizId: number }> {
  const stamp = Date.now();
  const courses = await readJson<CourseRow[]>(page, "/api/v1/courses");
  const course = courses.find((row) => row.name === E2E_FIXTURES.courseName);
  if (!course) {
    throw new Error(`Course '${E2E_FIXTURES.courseName}' not found for assessment flow.`);
  }

  const bank = await postJson<CreatedResource>(page, "/api/v1/question_banks", {
    title: `E2E Quiz Bank ${stamp}`,
    description: "Created by Playwright assessment flow",
    subject: "Science",
    grade_level: "9",
  });

  const question = await postJson<CreatedResource>(
    page,
    `/api/v1/question_banks/${bank.id}/questions`,
    {
      question_type: "true_false",
      prompt: `E2E True/False Question ${stamp}: Cells contain DNA.`,
      points: 5,
      status: "active",
      correct_answer: { value: true },
    },
  );

  const quiz = await postJson<CreatedResource>(page, `/api/v1/courses/${course.id}/quizzes`, {
    title: `E2E Quiz ${stamp}`,
    description: "Created by Playwright assessment test",
  });

  await postJson(page, `/api/v1/quizzes/${quiz.id}/quiz_items`, {
    question_id: question.id,
    position: 0,
    points: 5,
  });
  await postJson(page, `/api/v1/quizzes/${quiz.id}/publish`, {});

  return { courseId: course.id, quizId: quiz.id };
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

test("teacher quiz creation, attempt, and analytics visibility", async ({ page }) => {
  await loginAsTeacher(page);
  const quiz = await createPublishedQuiz(page);
  await signOutTestSession(page);

  await loginAsStudent(page);
  const attempt = await postJson<AttemptRecord>(
    page,
    `/api/v1/quizzes/${quiz.quizId}/attempts`,
    {},
  );
  const submitted = await postJson<AttemptRecord>(
    page,
    `/api/v1/quiz_attempts/${attempt.id}/submit`,
    {},
  );
  expect(submitted.status).toBe("graded");

  await signOutTestSession(page);
  await loginAsTeacher(page);

  const analytics = await readJson<QuizAnalyticsResponse>(
    page,
    `/api/v1/quizzes/${quiz.quizId}/analytics`,
  );
  expect(analytics.total_attempts).toBeGreaterThan(0);
  expect(analytics.item_analysis.length).toBeGreaterThan(0);

  await page.goto(`/teach/courses/${quiz.courseId}/quizzes/${quiz.quizId}/analytics`);
  await expect(page.getByRole("heading", { name: "Quiz Analytics" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Item Analysis" })).toBeVisible();
});
