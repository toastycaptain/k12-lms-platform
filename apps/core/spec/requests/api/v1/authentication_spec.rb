require "rails_helper"

RSpec.describe "API Authentication Middleware", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:user) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    Current.tenant = nil
    u
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "unauthenticated requests" do
    it "returns 401 for unauthenticated requests to /api/v1/me" do
      get "/api/v1/me"

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body["error"]).to eq("Unauthorized")
    end
  end

  describe "wrong tenant returns 403" do
    let!(:other_tenant) { create(:tenant) }

    it "returns 401 when user session points to a different tenant" do
      # User belongs to tenant, but session has other_tenant
      allow_any_instance_of(ApplicationController).to receive(:session).and_return(
        { user_id: user.id, tenant_id: other_tenant.id }
      )

      get "/api/v1/me"

      # User not found in other_tenant, so 401
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "tenant resolution from header" do
    it "resolves tenant from X-Tenant-Slug header" do
      allow_any_instance_of(ApplicationController).to receive(:session).and_return(
        { user_id: user.id }
      )

      get "/api/v1/me", headers: { "X-Tenant-Slug" => tenant.slug }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["tenant"]["slug"]).to eq(tenant.slug)
    end

    it "returns 401 with invalid tenant slug" do
      allow_any_instance_of(ApplicationController).to receive(:session).and_return(
        { user_id: user.id }
      )

      get "/api/v1/me", headers: { "X-Tenant-Slug" => "nonexistent" }

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "authenticated requests" do
    it "returns 200 for authenticated requests to /api/v1/me" do
      mock_session(user, tenant: tenant)

      get "/api/v1/me"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["user"]["id"]).to eq(user.id)
    end
  end
end
