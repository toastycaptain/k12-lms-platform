require "rails_helper"

RSpec.describe "Api::V1::Sessions SAML", type: :request do
  let!(:tenant) { create(:tenant, slug: "example-school") }

  let(:config_creator) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    Current.tenant = nil
    user
  end

  before do
    OmniAuth.config.test_mode = true
  end

  after do
    OmniAuth.config.test_mode = false
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /auth/saml/callback" do
    it "creates a session for an existing SAML user" do
      Current.tenant = tenant
      user = create(:user, tenant: tenant, email: "teacher@example.com", first_name: "Taylor", last_name: "Teacher")
      create(
        :integration_config,
        tenant: tenant,
        created_by: config_creator,
        provider: "saml",
        status: "active",
        settings: {
          "idp_sso_url" => "https://idp.example.com/sso",
          "idp_cert_fingerprint" => "AA:BB",
          "auto_provision" => false
        }
      )
      Current.tenant = nil

      OmniAuth.config.mock_auth[:saml] = OmniAuth::AuthHash.new(
        provider: "saml",
        uid: "saml-uid-1",
        info: {
          email: "teacher@example.com",
          first_name: "Taylor",
          last_name: "Teacher"
        },
        attributes: {
          email: [ "teacher@example.com" ],
          first_name: [ "Taylor" ],
          last_name: [ "Teacher" ]
        }
      )

      session_store = {}
      allow_any_instance_of(Api::V1::SessionsController).to receive(:session).and_return(session_store)

      get "/auth/saml/callback", params: { tenant: tenant.slug }

      expect(response).to have_http_status(:redirect)
      expect(response.headers["Location"]).to include("/dashboard")
      expect(session_store[:user_id]).to eq(user.id)
      expect(session_store[:tenant_id]).to eq(tenant.id)
    end

    it "auto-provisions a user when enabled" do
      Current.tenant = tenant
      create(
        :integration_config,
        tenant: tenant,
        created_by: config_creator,
        provider: "saml",
        status: "active",
        settings: {
          "idp_sso_url" => "https://idp.example.com/sso",
          "idp_cert_fingerprint" => "AA:BB",
          "auto_provision" => true,
          "default_role" => "teacher"
        }
      )
      Current.tenant = nil

      OmniAuth.config.mock_auth[:saml] = OmniAuth::AuthHash.new(
        provider: "saml",
        uid: "saml-uid-2",
        info: {
          email: "new.teacher@example.com",
          first_name: "New",
          last_name: "Teacher"
        },
        attributes: {
          email: [ "new.teacher@example.com" ],
          first_name: [ "New" ],
          last_name: [ "Teacher" ]
        }
      )

      session_store = {}
      allow_any_instance_of(Api::V1::SessionsController).to receive(:session).and_return(session_store)

      expect {
        get "/auth/saml/callback", params: { tenant: tenant.slug }
      }.to change(User.unscoped, :count).by(1)

      created_user = User.unscoped.find_by!(email: "new.teacher@example.com", tenant: tenant)
      expect(created_user.roles.pluck(:name)).to include("teacher")
      expect(response).to have_http_status(:redirect)
      expect(session_store[:user_id]).to eq(created_user.id)
      expect(session_store[:tenant_id]).to eq(tenant.id)
    end

    it "returns 404 for unknown user when auto-provisioning is disabled" do
      Current.tenant = tenant
      create(
        :integration_config,
        tenant: tenant,
        created_by: config_creator,
        provider: "saml",
        status: "active",
        settings: {
          "idp_sso_url" => "https://idp.example.com/sso",
          "idp_cert_fingerprint" => "AA:BB",
          "auto_provision" => false
        }
      )
      Current.tenant = nil

      OmniAuth.config.mock_auth[:saml] = OmniAuth::AuthHash.new(
        provider: "saml",
        uid: "saml-uid-3",
        info: {
          email: "missing.user@example.com"
        },
        attributes: {
          email: [ "missing.user@example.com" ]
        }
      )

      get "/auth/saml/callback", params: { tenant: tenant.slug }

      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body["error"]).to eq("User not found and auto-provisioning is disabled")
    end

    it "returns 422 when the SAML response does not include an email" do
      Current.tenant = tenant
      create(
        :integration_config,
        tenant: tenant,
        created_by: config_creator,
        provider: "saml",
        status: "active",
        settings: {
          "idp_sso_url" => "https://idp.example.com/sso",
          "idp_cert_fingerprint" => "AA:BB",
          "auto_provision" => true
        }
      )
      Current.tenant = nil

      OmniAuth.config.mock_auth[:saml] = OmniAuth::AuthHash.new(
        provider: "saml",
        uid: "saml-uid-4",
        info: {},
        attributes: {}
      )

      get "/auth/saml/callback", params: { tenant: tenant.slug }

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["error"]).to eq("No email in SAML response")
    end
  end
end
