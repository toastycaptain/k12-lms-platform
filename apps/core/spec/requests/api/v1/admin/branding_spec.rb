require "rails_helper"

RSpec.describe "Api::V1::Admin::Branding", type: :request do
  let!(:tenant) { create(:tenant, settings: {}) }
  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    Current.tenant = nil
    user
  end

  after { Current.tenant = nil }

  it "returns current branding settings" do
    mock_session(admin, tenant: tenant)

    get "/api/v1/admin/branding"

    expect(response).to have_http_status(:ok)
  end

  it "updates branding settings" do
    mock_session(admin, tenant: tenant)

    patch "/api/v1/admin/branding", params: { primary_color: "#ff0000" }

    expect(response).to have_http_status(:ok)
    expect(tenant.reload.settings["branding"]["primary_color"]).to eq("#ff0000")
  end
end
