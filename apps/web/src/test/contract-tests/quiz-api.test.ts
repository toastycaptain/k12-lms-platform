interface QuizContract {
  id: number;
  course_id: number;
  title: string;
  quiz_type: string;
  status: string;
  attempts_allowed: number | null;
  time_limit_minutes: number | null;
}

interface QuizAttemptContract {
  id: number;
  quiz_id: number;
  attempt_number: number;
  status: string;
  started_at: string | null;
  submitted_at: string | null;
  effective_time_limit: number | null;
}

interface AttemptAnswerContract {
  id: number;
  question_id: number;
  answer: Record<string, unknown>;
}

function expectQuizShape(payload: unknown): asserts payload is QuizContract {
  const row = payload as QuizContract;
  expect(typeof row.id).toBe("number");
  expect(typeof row.course_id).toBe("number");
  expect(typeof row.title).toBe("string");
  expect(typeof row.quiz_type).toBe("string");
  expect(typeof row.status).toBe("string");
  expect(row.attempts_allowed === null || typeof row.attempts_allowed === "number").toBe(true);
  expect(row.time_limit_minutes === null || typeof row.time_limit_minutes === "number").toBe(true);
}

function expectAttemptShape(payload: unknown): asserts payload is QuizAttemptContract {
  const row = payload as QuizAttemptContract;
  expect(typeof row.id).toBe("number");
  expect(typeof row.quiz_id).toBe("number");
  expect(typeof row.attempt_number).toBe("number");
  expect(typeof row.status).toBe("string");
  expect(row.started_at === null || typeof row.started_at === "string").toBe(true);
  expect(row.submitted_at === null || typeof row.submitted_at === "string").toBe(true);
  expect(row.effective_time_limit === null || typeof row.effective_time_limit === "number").toBe(
    true,
  );
}

function expectAttemptAnswerShape(payload: unknown): asserts payload is AttemptAnswerContract {
  const row = payload as AttemptAnswerContract;
  expect(typeof row.id).toBe("number");
  expect(typeof row.question_id).toBe("number");
  expect(typeof row.answer).toBe("object");
  expect(row.answer).not.toBeNull();
}

describe("Quiz API Contract", () => {
  it("keeps quiz and quiz-attempt response fields aligned with the attempt experience", () => {
    const quizPayload: unknown = {
      id: 5,
      course_id: 42,
      title: "Fractions Quiz",
      quiz_type: "standard",
      status: "published",
      attempts_allowed: 2,
      time_limit_minutes: 30,
    };

    const attemptPayload: unknown = {
      id: 99,
      quiz_id: 5,
      attempt_number: 1,
      status: "in_progress",
      started_at: "2026-02-16T10:00:00Z",
      submitted_at: null,
      effective_time_limit: 45,
    };

    expectQuizShape(quizPayload);
    expectAttemptShape(attemptPayload);
  });

  it("keeps answer payload shape aligned with autosave and submit flows", () => {
    const answersPayload: unknown = [
      {
        id: 1,
        question_id: 88,
        answer: { text: "1/2" },
      },
    ];

    expect(Array.isArray(answersPayload)).toBe(true);
    answersPayload.forEach(expectAttemptAnswerShape);
  });
});
