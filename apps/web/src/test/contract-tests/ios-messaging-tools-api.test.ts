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
  course_id?: number | null;
  course_name?: string | null;
  subject: string;
  thread_type: string;
  participants: ThreadParticipantContract[];
  last_message?: ThreadMessageContract | null;
  messages?: ThreadMessageContract[] | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

function assertParticipantShape(participant: ThreadParticipantContract) {
  expect(typeof participant.id).toBe("number");
  expect(typeof participant.first_name).toBe("string");
  expect(typeof participant.last_name).toBe("string");
  expect(Array.isArray(participant.roles)).toBe(true);
}

describe("iOS Messaging Tools API Contract", () => {
  it("supports inbox tool payload (thread list)", () => {
    const payload: MessageThreadContract = {
      id: 42,
      course_id: 7,
      course_name: "ELA 7",
      subject: "Weekly check-in",
      thread_type: "direct",
      participants: [
        { id: 11, first_name: "Taylor", last_name: "Teacher", roles: ["teacher"] },
        { id: 19, first_name: "Paula", last_name: "Parent", roles: ["guardian"] },
      ],
      last_message: {
        id: 211,
        message_thread_id: 42,
        sender_id: 19,
        body: "Can we review this week's missing work?",
        sender: { id: 19, first_name: "Paula", last_name: "Parent", roles: ["guardian"] },
        created_at: "2026-02-28T18:45:00Z",
        updated_at: "2026-02-28T18:45:00Z",
      },
      messages: null,
      unread_count: 1,
      created_at: "2026-02-21T16:00:00Z",
      updated_at: "2026-02-28T18:45:00Z",
    };

    expect(typeof payload.id).toBe("number");
    expect(typeof payload.subject).toBe("string");
    expect(Array.isArray(payload.participants)).toBe(true);
    payload.participants.forEach(assertParticipantShape);
    expect(typeof payload.unread_count).toBe("number");
    expect(typeof payload.created_at).toBe("string");
    expect(typeof payload.updated_at).toBe("string");
  });

  it("supports thread tool payload (message list)", () => {
    const payload: ThreadMessageContract[] = [
      {
        id: 211,
        message_thread_id: 42,
        sender_id: 19,
        body: "Can we review this week's missing work?",
        sender: { id: 19, first_name: "Paula", last_name: "Parent", roles: ["guardian"] },
        created_at: "2026-02-28T18:45:00Z",
        updated_at: "2026-02-28T18:45:00Z",
      },
      {
        id: 212,
        message_thread_id: 42,
        sender_id: 11,
        body: "Yes, let's connect tomorrow at 3 PM.",
        sender: { id: 11, first_name: "Taylor", last_name: "Teacher", roles: ["teacher"] },
        created_at: "2026-02-28T19:12:00Z",
        updated_at: "2026-02-28T19:12:00Z",
      },
    ];

    expect(Array.isArray(payload)).toBe(true);
    payload.forEach((message) => {
      expect(typeof message.id).toBe("number");
      expect(typeof message.message_thread_id).toBe("number");
      expect(typeof message.sender_id).toBe("number");
      expect(typeof message.body).toBe("string");
      assertParticipantShape(message.sender);
      expect(typeof message.created_at).toBe("string");
      expect(typeof message.updated_at).toBe("string");
    });
  });

  it("supports send tool payload (message create response)", () => {
    const payload: ThreadMessageContract = {
      id: 213,
      message_thread_id: 42,
      sender_id: 11,
      body: "I can also share assignment feedback in the portal.",
      sender: { id: 11, first_name: "Taylor", last_name: "Teacher", roles: ["teacher"] },
      created_at: "2026-02-28T19:15:00Z",
      updated_at: "2026-02-28T19:15:00Z",
    };

    expect(typeof payload.id).toBe("number");
    expect(typeof payload.message_thread_id).toBe("number");
    expect(typeof payload.sender_id).toBe("number");
    expect(typeof payload.body).toBe("string");
    assertParticipantShape(payload.sender);
    expect(typeof payload.created_at).toBe("string");
    expect(typeof payload.updated_at).toBe("string");
  });
});
