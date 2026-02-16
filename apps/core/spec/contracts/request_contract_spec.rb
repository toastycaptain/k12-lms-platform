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
      assert_contract(body.first, "UnitPlan")
    end
  end
end
