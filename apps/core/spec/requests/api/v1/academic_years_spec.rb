require "rails_helper"

RSpec.describe "Api::V1::AcademicYears", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:admin)
    Current.tenant = nil
    u
  end
  let(:teacher) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:teacher)
    Current.tenant = nil
    u
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/academic_years" do
    it "returns all academic years for authenticated user" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create_list(:academic_year, 3, tenant: tenant)
      Current.tenant = nil

      get "/api/v1/academic_years"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(3)
    end

    it "returns 401 for unauthenticated request" do
      get "/api/v1/academic_years"

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "GET /api/v1/academic_years/:id" do
    it "returns a specific academic year" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      Current.tenant = nil

      get "/api/v1/academic_years/#{ay.id}"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["name"]).to eq(ay.name)
    end
  end

  describe "POST /api/v1/academic_years" do
    let(:valid_params) do
      { academic_year: { name: "2026-2027", start_date: "2026-08-01", end_date: "2027-06-30", current: true } }
    end

    it "creates an academic year for admin" do
      mock_session(admin, tenant: tenant)

      expect {
        post "/api/v1/academic_years", params: valid_params
      }.to change(AcademicYear.unscoped, :count).by(1)

      expect(response).to have_http_status(:created)
    end

    it "rejects invalid data" do
      mock_session(admin, tenant: tenant)

      post "/api/v1/academic_years", params: { academic_year: { name: "", start_date: "2026-08-01", end_date: "2026-01-01" } }

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "denies create for teacher" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/academic_years", params: valid_params

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "PATCH /api/v1/academic_years/:id" do
    it "updates an academic year for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      Current.tenant = nil

      patch "/api/v1/academic_years/#{ay.id}", params: { academic_year: { name: "Updated" } }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["name"]).to eq("Updated")
    end
  end

  describe "DELETE /api/v1/academic_years/:id" do
    it "deletes an academic year for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      Current.tenant = nil

      expect {
        delete "/api/v1/academic_years/#{ay.id}"
      }.to change(AcademicYear.unscoped, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end

    it "denies delete for teacher" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      Current.tenant = nil

      delete "/api/v1/academic_years/#{ay.id}"

      expect(response).to have_http_status(:forbidden)
    end
  end
end
