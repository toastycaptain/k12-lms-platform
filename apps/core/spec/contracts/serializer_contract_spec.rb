require "rails_helper"

RSpec.describe "Serializer contracts", type: :model do
  let(:tenant) { create(:tenant) }
  let(:current_user) { create(:user, tenant: tenant) }
  let(:forbidden_keys) do
    %w[
      password_digest
      encrypted_password
      reset_password_token
      confirmation_token
      api_key
      secret
      access_token
      refresh_token
      session_token
    ]
  end

  before do
    Current.tenant = tenant
    Current.user = current_user
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  def serialize(record, serializer: nil, **options)
    resource_options = options.dup
    resource_options[:serializer] = serializer if serializer
    raw = ActiveModelSerializers::SerializableResource.new(record, **resource_options).as_json
    JSON.parse(raw.to_json)
  end

  it "validates CourseSerializer contract" do
    academic_year = create(:academic_year, tenant: tenant)
    course = create(:course, tenant: tenant, academic_year: academic_year)
    term = create(:term, tenant: tenant, academic_year: academic_year)
    create(:section, tenant: tenant, course: course, term: term)

    payload = serialize(course)

    expect(payload.keys).to include(
      "id", "name", "code", "description", "academic_year_id", "sections", "created_at", "updated_at"
    )
    expect(payload["sections"]).to be_an(Array)
    expect(payload["id"]).to be_a(Integer)
    expect(payload["created_at"]).to be_a(String)
    forbidden_keys.each { |key| expect(payload).not_to have_key(key) }
  end

  it "validates UnitPlanSerializer contract" do
    academic_year = create(:academic_year, tenant: tenant)
    course = create(:course, tenant: tenant, academic_year: academic_year)
    unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: current_user)

    payload = serialize(unit_plan)

    expect(payload.keys).to include(
      "id", "title", "status", "course_id", "created_by_id", "current_version_id", "start_date", "end_date", "created_at", "updated_at"
    )
    expect(payload["id"]).to be_a(Integer)
    expect(payload["current_version_id"]).to be_nil
    forbidden_keys.each { |key| expect(payload).not_to have_key(key) }
  end

  it "validates AssignmentSerializer contract" do
    academic_year = create(:academic_year, tenant: tenant)
    course = create(:course, tenant: tenant, academic_year: academic_year)
    assignment = create(:assignment, tenant: tenant, course: course, created_by: current_user, due_at: nil)

    payload = serialize(assignment)

    expect(payload.keys).to include(
      "id", "course_id", "created_by_id", "rubric_id", "title", "description", "instructions", "assignment_type",
      "points_possible", "due_at", "status", "standard_ids", "created_at", "updated_at"
    )
    expect(payload["standard_ids"]).to be_an(Array)
    expect(payload["due_at"]).to be_nil
    forbidden_keys.each { |key| expect(payload).not_to have_key(key) }
  end

  it "validates QuizSerializer contract" do
    academic_year = create(:academic_year, tenant: tenant)
    course = create(:course, tenant: tenant, academic_year: academic_year)
    quiz = create(:quiz, tenant: tenant, course: course, created_by: current_user)

    payload = serialize(quiz)

    expect(payload.keys).to include(
      "id", "tenant_id", "course_id", "created_by_id", "title", "description", "quiz_type", "time_limit_minutes", "attempts_allowed", "status", "created_at", "updated_at"
    )
    expect(payload["id"]).to be_a(Integer)
    expect(payload["tenant_id"]).to eq(tenant.id)
    forbidden_keys.each { |key| expect(payload).not_to have_key(key) }
  end

  it "validates UserSerializer contract" do
    role = create(:role, tenant: tenant, name: "teacher")
    user = create(:user, tenant: tenant)
    create(:user_role, user: user, role: role, tenant: tenant)

    payload = serialize(user)

    expect(payload.keys).to include(
      "id", "email", "first_name", "last_name", "tenant_id", "roles", "created_at", "updated_at"
    )
    expect(payload["roles"]).to be_an(Array)
    expect(payload["roles"]).to include("teacher")
    forbidden_keys.each { |key| expect(payload).not_to have_key(key) }
  end

  it "validates NotificationSerializer contract" do
    notification = create(:notification, tenant: tenant, user: current_user, actor: current_user, read_at: nil)

    payload = serialize(notification)

    expect(payload.keys).to include(
      "id", "user_id", "actor_id", "notification_type", "title", "message", "url", "metadata", "read_at", "created_at", "updated_at"
    )
    expect(payload["read_at"]).to be_nil
    forbidden_keys.each { |key| expect(payload).not_to have_key(key) }
  end

  it "validates SubmissionSerializer contract" do
    academic_year = create(:academic_year, tenant: tenant)
    course = create(:course, tenant: tenant, academic_year: academic_year)
    assignment = create(:assignment, tenant: tenant, course: course, created_by: current_user)
    student = create(:user, tenant: tenant)
    submission = create(:submission, tenant: tenant, assignment: assignment, user: student, feedback: nil)

    payload = serialize(submission)

    expect(payload.keys).to include(
      "id", "assignment_id", "user_id", "submission_type", "body", "status", "submitted_at", "grade", "feedback", "created_at", "updated_at"
    )
    expect(payload["id"]).to be_a(Integer)
    expect(payload["feedback"]).to be_nil
    forbidden_keys.each { |key| expect(payload).not_to have_key(key) }
  end

  it "validates SectionSerializer contract" do
    academic_year = create(:academic_year, tenant: tenant)
    course = create(:course, tenant: tenant, academic_year: academic_year)
    term = create(:term, tenant: tenant, academic_year: academic_year)
    section = create(:section, tenant: tenant, course: course, term: term)

    payload = serialize(section)

    expect(payload.keys).to include("id", "name", "course_id", "term_id", "created_at", "updated_at")
    expect(payload["id"]).to be_a(Integer)
    forbidden_keys.each { |key| expect(payload).not_to have_key(key) }
  end

  it "validates EnrollmentSerializer contract" do
    academic_year = create(:academic_year, tenant: tenant)
    course = create(:course, tenant: tenant, academic_year: academic_year)
    term = create(:term, tenant: tenant, academic_year: academic_year)
    section = create(:section, tenant: tenant, course: course, term: term)
    student = create(:user, tenant: tenant)
    enrollment = create(:enrollment, tenant: tenant, section: section, user: student, role: "student")

    payload = serialize(enrollment)

    expect(payload.keys).to include("id", "user_id", "section_id", "role", "created_at", "updated_at")
    expect(payload["role"]).to eq("student")
    forbidden_keys.each { |key| expect(payload).not_to have_key(key) }
  end

  it "validates MessageThreadSerializer contract" do
    academic_year = create(:academic_year, tenant: tenant)
    course = create(:course, tenant: tenant, academic_year: academic_year)
    thread = create(:message_thread, tenant: tenant, course: course)
    participant = create(:user, tenant: tenant)
    create(:message_thread_participant, tenant: tenant, message_thread: thread, user: current_user)
    create(:message_thread_participant, tenant: tenant, message_thread: thread, user: participant)
    create(:message, tenant: tenant, message_thread: thread, sender: current_user, body: "First")

    payload = serialize(thread)

    expect(payload.keys).to include(
      "id", "course_id", "course_name", "subject", "thread_type", "participants", "last_message", "messages", "unread_count", "created_at", "updated_at"
    )
    expect(payload["participants"]).to be_an(Array)
    expect(payload["participants"].first).to include("id", "first_name", "last_name", "roles")
    expect(payload["last_message"]).to be_a(Hash)
    expect(payload["messages"]).to be_nil
    forbidden_keys.each { |key| expect(payload).not_to have_key(key) }
  end

  it "validates MessageSerializer contract" do
    thread = create(:message_thread, tenant: tenant)
    message = create(:message, tenant: tenant, message_thread: thread, sender: current_user)

    payload = serialize(message)

    expect(payload.keys).to include("id", "message_thread_id", "sender_id", "body", "sender", "created_at", "updated_at")
    expect(payload["sender"]).to include("id", "first_name", "last_name", "roles")
    forbidden_keys.each { |key| expect(payload).not_to have_key(key) }
  end

  it "validates RubricSerializer contract" do
    rubric = create(:rubric, tenant: tenant, created_by: current_user)
    create(:rubric_criterion, tenant: tenant, rubric: rubric)

    payload = serialize(rubric)

    expect(payload.keys).to include("id", "created_by_id", "title", "description", "points_possible", "rubric_criteria", "created_at", "updated_at")
    expect(payload["rubric_criteria"]).to be_an(Array)
    forbidden_keys.each { |key| expect(payload).not_to have_key(key) }
  end

  it "validates QuizAttemptSerializer contract" do
    academic_year = create(:academic_year, tenant: tenant)
    course = create(:course, tenant: tenant, academic_year: academic_year)
    quiz = create(:quiz, tenant: tenant, course: course, created_by: current_user, status: "published")
    attempt = create(:quiz_attempt, tenant: tenant, quiz: quiz, user: current_user)

    payload = serialize(attempt)

    expect(payload.keys).to include(
      "id", "tenant_id", "quiz_id", "user_id", "attempt_number", "status",
      "score", "percentage", "started_at", "submitted_at", "time_spent_seconds",
      "effective_time_limit", "created_at", "updated_at"
    )
    expect(payload["id"]).to be_a(Integer)
    expect(payload["tenant_id"]).to eq(tenant.id)
    expect(payload["quiz_id"]).to eq(quiz.id)
    expect(payload["attempt_number"]).to be_a(Integer)
    expect(payload["status"]).to be_a(String)
    expect(payload["score"]).to be_nil
    expect(payload["created_at"]).to be_a(String)
    forbidden_keys.each { |key| expect(payload).not_to have_key(key) }
  end

  it "validates QuestionSerializer contract" do
    question_bank = create(:question_bank, tenant: tenant, created_by: current_user)
    question = create(:question, tenant: tenant, question_bank: question_bank, created_by: current_user)

    payload = serialize(question)

    expect(payload.keys).to include(
      "id", "tenant_id", "question_bank_id", "created_by_id", "question_type",
      "prompt", "choices", "points", "position", "status", "created_at", "updated_at"
    )
    expect(payload["id"]).to be_a(Integer)
    expect(payload["tenant_id"]).to eq(tenant.id)
    expect(payload["question_type"]).to be_a(String)
    expect(payload["prompt"]).to be_a(String)
    expect(payload["points"]).to be_present
    expect(payload["status"]).to be_a(String)
    expect(payload["created_at"]).to be_a(String)
    forbidden_keys.each { |key| expect(payload).not_to have_key(key) }
  end

  it "validates RubricScoreSerializer contract" do
    academic_year = create(:academic_year, tenant: tenant)
    course = create(:course, tenant: tenant, academic_year: academic_year)
    assignment = create(:assignment, tenant: tenant, course: course, created_by: current_user)
    rubric = create(:rubric, tenant: tenant, created_by: current_user)
    criterion = create(:rubric_criterion, tenant: tenant, rubric: rubric)
    student = create(:user, tenant: tenant)
    submission = create(:submission, tenant: tenant, assignment: assignment, user: student)
    rubric_score = create(:rubric_score, tenant: tenant, submission: submission, rubric_criterion: criterion)

    payload = serialize(rubric_score)

    expect(payload.keys).to include(
      "id", "submission_id", "rubric_criterion_id", "points_awarded", "comments", "created_at", "updated_at"
    )
    expect(payload["id"]).to be_a(Integer)
    expect(payload["submission_id"]).to eq(submission.id)
    expect(payload["rubric_criterion_id"]).to eq(criterion.id)
    expect(payload["comments"]).to be_nil
    expect(payload["created_at"]).to be_a(String)
    forbidden_keys.each { |key| expect(payload).not_to have_key(key) }
  end

  # Strict type assertions for existing serializers
  it "validates CourseSerializer types strictly" do
    academic_year = create(:academic_year, tenant: tenant)
    course = create(:course, tenant: tenant, academic_year: academic_year, code: nil, description: nil)
    term = create(:term, tenant: tenant, academic_year: academic_year)
    create(:section, tenant: tenant, course: course, term: term)

    payload = serialize(course)

    expect(payload["id"]).to be_a(Integer)
    expect(payload["name"]).to be_a(String)
    expect(payload["code"]).to be_nil
    expect(payload["description"]).to be_nil
    expect(payload["academic_year_id"]).to be_a(Integer)
    expect(payload["sections"]).to be_an(Array)
    expect(payload["sections"].first).to include("id", "name", "course_id", "term_id")
    expect(payload["created_at"]).to match(/\d{4}-\d{2}-\d{2}/)
    expect(payload["updated_at"]).to match(/\d{4}-\d{2}-\d{2}/)
  end

  it "validates AssignmentSerializer nullable fields" do
    academic_year = create(:academic_year, tenant: tenant)
    course = create(:course, tenant: tenant, academic_year: academic_year)
    assignment = create(:assignment, tenant: tenant, course: course, created_by: current_user,
      due_at: nil, unlock_at: nil, lock_at: nil, rubric: nil, points_possible: nil)

    payload = serialize(assignment)

    expect(payload["due_at"]).to be_nil
    expect(payload["unlock_at"]).to be_nil
    expect(payload["lock_at"]).to be_nil
    expect(payload["rubric_id"]).to be_nil
    expect(payload["points_possible"]).to be_nil
    expect(payload["id"]).to be_a(Integer)
    expect(payload["title"]).to be_a(String)
    expect(payload["assignment_type"]).to be_a(String)
    expect(payload["status"]).to be_a(String)
  end

  it "validates SubmissionSerializer nullable fields" do
    academic_year = create(:academic_year, tenant: tenant)
    course = create(:course, tenant: tenant, academic_year: academic_year)
    assignment = create(:assignment, tenant: tenant, course: course, created_by: current_user)
    student = create(:user, tenant: tenant)
    submission = create(:submission, tenant: tenant, assignment: assignment, user: student,
      feedback: nil, grade: nil, graded_at: nil, graded_by: nil)

    payload = serialize(submission)

    expect(payload["feedback"]).to be_nil
    expect(payload["grade"]).to be_nil
    expect(payload["graded_at"]).to be_nil
    expect(payload["graded_by_id"]).to be_nil
    expect(payload["id"]).to be_a(Integer)
    expect(payload["assignment_id"]).to be_a(Integer)
    expect(payload["user_id"]).to be_a(Integer)
    expect(payload["status"]).to be_a(String)
  end
end
