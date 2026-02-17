require "rails_helper"

RSpec.describe "Api::V1::GuardianLinks", type: :request do
  let(:tenant) { create(:tenant) }

  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    Current.tenant = nil
    user
  end

  let(:guardian) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:guardian)
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

  let(:student) { create(:user, tenant: tenant) }

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/guardian_links" do
    it "returns own links for guardian users" do
      mock_session(guardian, tenant: tenant)
      Current.tenant = tenant
      own_link = create(:guardian_link, tenant: tenant, guardian: guardian, student: student)
      create(:guardian_link, tenant: tenant)
      Current.tenant = nil

      get "/api/v1/guardian_links"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.map { |row| row["id"] }).to contain_exactly(own_link.id)
    end

    it "returns all links for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      create_list(:guardian_link, 2, tenant: tenant)
      Current.tenant = nil

      get "/api/v1/guardian_links"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(2)
    end

    it "returns forbidden for unrelated users" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/guardian_links"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/guardian_links" do
    it "creates a link for admins" do
      mock_session(admin, tenant: tenant)

      expect {
        post "/api/v1/guardian_links", params: {
          guardian_id: guardian.id,
          student_id: student.id,
          relationship: "parent",
          status: "active"
        }
      }.to change(GuardianLink.unscoped, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["guardian_id"]).to eq(guardian.id)
      expect(response.parsed_body["student_id"]).to eq(student.id)
    end

    it "returns forbidden for guardian users" do
      mock_session(guardian, tenant: tenant)

      post "/api/v1/guardian_links", params: {
        guardian_id: guardian.id,
        student_id: student.id,
        relationship: "parent",
        status: "active"
      }

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "DELETE /api/v1/guardian_links/:id" do
    it "deletes a link for admins" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      link = create(:guardian_link, tenant: tenant)
      Current.tenant = nil

      expect {
        delete "/api/v1/guardian_links/#{link.id}"
      }.to change(GuardianLink.unscoped, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end
  end
end
