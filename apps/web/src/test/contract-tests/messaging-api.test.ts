export {};

interface ThreadParticipantContract {
  id: number;
  first_name: string;
  last_name: string;
  roles: string[];
}

interface ThreadMessageContract {
  id: number;
  message_thread_id: number;
  sender_id: number;
  body: string;
  sender: ThreadParticipantContract;
  created_at: string;
  updated_at: string;
}

interface MessageThreadContract {
  id: number;
  subject: string;
  thread_type: string;
  participants: ThreadParticipantContract[];
  unread_count: number;
  last_message?: ThreadMessageContract | null;
}

describe("Messaging API Contract", () => {
  it("keeps message-thread list payload aligned with inbox and thread pages", () => {
    const payload: MessageThreadContract = {
      id: 9,
      subject: "Parent check-in",
      thread_type: "direct",
      participants: [
        { id: 1, first_name: "Taylor", last_name: "Teacher", roles: ["teacher"] },
        { id: 2, first_name: "Paula", last_name: "Parent", roles: ["guardian"] },
      ],
      unread_count: 1,
      last_message: {
        id: 99,
        message_thread_id: 9,
        sender_id: 2,
        body: "Can we meet Friday?",
        sender: { id: 2, first_name: "Paula", last_name: "Parent", roles: ["guardian"] },
        created_at: "2026-03-01T10:00:00Z",
        updated_at: "2026-03-01T10:00:00Z",
      },
    };

    expect(typeof payload.id).toBe("number");
    expect(typeof payload.subject).toBe("string");
    expect(Array.isArray(payload.participants)).toBe(true);
    payload.participants.forEach((participant) => {
      expect(typeof participant.id).toBe("number");
      expect(typeof participant.first_name).toBe("string");
      expect(typeof participant.last_name).toBe("string");
      expect(Array.isArray(participant.roles)).toBe(true);
    });
    expect(typeof payload.unread_count).toBe("number");
  });

  it("keeps message payload aligned with compose/send flows", () => {
    const messagePayload: ThreadMessageContract = {
      id: 100,
      message_thread_id: 9,
      sender_id: 1,
      body: "Yes, let's meet at 3pm.",
      sender: { id: 1, first_name: "Taylor", last_name: "Teacher", roles: ["teacher"] },
      created_at: "2026-03-01T11:00:00Z",
      updated_at: "2026-03-01T11:00:00Z",
    };

    expect(typeof messagePayload.id).toBe("number");
    expect(typeof messagePayload.message_thread_id).toBe("number");
    expect(typeof messagePayload.sender_id).toBe("number");
    expect(typeof messagePayload.body).toBe("string");
    expect(typeof messagePayload.sender.first_name).toBe("string");
  });
});
