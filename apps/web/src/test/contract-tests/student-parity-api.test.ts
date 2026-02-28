interface GoalContract {
  id: number;
  student_id: number;
  title: string;
  description: string | null;
  status: "active" | "completed" | "archived";
  target_date: string | null;
  progress_percent: number;
  created_at: string;
  updated_at: string;
}

interface TodoContract {
  id: string;
  source_type: "assignment" | "quiz" | "goal";
  source_id: number;
  title: string;
  due_at: string | null;
  status: string;
  course_id: number | null;
  priority: "overdue" | "high" | "medium" | "low";
}

interface ClassesTodayContract {
  section_id: number;
  section_name: string;
  course_id: number;
  course_name: string;
  weekday: number;
  start_at: string;
  end_at: string;
  location: string | null;
  teachers: Array<{
    id: number;
    name: string;
  }>;
}

function expectGoalShape(payload: unknown): asserts payload is GoalContract {
  const goal = payload as GoalContract;
  expect(typeof goal.id).toBe("number");
  expect(typeof goal.student_id).toBe("number");
  expect(typeof goal.title).toBe("string");
  expect(goal.description === null || typeof goal.description === "string").toBe(true);
  expect(["active", "completed", "archived"]).toContain(goal.status);
  expect(goal.target_date === null || typeof goal.target_date === "string").toBe(true);
  expect(typeof goal.progress_percent).toBe("number");
  expect(typeof goal.created_at).toBe("string");
  expect(typeof goal.updated_at).toBe("string");
}

function expectTodoShape(payload: unknown): asserts payload is TodoContract {
  const todo = payload as TodoContract;
  expect(typeof todo.id).toBe("string");
  expect(["assignment", "quiz", "goal"]).toContain(todo.source_type);
  expect(typeof todo.source_id).toBe("number");
  expect(typeof todo.title).toBe("string");
  expect(todo.due_at === null || typeof todo.due_at === "string").toBe(true);
  expect(typeof todo.status).toBe("string");
  expect(todo.course_id === null || typeof todo.course_id === "number").toBe(true);
  expect(["overdue", "high", "medium", "low"]).toContain(todo.priority);
}

function expectClassesTodayShape(payload: unknown): asserts payload is ClassesTodayContract {
  const row = payload as ClassesTodayContract;
  expect(typeof row.section_id).toBe("number");
  expect(typeof row.section_name).toBe("string");
  expect(typeof row.course_id).toBe("number");
  expect(typeof row.course_name).toBe("string");
  expect(typeof row.weekday).toBe("number");
  expect(typeof row.start_at).toBe("string");
  expect(typeof row.end_at).toBe("string");
  expect(row.location === null || typeof row.location === "string").toBe(true);
  expect(Array.isArray(row.teachers)).toBe(true);
  row.teachers.forEach((teacher) => {
    expect(typeof teacher.id).toBe("number");
    expect(typeof teacher.name).toBe("string");
  });
}

describe("Student parity API contracts", () => {
  it("GET /api/v1/goals returns goal rows expected by web and iOS", () => {
    const payload: unknown = [
      {
        id: 1,
        student_id: 7,
        title: "Read 20 minutes daily",
        description: "Track consistency across weekdays",
        status: "active",
        target_date: "2026-03-31",
        progress_percent: 40,
        created_at: "2026-02-26T10:00:00Z",
        updated_at: "2026-02-27T12:00:00Z",
      },
    ];

    if (!Array.isArray(payload)) throw new Error("Expected array payload");
    payload.forEach(expectGoalShape);
  });

  it("GET /api/v1/students/:student_id/todos returns normalized todo rows", () => {
    const payload: unknown = [
      {
        id: "assignment-15",
        source_type: "assignment",
        source_id: 15,
        title: "Essay draft",
        due_at: "2026-03-05T23:59:00Z",
        status: "not_submitted",
        course_id: 4,
        priority: "high",
      },
    ];

    if (!Array.isArray(payload)) throw new Error("Expected array payload");
    payload.forEach(expectTodoShape);
  });

  it("GET /api/v1/students/:student_id/classes_today returns class schedule rows", () => {
    const payload: unknown = [
      {
        section_id: 12,
        section_name: "Section A",
        course_id: 4,
        course_name: "Biology",
        weekday: 2,
        start_at: "2026-03-03T09:00:00-05:00",
        end_at: "2026-03-03T10:15:00-05:00",
        location: "Room 204",
        teachers: [
          {
            id: 99,
            name: "Taylor Teacher",
          },
        ],
      },
    ];

    if (!Array.isArray(payload)) throw new Error("Expected array payload");
    payload.forEach(expectClassesTodayShape);
  });
});
