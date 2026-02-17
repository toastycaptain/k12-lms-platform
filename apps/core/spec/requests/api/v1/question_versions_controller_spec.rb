require "rails_helper"

RSpec.describe "Api::V1::QuestionVersions", type: :request do
  let(:tenant) { create(:tenant) }

  let(:owner_teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    Current.tenant = nil
    user
  end

  let(:other_teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    Current.tenant = nil
    user
  end

  let(:student) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:student)
    Current.tenant = nil
    user
  end

  let(:question_bank) { create(:question_bank, tenant: tenant, created_by: owner_teacher) }
  let(:question) { create(:question, tenant: tenant, question_bank: question_bank, created_by: owner_teacher) }

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/questions/:question_id/question_versions" do
    it "returns versions ordered by latest first" do
      mock_session(owner_teacher, tenant: tenant)
      Current.tenant = tenant
      older = create(:question_version, tenant: tenant, question: question, created_by: owner_teacher, version_number: 1)
      newer = create(:question_version, tenant: tenant, question: question, created_by: owner_teacher, version_number: 2)
      Current.tenant = nil

      get "/api/v1/questions/#{question.id}/question_versions"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.map { |row| row["id"] }).to eq([ newer.id, older.id ])
    end

    it "returns forbidden for non-owners" do
      mock_session(other_teacher, tenant: tenant)

      get "/api/v1/questions/#{question.id}/question_versions"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/v1/questions/:question_id/question_versions/:id" do
    it "returns a single version" do
      mock_session(owner_teacher, tenant: tenant)
      Current.tenant = tenant
      version = create(:question_version, tenant: tenant, question: question, created_by: owner_teacher)
      Current.tenant = nil

      get "/api/v1/questions/#{question.id}/question_versions/#{version.id}"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["id"]).to eq(version.id)
    end
  end

  describe "POST /api/v1/questions/:question_id/question_versions" do
    it "creates a new version for owning teacher" do
      mock_session(owner_teacher, tenant: tenant)

      expect {
        post "/api/v1/questions/#{question.id}/question_versions", params: {
          question_type: question.question_type,
          content: "Updated version content",
          choices: question.choices,
          correct_answer: question.correct_answer,
          points: 2.0,
          status: "draft"
        }
      }.to change(QuestionVersion.unscoped, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["version_number"]).to eq(1)
      expect(question.reload.current_version_id).to eq(response.parsed_body["id"])
    end

    it "returns forbidden for student users" do
      mock_session(student, tenant: tenant)

      post "/api/v1/questions/#{question.id}/question_versions", params: {
        question_type: question.question_type,
        content: "Updated version content"
      }

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/questions/:id/create_version" do
    it "creates a version from question snapshot" do
      mock_session(owner_teacher, tenant: tenant)

      post "/api/v1/questions/#{question.id}/create_version"

      expect(response).to have_http_status(:created)
      body = response.parsed_body
      expect(body["question_type"]).to eq(question.question_type)
      expect(body["content"]).to eq(question.prompt)
      expect(question.reload.current_version_id).to eq(body["id"])
    end
  end
end
