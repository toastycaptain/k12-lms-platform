require "rails_helper"

RSpec.describe "Api::V1::QTI Import/Export" do
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
  let(:bank) do
    Current.tenant = tenant
    b = create(:question_bank, tenant: tenant, created_by: teacher)
    Current.tenant = nil
    b
  end

  after { Current.tenant = nil }

  describe "POST /api/v1/question_banks/:id/export_qti" do
    it "triggers export as teacher" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/question_banks/#{bank.id}/export_qti"
      expect(response).to have_http_status(:accepted)
      expect(response.parsed_body["status"]).to eq("queued")
    end

    it "rejects export as student" do
      mock_session(student, tenant: tenant)

      post "/api/v1/question_banks/#{bank.id}/export_qti"
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/v1/question_banks/:id/export_qti_status" do
    it "returns processing when not yet exported" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/question_banks/#{bank.id}/export_qti_status"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("processing")
    end

    it "returns completed with download URL after export" do
      mock_session(teacher, tenant: tenant)
      QtiExportJob.perform_now(bank.id)

      get "/api/v1/question_banks/#{bank.id}/export_qti_status"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("completed")
      expect(response.parsed_body["download_url"]).to be_present
    end
  end

  describe "POST /api/v1/question_banks/:id/import_qti" do
    it "triggers import as teacher" do
      mock_session(teacher, tenant: tenant)
      file = Rack::Test::UploadedFile.new(StringIO.new("<xml/>"), "application/xml", false, original_filename: "test.xml")

      post "/api/v1/question_banks/#{bank.id}/import_qti", params: { file: file }
      expect(response).to have_http_status(:accepted)
      expect(response.parsed_body["status"]).to eq("queued")
    end

    it "rejects import as student" do
      mock_session(student, tenant: tenant)
      file = Rack::Test::UploadedFile.new(StringIO.new("<xml/>"), "application/xml", false, original_filename: "test.xml")

      post "/api/v1/question_banks/#{bank.id}/import_qti", params: { file: file }
      expect(response).to have_http_status(:forbidden)
    end
  end
end
