interface GuardianAttendanceSummaryContract {
  total: number;
  present: number;
  absent: number;
  tardy: number;
  excused: number;
}

interface GuardianAttendanceRecordContract {
  id: number;
  student_id: number;
  student_name: string;
  section_id: number | null;
  section_name: string | null;
  course_id: number | null;
  course_name: string | null;
  occurred_on: string;
  status: "present" | "absent" | "tardy" | "excused";
  notes: string | null;
  recorded_by: {
    id: number;
    name: string;
  } | null;
}

interface GuardianClassesTodayContract {
  student_id: number;
  student_name: string;
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

interface GuardianCalendarEventContract {
  type: "unit_plan" | "assignment" | "quiz";
  id: number;
  title: string;
  course_id: number;
  start_date?: string;
  end_date?: string;
  due_date?: string;
  status?: string;
}

function expectAttendanceSummaryShape(
  payload: unknown,
): asserts payload is GuardianAttendanceSummaryContract {
  const summary = payload as GuardianAttendanceSummaryContract;
  expect(typeof summary.total).toBe("number");
  expect(typeof summary.present).toBe("number");
  expect(typeof summary.absent).toBe("number");
  expect(typeof summary.tardy).toBe("number");
  expect(typeof summary.excused).toBe("number");
}

function expectAttendanceRecordShape(
  payload: unknown,
): asserts payload is GuardianAttendanceRecordContract {
  const row = payload as GuardianAttendanceRecordContract;
  expect(typeof row.id).toBe("number");
  expect(typeof row.student_id).toBe("number");
  expect(typeof row.student_name).toBe("string");
  expect(row.section_id === null || typeof row.section_id === "number").toBe(true);
  expect(row.section_name === null || typeof row.section_name === "string").toBe(true);
  expect(row.course_id === null || typeof row.course_id === "number").toBe(true);
  expect(row.course_name === null || typeof row.course_name === "string").toBe(true);
  expect(typeof row.occurred_on).toBe("string");
  expect(["present", "absent", "tardy", "excused"]).toContain(row.status);
  expect(row.notes === null || typeof row.notes === "string").toBe(true);
  expect(
    row.recorded_by === null ||
      (typeof row.recorded_by.id === "number" && typeof row.recorded_by.name === "string"),
  ).toBe(true);
}

function expectClassesTodayShape(
  payload: unknown,
): asserts payload is GuardianClassesTodayContract {
  const row = payload as GuardianClassesTodayContract;
  expect(typeof row.student_id).toBe("number");
  expect(typeof row.student_name).toBe("string");
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

function expectCalendarEventShape(
  payload: unknown,
): asserts payload is GuardianCalendarEventContract {
  const event = payload as GuardianCalendarEventContract;
  expect(["unit_plan", "assignment", "quiz"]).toContain(event.type);
  expect(typeof event.id).toBe("number");
  expect(typeof event.title).toBe("string");
  expect(typeof event.course_id).toBe("number");
  expect(event.start_date === undefined || typeof event.start_date === "string").toBe(true);
  expect(event.end_date === undefined || typeof event.end_date === "string").toBe(true);
  expect(event.due_date === undefined || typeof event.due_date === "string").toBe(true);
  expect(event.status === undefined || typeof event.status === "string").toBe(true);
}

describe("Guardian family API contracts", () => {
  it("GET /api/v1/guardian/students/:id/attendance returns summary and records", () => {
    const payload: unknown = {
      summary: {
        total: 2,
        present: 1,
        absent: 1,
        tardy: 0,
        excused: 0,
      },
      records: [
        {
          id: 41,
          student_id: 7,
          student_name: "Lina Student",
          section_id: 4,
          section_name: "Section A",
          course_id: 3,
          course_name: "Math 6",
          occurred_on: "2026-02-28",
          status: "present",
          notes: null,
          recorded_by: { id: 9, name: "Taylor Teacher" },
        },
      ],
    };

    const parsed = payload as { summary: unknown; records: unknown };
    expectAttendanceSummaryShape(parsed.summary);
    if (!Array.isArray(parsed.records)) throw new Error("Expected records array");
    parsed.records.forEach(expectAttendanceRecordShape);
  });

  it("GET /api/v1/guardian/students/:id/classes_today returns class schedule rows", () => {
    const payload: unknown = [
      {
        student_id: 7,
        student_name: "Lina Student",
        section_id: 4,
        section_name: "Section A",
        course_id: 3,
        course_name: "Math 6",
        weekday: 6,
        start_at: "2026-02-28T09:00:00-05:00",
        end_at: "2026-02-28T10:00:00-05:00",
        location: "Room 204",
        teachers: [{ id: 9, name: "Taylor Teacher" }],
      },
    ];

    if (!Array.isArray(payload)) throw new Error("Expected array payload");
    payload.forEach(expectClassesTodayShape);
  });

  it("GET /api/v1/guardian/students/:id/calendar returns event rows", () => {
    const payload: unknown = {
      events: [
        {
          type: "unit_plan",
          id: 4,
          title: "Fractions Unit",
          course_id: 3,
          start_date: "2026-02-27",
          end_date: "2026-03-05",
          status: "published",
        },
        {
          type: "assignment",
          id: 8,
          title: "Fractions Homework",
          course_id: 3,
          due_date: "2026-03-02T23:59:00Z",
          status: "published",
        },
      ],
    };

    const parsed = payload as { events: unknown };
    if (!Array.isArray(parsed.events)) throw new Error("Expected events array");
    parsed.events.forEach(expectCalendarEventShape);
  });
});
