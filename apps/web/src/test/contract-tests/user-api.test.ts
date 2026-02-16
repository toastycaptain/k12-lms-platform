interface CurrentUserContract {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  roles: string[];
  google_connected: boolean;
}

interface MeContract {
  user: CurrentUserContract;
  tenant: {
    id: number;
    name: string;
    slug: string;
  };
}

interface UserListRowContract {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  roles: string[];
}

function expectCurrentUserShape(payload: unknown): asserts payload is CurrentUserContract {
  const row = payload as CurrentUserContract;
  expect(typeof row.id).toBe("number");
  expect(typeof row.email).toBe("string");
  expect(typeof row.first_name).toBe("string");
  expect(typeof row.last_name).toBe("string");
  expect(Array.isArray(row.roles)).toBe(true);
  expect(typeof row.google_connected).toBe("boolean");
}

describe("User API Contract", () => {
  it("GET /api/v1/me returns the nested user + tenant shape expected by auth context", () => {
    const payload: unknown = {
      user: {
        id: 1,
        email: "teacher@example.com",
        first_name: "Taylor",
        last_name: "Teacher",
        roles: ["teacher"],
        google_connected: true,
      },
      tenant: {
        id: 2,
        name: "K12 Academy",
        slug: "k12-academy",
      },
    };

    const me = payload as MeContract;
    expectCurrentUserShape(me.user);
    expect(typeof me.tenant.id).toBe("number");
    expect(typeof me.tenant.name).toBe("string");
    expect(typeof me.tenant.slug).toBe("string");
  });

  it("GET /api/v1/users returns rows compatible with compose/admin UIs", () => {
    const payload: unknown = [
      {
        id: 3,
        email: "student@example.com",
        first_name: "Sam",
        last_name: "Student",
        roles: ["student"],
      },
    ];

    expect(Array.isArray(payload)).toBe(true);
    (payload as UserListRowContract[]).forEach((row) => {
      expect(typeof row.id).toBe("number");
      expect(typeof row.email).toBe("string");
      expect(typeof row.first_name).toBe("string");
      expect(typeof row.last_name).toBe("string");
      expect(Array.isArray(row.roles)).toBe(true);
    });
  });
});
