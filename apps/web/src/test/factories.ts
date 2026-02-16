// factories.ts — typed mock data for test suites

export function buildUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    email: "teacher@example.com",
    first_name: "Taylor",
    last_name: "Teacher",
    tenant_id: 1,
    roles: ["teacher"],
    google_connected: false,
    onboarding_complete: true,
    preferences: {},
    ...overrides,
  };
}

export function buildCourse(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: "Biology 101",
    code: "BIO-101",
    description: "Introductory biology",
    school_id: 1,
    teacher_id: 1,
    status: "active",
    ...overrides,
  };
}

export function buildUnitPlan(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: "Cell Biology",
    status: "draft",
    course_id: 1,
    grade_band: "9-10",
    subject: "Science",
    created_at: "2026-02-15T12:00:00Z",
    updated_at: "2026-02-15T12:00:00Z",
    ...overrides,
  };
}

export function buildLessonPlan(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: "Introduction to Cells",
    unit_plan_id: 1,
    position: 1,
    duration_minutes: 45,
    objectives: "Students will identify cell structures.",
    activities: "Lecture and lab.",
    materials: "Microscopes, slides",
    ...overrides,
  };
}

export function buildAssignment(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: "Cell Diagram",
    description: "Draw and label a cell diagram.",
    course_id: 1,
    module_id: 1,
    due_date: "2026-03-01T23:59:00Z",
    points_possible: 100,
    status: "published",
    submission_type: "online",
    ...overrides,
  };
}

export function buildQuiz(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: "Cell Biology Quiz",
    description: "Test on cell structures.",
    course_id: 1,
    time_limit_minutes: 30,
    attempts_allowed: 2,
    status: "published",
    questions_count: 10,
    ...overrides,
  };
}

export function buildQuizAttempt(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    quiz_id: 1,
    student_id: 2,
    status: "in_progress",
    started_at: "2026-02-15T10:00:00Z",
    finished_at: null,
    score: null,
    answers: [],
    ...overrides,
  };
}

export function buildQuestion(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    question_bank_id: 1,
    question_type: "multiple_choice",
    prompt: "What is the powerhouse of the cell?",
    options: [
      { id: "a", text: "Mitochondria" },
      { id: "b", text: "Nucleus" },
      { id: "c", text: "Ribosome" },
      { id: "d", text: "Golgi apparatus" },
    ],
    correct_answer: "a",
    points: 10,
    ...overrides,
  };
}

export function buildNotification(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: "New Assignment",
    message: "Cell Diagram has been posted.",
    url: "/learn/courses/1/assignments/1",
    read_at: null,
    created_at: "2026-02-15T10:00:00Z",
    ...overrides,
  };
}

export function buildSchool(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: "Lincoln High School",
    slug: "lincoln-high",
    ...overrides,
  };
}

export function buildModule(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: "Module 1: Foundations",
    course_id: 1,
    position: 1,
    status: "published",
    items: [],
    ...overrides,
  };
}

export function buildStandard(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    code: "NGSS-MS-LS1-1",
    description:
      "Conduct an investigation to provide evidence that living things are made of cells.",
    subject: "Science",
    grade_band: "6-8",
    framework: "NGSS",
    ...overrides,
  };
}

export function buildSubmission(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    assignment_id: 1,
    student_id: 2,
    student_name: "Sam Student",
    status: "submitted",
    submitted_at: "2026-02-14T15:00:00Z",
    grade: null,
    feedback: null,
    ...overrides,
  };
}

export function buildMessage(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    subject: "Question about homework",
    body: "Can I get an extension?",
    sender_id: 2,
    sender_name: "Sam Student",
    recipient_id: 1,
    read_at: null,
    created_at: "2026-02-15T09:00:00Z",
    ...overrides,
  };
}

export function buildAnnouncement(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: "Welcome to the course",
    body: "Please review the syllabus.",
    course_id: 1,
    author_id: 1,
    author_name: "Taylor Teacher",
    created_at: "2026-02-10T08:00:00Z",
    ...overrides,
  };
}

export function buildThread(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    subject: "Question about homework",
    participants: [
      { id: 1, name: "Taylor Teacher" },
      { id: 2, name: "Sam Student" },
    ],
    last_message_at: "2026-02-15T09:00:00Z",
    unread_count: 1,
    ...overrides,
  };
}

export function buildSearchResult(overrides: Record<string, unknown> = {}) {
  return {
    type: "unit_plan",
    id: 1,
    title: "Cell Biology",
    url: "/plan/units/1",
    ...overrides,
  };
}

export function buildAiTaskPolicy(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    task_type: "lesson_plan",
    enabled: true,
    ...overrides,
  };
}

export function buildSamlConfig(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    idp_entity_id: "https://idp.example.com/saml",
    idp_sso_url: "https://idp.example.com/sso",
    idp_certificate: "MIICpDCCAYwCCQD...",
    sp_entity_id: "https://lms.example.com/saml/metadata",
    enabled: true,
    ...overrides,
  };
}
