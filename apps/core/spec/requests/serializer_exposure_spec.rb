require "rails_helper"

RSpec.describe "Serializer Data Exposure", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:admin)
    Current.tenant = nil
    u
  end

  before { mock_session(admin, tenant: tenant) }
  after { Current.tenant = nil }

  describe "GET /api/v1/users" do
    it "does not expose google tokens" do
      get "/api/v1/users"
      expect(response).to have_http_status(:ok)

      response.parsed_body.each do |user_json|
        expect(user_json.keys).not_to include("google_access_token")
        expect(user_json.keys).not_to include("google_refresh_token")
      end
    end
  end
end
