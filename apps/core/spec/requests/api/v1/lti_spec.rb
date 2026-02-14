require "rails_helper"
require "webmock/rspec"

RSpec.describe "Api::V1::Lti", type: :request do
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
  let(:registration) do
    Current.tenant = tenant
    r = create(:lti_registration, tenant: tenant, created_by: admin, status: "active",
      settings: { "target_link_uri" => "https://tool.example.com/launch" })
    Current.tenant = nil
    r
  end

  after { Current.tenant = nil }

  describe "GET /api/v1/lti/jwks" do
    it "returns JWKS without authentication" do
      get "/api/v1/lti/jwks"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to have_key("keys")
    end
  end

  describe "POST /api/v1/lti/login" do
    it "builds a login request" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/lti/login", params: {
        client_id: registration.client_id,
        login_hint: "user123",
        target_link_uri: "https://tool.example.com/launch"
      }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to have_key("redirect_url")
      expect(response.parsed_body).to have_key("state")
      expect(response.parsed_body).to have_key("nonce")
    end
  end

  describe "POST /api/v1/lti/launch" do
    it "validates id_token and returns launch context" do
      mock_session(teacher, tenant: tenant)

      key = OpenSSL::PKey::RSA.generate(2048)
      jwk = JWT::JWK.new(key)
      jwks_json = { keys: [ jwk.export ] }.to_json

      payload = {
        iss: registration.issuer,
        aud: registration.client_id,
        sub: "user123",
        exp: 1.hour.from_now.to_i,
        iat: Time.current.to_i
      }
      token = JWT.encode(payload, key, "RS256", { kid: jwk.kid })

      stub_request(:get, registration.jwks_url).to_return(body: jwks_json, status: 200)

      post "/api/v1/lti/launch", params: {
        client_id: registration.client_id,
        id_token: token
      }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to have_key("claims")
      expect(response.parsed_body).to have_key("launch_jwt")
    end
  end

  describe "POST /api/v1/lti/deep_link" do
    it "creates resource links from content items" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/lti/deep_link", params: {
        registration_id: registration.id,
        content_items: [
          { title: "Link 1", url: "https://tool.example.com/1" },
          { title: "Link 2", url: "https://tool.example.com/2" }
        ]
      }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to have_key("jwt")
      expect(response.parsed_body["resource_links"].length).to eq(2)
    end
  end
end
