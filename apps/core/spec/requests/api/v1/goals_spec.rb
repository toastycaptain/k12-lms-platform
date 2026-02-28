require "rails_helper"

RSpec.describe "Api::V1::Goals", type: :request do
  let(:tenant) { create(:tenant) }

  let(:student) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:student)
    Current.tenant = nil
    user
  end

  let(:other_student) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:student)
    Current.tenant = nil
    user
  end

  let(:teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    Current.tenant = nil
    user
  end

  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:section) { create(:section, tenant: tenant, course: course, term: term) }

  before do
    Current.tenant = tenant
    create(:enrollment, tenant: tenant, user: student, section: section, role: "student")
    create(:enrollment, tenant: tenant, user: teacher, section: section, role: "teacher")
    Current.tenant = nil
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/goals" do
    it "returns only the current student's goals" do
      Current.tenant = tenant
      own_goal = create(:goal, tenant: tenant, student: student, title: "Own")
      create(:goal, tenant: tenant, student: other_student, title: "Other")
      Current.tenant = nil

      mock_session(student, tenant: tenant)
      get "/api/v1/goals"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.map { |row| row["id"] }).to contain_exactly(own_goal.id)
    end

    it "returns shared student goals for teachers" do
      Current.tenant = tenant
      shared_goal = create(:goal, tenant: tenant, student: student, title: "Shared")
      create(:goal, tenant: tenant, student: other_student, title: "Not Shared")
      Current.tenant = nil

      mock_session(teacher, tenant: tenant)
      get "/api/v1/goals"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.map { |row| row["id"] }).to contain_exactly(shared_goal.id)
    end
  end

  describe "POST /api/v1/goals" do
    it "creates a goal for the signed-in student" do
      mock_session(student, tenant: tenant)

      post "/api/v1/goals", params: {
        title: "Improve reading",
        description: "Read 20 minutes daily",
        status: "active",
        progress_percent: 10
      }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["title"]).to eq("Improve reading")
      expect(response.parsed_body["student_id"]).to eq(student.id)
    end

    it "forbids teachers" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/goals", params: { title: "Teacher goal" }

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "PATCH /api/v1/goals/:id" do
    it "updates own goal for student" do
      Current.tenant = tenant
      goal = create(:goal, tenant: tenant, student: student, progress_percent: 10)
      Current.tenant = nil

      mock_session(student, tenant: tenant)
      patch "/api/v1/goals/#{goal.id}", params: { progress_percent: 55 }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["progress_percent"]).to eq(55)
    end

    it "forbids updating another student's goal" do
      Current.tenant = tenant
      goal = create(:goal, tenant: tenant, student: other_student)
      Current.tenant = nil

      mock_session(student, tenant: tenant)
      patch "/api/v1/goals/#{goal.id}", params: { progress_percent: 90 }

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "DELETE /api/v1/goals/:id" do
    it "deletes own goal" do
      Current.tenant = tenant
      goal = create(:goal, tenant: tenant, student: student)
      Current.tenant = nil

      mock_session(student, tenant: tenant)
      delete "/api/v1/goals/#{goal.id}"

      expect(response).to have_http_status(:no_content)
    end
  end
end
