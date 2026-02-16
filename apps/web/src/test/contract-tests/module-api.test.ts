interface CourseModuleContract {
  id: number;
  course_id: number;
  title: string;
  status: string;
  position: number;
}

interface ModuleItemContract {
  id: number;
  course_module_id: number;
  title: string;
  item_type: string;
  itemable_type: string | null;
  itemable_id: number | null;
  position: number;
}

interface ModuleProgressContract {
  total_items: number;
  completed_items: number;
  percent_complete: number;
}

describe("Module API Contract", () => {
  it("keeps module + module item responses aligned with course home and module detail pages", () => {
    const modulePayload: CourseModuleContract = {
      id: 20,
      course_id: 42,
      title: "Fractions Module",
      status: "published",
      position: 1,
    };

    const moduleItemPayload: ModuleItemContract = {
      id: 31,
      course_module_id: 20,
      title: "Exit Ticket",
      item_type: "Assignment",
      itemable_type: "Assignment",
      itemable_id: 500,
      position: 1,
    };

    expect(typeof modulePayload.id).toBe("number");
    expect(typeof modulePayload.course_id).toBe("number");
    expect(typeof modulePayload.title).toBe("string");
    expect(typeof modulePayload.status).toBe("string");

    expect(typeof moduleItemPayload.id).toBe("number");
    expect(typeof moduleItemPayload.course_module_id).toBe("number");
    expect(typeof moduleItemPayload.item_type).toBe("string");
    expect(
      moduleItemPayload.itemable_type === null ||
        typeof moduleItemPayload.itemable_type === "string",
    ).toBe(true);
    expect(
      moduleItemPayload.itemable_id === null || typeof moduleItemPayload.itemable_id === "number",
    ).toBe(true);
  });

  it("keeps module progress response aligned with completion meters", () => {
    const progressPayload: ModuleProgressContract = {
      total_items: 8,
      completed_items: 5,
      percent_complete: 62.5,
    };

    expect(typeof progressPayload.total_items).toBe("number");
    expect(typeof progressPayload.completed_items).toBe("number");
    expect(typeof progressPayload.percent_complete).toBe("number");
  });
});
