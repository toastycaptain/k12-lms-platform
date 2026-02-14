require "rails_helper"

RSpec.describe "Api::V1::Terms", type: :request do
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
  let(:academic_year) do
    Current.tenant = tenant
    ay = create(:academic_year, tenant: tenant)
    Current.tenant = nil
    ay
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/terms" do
    it "returns all terms for authenticated user" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      create_list(:term, 2, tenant: tenant, academic_year: ay)
      Current.tenant = nil

      get "/api/v1/terms"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(2)
    end

    it "filters by academic_year_id" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      ay1 = create(:academic_year, tenant: tenant)
      ay2 = create(:academic_year, tenant: tenant)
      create(:term, tenant: tenant, academic_year: ay1)
      create(:term, tenant: tenant, academic_year: ay2)
      Current.tenant = nil

      get "/api/v1/terms", params: { academic_year_id: ay1.id }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end
  end

  describe "POST /api/v1/terms" do
    it "creates a term for admin" do
      mock_session(admin, tenant: tenant)

      expect {
        post "/api/v1/terms", params: {
          term: { academic_year_id: academic_year.id, name: "Fall 2026", start_date: "2026-08-01", end_date: "2026-12-20" }
        }
      }.to change(Term.unscoped, :count).by(1)

      expect(response).to have_http_status(:created)
    end

    it "denies create for teacher" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/terms", params: {
        term: { academic_year_id: academic_year.id, name: "Fall 2026", start_date: "2026-08-01", end_date: "2026-12-20" }
      }

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "PATCH /api/v1/terms/:id" do
    it "updates a term for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      term = create(:term, tenant: tenant, academic_year: ay)
      Current.tenant = nil

      patch "/api/v1/terms/#{term.id}", params: { term: { name: "Updated Term" } }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["name"]).to eq("Updated Term")
    end
  end

  describe "DELETE /api/v1/terms/:id" do
    it "deletes a term for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      term = create(:term, tenant: tenant, academic_year: ay)
      Current.tenant = nil

      expect {
        delete "/api/v1/terms/#{term.id}"
      }.to change(Term.unscoped, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end
  end
end
