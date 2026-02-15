require "rails_helper"

RSpec.describe "Api::V1::Users", type: :request do
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

  describe "admin lifecycle" do
    it "lists, creates with roles, updates, and destroys users" do
      mock_session(admin, tenant: tenant)
      existing = create(:user, tenant: tenant)

      get "/api/v1/users"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.map { |u| u["id"] }).to include(existing.id)

      post "/api/v1/users", params: {
        user: {
          email: "new-user@example.com",
          first_name: "New",
          last_name: "User",
          roles: [ "teacher" ]
        }
      }
      expect(response).to have_http_status(:created)
      created = User.find(response.parsed_body["id"])
      expect(created.has_role?(:teacher)).to eq(true)

      patch "/api/v1/users/#{created.id}", params: { user: { first_name: "Updated" } }
      expect(response).to have_http_status(:ok)

      delete "/api/v1/users/#{created.id}"
      expect(response).to have_http_status(:no_content)
    end
  end

  describe "non-admin restrictions" do
    it "forbids teacher on mutation actions" do
      mock_session(teacher, tenant: tenant)
      target = create(:user, tenant: tenant)

      post "/api/v1/users", params: { user: { email: "x@example.com", first_name: "X", last_name: "Y" } }
      expect(response).to have_http_status(:forbidden)

      patch "/api/v1/users/#{target.id}", params: { user: { first_name: "Nope" } }
      expect(response).to have_http_status(:forbidden)

      delete "/api/v1/users/#{target.id}"
      expect(response).to have_http_status(:forbidden)
    end
  end
end
