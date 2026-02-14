require "rails_helper"

RSpec.describe "Api::V1::QuestionBanks" do
  let(:tenant) { create(:tenant) }
  let(:teacher) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:teacher)
    Current.tenant = nil
    u
  end
  let(:student) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:student)
    Current.tenant = nil
    u
  end

  after { Current.tenant = nil }

  describe "GET /api/v1/question_banks" do
    it "lists question banks" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:question_bank, tenant: tenant, created_by: teacher, subject: "Math")
      create(:question_bank, tenant: tenant, created_by: teacher, subject: "ELA")
      Current.tenant = nil

      get "/api/v1/question_banks"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(2)
    end

    it "filters by subject" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:question_bank, tenant: tenant, created_by: teacher, subject: "Math")
      create(:question_bank, tenant: tenant, created_by: teacher, subject: "ELA")
      Current.tenant = nil

      get "/api/v1/question_banks", params: { subject: "Math" }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
      expect(response.parsed_body[0]["subject"]).to eq("Math")
    end
  end

  describe "POST /api/v1/question_banks" do
    it "creates a question bank as teacher" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/question_banks", params: {
        title: "5th Grade Math Questions",
        description: "Questions for 5th grade math",
        subject: "Math",
        grade_level: "5"
      }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["title"]).to eq("5th Grade Math Questions")
      expect(response.parsed_body["subject"]).to eq("Math")
      expect(response.parsed_body["status"]).to eq("active")
    end

    it "rejects creation as student" do
      mock_session(student, tenant: tenant)

      post "/api/v1/question_banks", params: { title: "Student Bank" }
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/v1/question_banks/:id" do
    it "shows a question bank" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      bank = create(:question_bank, tenant: tenant, created_by: teacher)
      Current.tenant = nil

      get "/api/v1/question_banks/#{bank.id}"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["id"]).to eq(bank.id)
    end
  end

  describe "PATCH /api/v1/question_banks/:id" do
    it "updates a question bank" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      bank = create(:question_bank, tenant: tenant, created_by: teacher)
      Current.tenant = nil

      patch "/api/v1/question_banks/#{bank.id}", params: { title: "Updated Title" }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["title"]).to eq("Updated Title")
    end
  end

  describe "DELETE /api/v1/question_banks/:id" do
    it "deletes a question bank" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      bank = create(:question_bank, tenant: tenant, created_by: teacher)
      Current.tenant = nil

      delete "/api/v1/question_banks/#{bank.id}"
      expect(response).to have_http_status(:no_content)
    end
  end

  describe "POST /api/v1/question_banks/:id/archive" do
    it "archives an active question bank" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      bank = create(:question_bank, tenant: tenant, created_by: teacher, status: "active")
      Current.tenant = nil

      post "/api/v1/question_banks/#{bank.id}/archive"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("archived")
    end

    it "rejects archiving an already archived bank" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      bank = create(:question_bank, tenant: tenant, created_by: teacher, status: "archived")
      Current.tenant = nil

      post "/api/v1/question_banks/#{bank.id}/archive"
      expect(response).to have_http_status(:unprocessable_content)
    end
  end
end
