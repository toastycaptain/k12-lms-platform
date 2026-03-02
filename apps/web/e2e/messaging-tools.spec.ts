import { expect, test, type APIRequestContext, type APIResponse } from "@playwright/test";
import {
  loginAsAdmin,
  loginAsGuardian,
  loginAsStudent,
  loginAsTeacher,
  signOutTestSession,
} from "./helpers/auth";
import { cleanupTestData, E2E_FIXTURES, seedTestData } from "./helpers/seed";

const apiBaseUrl = process.env.E2E_API_BASE_URL || "http://localhost:4000";
const IOS_INTEROP_SUBJECT = "Playwright iOS Messaging Interop";

type AppRole = "teacher" | "student" | "guardian";

interface UserRow {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  roles: string[];
}

interface GuardianLink {
  id: number;
  guardian_id: number;
  student_id: number;
  relationship: string;
  status: string;
}

interface ThreadParticipant {
  id: number;
  first_name: string;
  last_name: string;
  roles: string[];
}

interface ThreadMessage {
  id: number;
  message_thread_id: number;
  sender_id: number;
  body: string;
  sender: ThreadParticipant;
  created_at: string;
  updated_at: string;
}

interface MessageThread {
  id: number;
  subject: string;
  thread_type: string;
  participants: ThreadParticipant[];
  unread_count: number;
  last_message: ThreadMessage | null;
  created_at: string;
  updated_at: string;
}

interface Identities {
  teacherId: number;
  studentId: number;
  guardianId: number;
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

async function expectOk(response: APIResponse, action: string): Promise<void> {
  if (!response.ok()) {
    throw new Error(`${action} failed: ${response.status()} ${await response.text()}`);
  }
}

async function expectJson<T>(response: APIResponse, action: string): Promise<T> {
  await expectOk(response, action);
  return (await response.json()) as T;
}

async function listThreads(request: APIRequestContext): Promise<MessageThread[]> {
  const response = await request.get(`${apiBaseUrl}/api/v1/message_threads?page=1&per_page=100`);
  return expectJson<MessageThread[]>(response, "list threads");
}

async function listMessages(
  request: APIRequestContext,
  threadId: number,
): Promise<ThreadMessage[]> {
  const response = await request.get(
    `${apiBaseUrl}/api/v1/message_threads/${threadId}/messages?page=1&per_page=100`,
  );
  return expectJson<ThreadMessage[]>(response, "list messages");
}

async function sendMessage(
  request: APIRequestContext,
  threadId: number,
  body: string,
): Promise<ThreadMessage> {
  const response = await request.post(`${apiBaseUrl}/api/v1/message_threads/${threadId}/messages`, {
    data: { body },
  });
  return expectJson<ThreadMessage>(response, "send message");
}

async function ensureGuardianAndLink(request: APIRequestContext): Promise<Identities> {
  const users = await expectJson<UserRow[]>(
    await request.get(`${apiBaseUrl}/api/v1/users`),
    "load users",
  );

  const teacher = users.find((entry) => entry.email === E2E_FIXTURES.teacherEmail);
  const student = users.find((entry) => entry.email === E2E_FIXTURES.studentEmail);

  if (!teacher || !student) {
    throw new Error("Expected seeded teacher/student users to exist");
  }

  let guardian = users.find((entry) => entry.email === E2E_FIXTURES.guardianEmail);
  if (!guardian) {
    guardian = await expectJson<UserRow>(
      await request.post(`${apiBaseUrl}/api/v1/users`, {
        data: {
          user: {
            email: E2E_FIXTURES.guardianEmail,
            first_name: "E2E",
            last_name: "Guardian",
            roles: ["guardian"],
          },
        },
      }),
      "create guardian",
    );
  }

  const existingLinks = await expectJson<GuardianLink[]>(
    await request.get(`${apiBaseUrl}/api/v1/guardian_links?student_id=${student.id}`),
    "load guardian links",
  );

  const hasActiveLink = existingLinks.some(
    (entry) =>
      entry.guardian_id === guardian.id &&
      entry.student_id === student.id &&
      entry.status === "active",
  );

  if (!hasActiveLink) {
    await expectOk(
      await request.post(`${apiBaseUrl}/api/v1/guardian_links`, {
        data: {
          guardian_id: guardian.id,
          student_id: student.id,
          relationship: "guardian",
          status: "active",
        },
      }),
      "create guardian link",
    );
  }

  return {
    teacherId: teacher.id,
    studentId: student.id,
    guardianId: guardian.id,
  };
}

async function ensureInteropThread(request: APIRequestContext, ids: Identities): Promise<number> {
  const existing = await listThreads(request);
  const found = existing.find((thread) => thread.subject === IOS_INTEROP_SUBJECT);
  if (found) {
    return found.id;
  }

  const created = await expectJson<MessageThread>(
    await request.post(`${apiBaseUrl}/api/v1/message_threads`, {
      data: {
        subject: IOS_INTEROP_SUBJECT,
        thread_type: "direct",
        participant_ids: [ids.studentId, ids.guardianId],
      },
    }),
    "create interop thread",
  );

  await sendMessage(request, created.id, `Seed message from teacher for interop ${Date.now()}`);

  return created.id;
}

async function runIosToolAssertions(
  request: APIRequestContext,
  role: AppRole,
  threadId: number,
): Promise<void> {
  const threads = await listThreads(request);
  const thread = threads.find((entry) => entry.id === threadId);
  expect(thread, `${role} listThreads should include interop thread`).toBeDefined();

  const beforeMessages = await listMessages(request, threadId);
  expect(beforeMessages.length).toBeGreaterThan(0);

  const marker = `[${role}] playwright tool message ${Date.now()}`;
  const created = await sendMessage(request, threadId, marker);

  expect(created.message_thread_id).toBe(threadId);
  expect(created.body).toContain(marker);
  expect(typeof created.sender_id).toBe("number");

  const afterMessages = await listMessages(request, threadId);
  expect(afterMessages.some((entry) => entry.id === created.id)).toBeTruthy();
}

test("iOS messaging tools work across Teacher, Student, and Family personas", async ({ page }) => {
  await loginAsAdmin(page);
  const identities = await ensureGuardianAndLink(page.request);
  await signOutTestSession(page);

  await loginAsTeacher(page);
  const threadId = await ensureInteropThread(page.request, identities);
  await runIosToolAssertions(page.request, "teacher", threadId);
  await signOutTestSession(page);

  await loginAsStudent(page);
  await runIosToolAssertions(page.request, "student", threadId);
  await signOutTestSession(page);

  await loginAsGuardian(page);
  await runIosToolAssertions(page.request, "guardian", threadId);
});

test("webapp messaging tool supports compose, send, and reply", async ({ page }) => {
  await loginAsTeacher(page);

  const subject = `Playwright Web Messaging ${Date.now()}`;
  const initialMessage = `Initial web message ${Date.now()}`;
  const followupMessage = `Follow-up web message ${Date.now()}`;

  await page.goto("/communicate");
  await page.getByRole("tab", { name: "Messages" }).click();
  await expect(page.getByRole("heading", { name: "Message Threads" })).toBeVisible();

  await page.getByRole("link", { name: "New Message" }).click();
  await expect(page.getByRole("heading", { name: "Compose Message" })).toBeVisible();

  await page.getByLabel("Subject").fill(subject);
  await page.getByLabel("Recipients").fill("student@e2e.local");

  const recipientOption = page.getByRole("button", { name: /E2E Student/i }).first();
  await expect(recipientOption).toBeVisible();
  await recipientOption.click();

  await page.getByLabel("Message").fill(initialMessage);
  await page.getByRole("button", { name: /^Send$/ }).click();

  await expect(page).toHaveURL(/\/communicate\/threads\/\d+$/);
  await expect(page.getByText(initialMessage)).toBeVisible();

  await page.getByPlaceholder("Write a message").fill(followupMessage);
  await page.getByRole("button", { name: /^Send$/ }).click();
  await expect(page.getByText(followupMessage)).toBeVisible();

  await page.goto("/communicate");
  await page.getByRole("tab", { name: "Messages" }).click();
  await expect(page.getByRole("link", { name: new RegExp(subject) })).toBeVisible();
});
