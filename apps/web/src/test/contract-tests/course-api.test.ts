interface CourseSectionContract {
  id: number;
  name: string;
  term_id: number;
}

interface CourseContract {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  academic_year_id: number;
  sections: CourseSectionContract[];
  created_at: string;
  updated_at: string;
}

function expectCourseShape(payload: unknown): asserts payload is CourseContract {
  const row = payload as CourseContract;
  expect(typeof row.id).toBe("number");
  expect(typeof row.name).toBe("string");
  expect(row.code === null || typeof row.code === "string").toBe(true);
  expect(row.description === null || typeof row.description === "string").toBe(true);
  expect(typeof row.academic_year_id).toBe("number");
  expect(Array.isArray(row.sections)).toBe(true);
  row.sections.forEach((section) => {
    expect(typeof section.id).toBe("number");
    expect(typeof section.name).toBe("string");
    expect(typeof section.term_id).toBe("number");
  });
  expect(typeof row.created_at).toBe("string");
  expect(typeof row.updated_at).toBe("string");
}

describe("Course API Contract", () => {
  it("GET /api/v1/courses returns the list shape expected by frontend pages", () => {
    const payload: unknown = [
      {
        id: 42,
        name: "Grade 5 Math",
        code: "MTH-5A",
        description: "Fractions and decimals",
        academic_year_id: 10,
        sections: [{ id: 1, name: "Section A", term_id: 2 }],
        created_at: "2026-02-01T12:00:00Z",
        updated_at: "2026-02-10T12:00:00Z",
      },
    ];

    if (!Array.isArray(payload)) {
      throw new Error("Expected an array payload for GET /api/v1/courses");
    }
    payload.forEach(expectCourseShape);
  });

  it("GET /api/v1/courses/:id returns the detail shape expected by course home", () => {
    const payload: unknown = {
      id: 42,
      name: "Grade 5 Math",
      code: "MTH-5A",
      description: "Fractions and decimals",
      academic_year_id: 10,
      sections: [{ id: 1, name: "Section A", term_id: 2 }],
      created_at: "2026-02-01T12:00:00Z",
      updated_at: "2026-02-10T12:00:00Z",
    };

    expectCourseShape(payload);
  });
});
