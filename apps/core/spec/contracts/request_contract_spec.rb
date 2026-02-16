require "rails_helper"
require "yaml"

RSpec.describe "Request contracts", type: :request do
  let(:spec_path) { File.expand_path("../../../../packages/contracts/core-v1.openapi.yaml", __dir__) }
  let(:openapi) { YAML.safe_load(File.read(spec_path), permitted_classes: [ Date, Time ]) }
  let(:tenant) { create(:tenant) }
  let(:teacher) { create(:user, tenant: tenant) }
  let(:teacher_role) { create(:role, tenant: tenant, name: "teacher") }
  let(:student) { create(:user, tenant: tenant) }
  let(:student_role) { create(:role, tenant: tenant, name: "student") }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }

  before do
    create(:user_role, user: teacher, role: teacher_role, tenant: tenant)
    create(:user_role, user: student, role: student_role, tenant: tenant)
    mock_session(teacher, tenant: tenant)
  end

  def schema_keys_for(schema_name)
    schema = openapi.dig("components", "schemas", schema_name)
    return [] unless schema && schema["properties"]

    schema["properties"].keys
  end

  def required_keys_for(schema_name)
    schema = openapi.dig("components", "schemas", schema_name)
    return [] unless schema

    schema["required"] || []
  end

  def assert_contract(payload, schema_name)
    required = required_keys_for(schema_name)
    declared = schema_keys_for(schema_name)

    required.each do |key|
      expect(payload).to have_key(key), "Response missing required key '#{key}' from #{schema_name}"
    end

    payload.each_key do |key|
      expect(declared).to include(key),
        "Response contains undeclared key '#{key}' not in #{schema_name} (keys: #{declared.join(', ')})"
    end
  end

  def documented_operation_for(method, request_path)
    method = method.to_s.downcase

    openapi.fetch("paths").each do |path_template, operations|
      next unless operations.is_a?(Hash)
      next unless operations.key?(method)

      matcher = Regexp.new("\\A#{Regexp.escape(path_template).gsub("\\{", "{").gsub("\\}", "}").gsub(/\{[^}]+\}/, "[^/]+")}\\z")
      return operations[method] if matcher.match?(request_path)
    end

    nil
  end

  def assert_status_documented(method, request_path)
    operation = documented_operation_for(method, request_path)
    expect(operation).not_to be_nil, "No OpenAPI operation found for #{method.upcase} #{request_path}"

    response_codes = operation.fetch("responses", {}).keys
    expect(response_codes).to include(response.status.to_s),
      "Status #{response.status} for #{method.upcase} #{request_path} not documented (documented: #{response_codes.join(', ')})"
  end

  describe "GET /api/v1/courses" do
    it "returns responses matching Course schema" do
      term = create(:term, tenant: tenant, academic_year: academic_year)
      section = create(:section, tenant: tenant, course: course, term: term)
      create(:enrollment, tenant: tenant, section: section, user: teacher, role: "teacher")

      get "/api/v1/courses"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body).to be_an(Array)
      expect(body).not_to be_empty
      assert_status_documented(:get, "/api/v1/courses")
      assert_contract(body.first, "Course")
    end
  end

  describe "GET /api/v1/courses/{id}" do
    it "returns response matching Course schema" do
      term = create(:term, tenant: tenant, academic_year: academic_year)
      section = create(:section, tenant: tenant, course: course, term: term)
      create(:enrollment, tenant: tenant, section: section, user: teacher, role: "teacher")

      get "/api/v1/courses/#{course.id}"

      expect(response).to have_http_status(:ok)
      assert_status_documented(:get, "/api/v1/courses/#{course.id}")
      assert_contract(response.parsed_body, "Course")
    end
  end

  describe "GET /api/v1/assignments/{id}/submissions" do
    it "returns responses matching Submission schema" do
      term = create(:term, tenant: tenant, academic_year: academic_year)
      section = create(:section, tenant: tenant, course: course, term: term)
      create(:enrollment, tenant: tenant, section: section, user: teacher, role: "teacher")
      assignment = create(:assignment, tenant: tenant, course: course, created_by: teacher)
      create(:submission, tenant: tenant, assignment: assignment, user: student)

      get "/api/v1/assignments/#{assignment.id}/submissions"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body).to be_an(Array)
      assert_status_documented(:get, "/api/v1/assignments/#{assignment.id}/submissions")
      assert_contract(body.first, "Submission")
    end
  end

  describe "GET /api/v1/notifications" do
    it "returns responses matching Notification schema" do
      create(:notification, tenant: tenant, user: teacher, actor: student)

      get "/api/v1/notifications"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body).to be_an(Array)
      assert_status_documented(:get, "/api/v1/notifications")
      assert_contract(body.first, "Notification")
    end
  end

  describe "GET /api/v1/unit_plans" do
    it "returns responses matching UnitPlan schema" do
      create(:unit_plan, tenant: tenant, course: course, created_by: teacher)

      get "/api/v1/unit_plans"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body).to be_an(Array)
      assert_status_documented(:get, "/api/v1/unit_plans")
      assert_contract(body.first, "UnitPlan")
    end
  end

  describe "GET /api/v1/academic_years" do
    it "returns responses matching AcademicYear schema" do
      create(:academic_year, tenant: tenant)

      get "/api/v1/academic_years"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body).to be_an(Array)
      expect(body).not_to be_empty
      assert_status_documented(:get, "/api/v1/academic_years")
      assert_contract(body.first, "AcademicYear")
    end
  end

  describe "GET /api/v1/quizzes/{id}" do
    it "returns responses matching Quiz schema" do
      term = create(:term, tenant: tenant, academic_year: academic_year)
      section = create(:section, tenant: tenant, course: course, term: term)
      create(:enrollment, tenant: tenant, section: section, user: teacher, role: "teacher")
      quiz = create(:quiz, tenant: tenant, course: course, created_by: teacher)

      get "/api/v1/quizzes/#{quiz.id}"

      expect(response).to have_http_status(:ok)
      assert_status_documented(:get, "/api/v1/quizzes/#{quiz.id}")
      assert_contract(response.parsed_body, "Quiz")
    end
  end

  describe "GET /api/v1/discussions/{id}" do
    it "returns responses matching Discussion schema" do
      term = create(:term, tenant: tenant, academic_year: academic_year)
      section = create(:section, tenant: tenant, course: course, term: term)
      create(:enrollment, tenant: tenant, section: section, user: teacher, role: "teacher")
      discussion = create(:discussion, tenant: tenant, course: course, created_by: teacher)

      get "/api/v1/discussions/#{discussion.id}"

      expect(response).to have_http_status(:ok)
      assert_status_documented(:get, "/api/v1/discussions/#{discussion.id}")
      assert_contract(response.parsed_body, "Discussion")
    end
  end

  describe "GET /api/v1/message_threads/{id}" do
    it "returns responses matching MessageThread schema" do
      thread = create(:message_thread, tenant: tenant, course: course)
      create(:message_thread_participant, tenant: tenant, message_thread: thread, user: teacher)
      create(:message_thread_participant, tenant: tenant, message_thread: thread, user: student)
      create(:message, tenant: tenant, message_thread: thread, sender: teacher)

      get "/api/v1/message_threads/#{thread.id}"

      expect(response).to have_http_status(:ok)
      assert_status_documented(:get, "/api/v1/message_threads/#{thread.id}")
      assert_contract(response.parsed_body, "MessageThread")
    end
  end

  describe "GET /api/v1/users/{id}" do
    it "returns responses matching User schema" do
      admin = create(:user, tenant: tenant)
      admin_role = create(:role, tenant: tenant, name: "admin")
      create(:user_role, user: admin, role: admin_role, tenant: tenant)
      mock_session(admin, tenant: tenant)

      get "/api/v1/users/#{teacher.id}"

      expect(response).to have_http_status(:ok)
      assert_status_documented(:get, "/api/v1/users/#{teacher.id}")
      assert_contract(response.parsed_body, "User")
    end
  end

  describe "GET /api/v1/ai_task_policies" do
    it "returns responses matching AiTaskPolicy schema" do
      provider = create(:ai_provider_config, tenant: tenant, created_by: teacher)
      create(:ai_task_policy, tenant: tenant, created_by: teacher, ai_provider_config: provider)

      get "/api/v1/ai_task_policies"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body).to be_an(Array)
      expect(body).not_to be_empty
      assert_status_documented(:get, "/api/v1/ai_task_policies")
      assert_contract(body.first, "AiTaskPolicy")
    end
  end
end
