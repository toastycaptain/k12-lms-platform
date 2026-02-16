interface AssignmentContract {
  id: number;
  course_id: number;
  created_by_id: number;
  title: string;
  description: string | null;
  assignment_type: string;
  points_possible: number | null;
  due_at: string | null;
  status: string;
  standard_ids: number[];
  created_at: string;
  updated_at: string;
}

function expectAssignmentShape(payload: unknown): asserts payload is AssignmentContract {
  const row = payload as AssignmentContract;
  expect(typeof row.id).toBe("number");
  expect(typeof row.course_id).toBe("number");
  expect(typeof row.created_by_id).toBe("number");
  expect(typeof row.title).toBe("string");
  expect(row.description === null || typeof row.description === "string").toBe(true);
  expect(typeof row.assignment_type).toBe("string");
  expect(row.points_possible === null || typeof row.points_possible === "number").toBe(true);
  expect(row.due_at === null || typeof row.due_at === "string").toBe(true);
  expect(typeof row.status).toBe("string");
  expect(Array.isArray(row.standard_ids)).toBe(true);
  expect(typeof row.created_at).toBe("string");
  expect(typeof row.updated_at).toBe("string");
}

describe("Assignment API Contract", () => {
  it("uses a consistent assignment shape for list/show/create/update responses", () => {
    const payload: unknown = {
      id: 15,
      course_id: 42,
      created_by_id: 7,
      title: "Fraction Exit Ticket",
      description: "Solve 5 fraction problems",
      assignment_type: "homework",
      points_possible: 10,
      due_at: "2026-02-20T16:00:00Z",
      status: "draft",
      standard_ids: [11, 12],
      created_at: "2026-02-01T12:00:00Z",
      updated_at: "2026-02-01T12:00:00Z",
    };

    expectAssignmentShape(payload);
  });

  it("supports nullable fields consumed by grading and submissions UI", () => {
    const payload: unknown = {
      id: 15,
      course_id: 42,
      created_by_id: 7,
      title: "Fraction Exit Ticket",
      description: null,
      assignment_type: "homework",
      points_possible: null,
      due_at: null,
      status: "published",
      standard_ids: [],
      created_at: "2026-02-01T12:00:00Z",
      updated_at: "2026-02-01T12:00:00Z",
    };

    expectAssignmentShape(payload);
  });
});
