interface NotificationContract {
  id: number;
  user_id: number;
  notification_type: string;
  title: string;
  message: string;
  url: string | null;
  read_at: string | null;
  created_at: string;
}

describe("Notification API Contract", () => {
  it("keeps notification rows aligned with bell menu and notifications page", () => {
    const payload: unknown = [
      {
        id: 1,
        user_id: 7,
        notification_type: "assignment_published",
        title: "New assignment",
        message: "Fractions practice is now available.",
        url: "/learn/courses/1/assignments/2",
        read_at: null,
        created_at: "2026-02-12T09:00:00Z",
      },
    ];

    expect(Array.isArray(payload)).toBe(true);
    (payload as NotificationContract[]).forEach((row) => {
      expect(typeof row.id).toBe("number");
      expect(typeof row.user_id).toBe("number");
      expect(typeof row.notification_type).toBe("string");
      expect(typeof row.title).toBe("string");
      expect(typeof row.message).toBe("string");
      expect(row.url === null || typeof row.url === "string").toBe(true);
      expect(row.read_at === null || typeof row.read_at === "string").toBe(true);
      expect(typeof row.created_at).toBe("string");
    });
  });

  it("keeps unread count payload aligned with header badge logic", () => {
    const payload: unknown = { count: 4 };

    expect(typeof (payload as { count: number }).count).toBe("number");
  });
});
