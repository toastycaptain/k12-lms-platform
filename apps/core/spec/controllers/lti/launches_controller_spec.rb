require "rails_helper"

RSpec.describe "Lti::LaunchesController", type: :request do
  let(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    Current.tenant = nil
    user
  end
  let(:registration) do
    create(
      :lti_registration,
      tenant: tenant,
      created_by: admin,
      issuer: "https://issuer.example.com",
      client_id: "client-123",
      auth_login_url: "https://tool.example.com/oidc",
      status: "active"
    )
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /lti/oidc_login" do
    it "redirects to auth_login_url with required OIDC params" do
      get "/lti/oidc_login", params: {
        iss: registration.issuer,
        client_id: registration.client_id,
        login_hint: "login-hint",
        lti_message_hint: "message-hint"
      }

      expect(response).to have_http_status(:redirect)

      uri = URI.parse(response.location)
      query = Rack::Utils.parse_query(uri.query)

      expect(uri.to_s).to start_with(registration.auth_login_url)
      expect(query["client_id"]).to eq(registration.client_id)
      expect(query["response_type"]).to eq("id_token")
      expect(query["scope"]).to eq("openid")
      expect(query["response_mode"]).to eq("form_post")
      expect(query["redirect_uri"]).to end_with("/lti/launch")
      expect(query["login_hint"]).to eq("login-hint")
      expect(query["lti_message_hint"]).to eq("message-hint")
      expect(query["state"]).to be_present
      expect(query["nonce"]).to be_present
    end

    it "returns 404 for unknown registration" do
      get "/lti/oidc_login", params: { iss: "https://unknown.example.com", client_id: "missing" }

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /lti/oidc_login" do
    it "redirects to auth_login_url with required OIDC params" do
      post "/lti/oidc_login", params: {
        iss: registration.issuer,
        client_id: registration.client_id,
        login_hint: "login-hint",
        lti_message_hint: "message-hint"
      }

      expect(response).to have_http_status(:redirect)

      uri = URI.parse(response.location)
      query = Rack::Utils.parse_query(uri.query)

      expect(uri.to_s).to start_with(registration.auth_login_url)
      expect(query["client_id"]).to eq(registration.client_id)
      expect(query["response_type"]).to eq("id_token")
      expect(query["scope"]).to eq("openid")
      expect(query["response_mode"]).to eq("form_post")
      expect(query["redirect_uri"]).to end_with("/lti/launch")
      expect(query["login_hint"]).to eq("login-hint")
      expect(query["lti_message_hint"]).to eq("message-hint")
      expect(query["state"]).to be_present
      expect(query["nonce"]).to be_present
    end
  end

  describe "POST /lti/launch" do
    let(:user) { create(:user, tenant: tenant, email: "teacher@example.com") }
    let(:course) { create(:course, tenant: tenant) }

    before do
      create(
        :lti_resource_link,
        tenant: tenant,
        lti_registration: registration,
        course: course,
        custom_params: { "resource_link_id" => "resource-1" }
      )
    end

    it "creates session and redirects on valid JWT claims" do
      allow(Rails.cache).to receive(:read).with("lti_state:state-1").and_return(
        { "nonce" => "nonce-1", "registration_id" => registration.id }
      )
      allow(Rails.cache).to receive(:delete).with("lti_state:state-1")
      allow_any_instance_of(Lti::LaunchesController).to receive(:validate_jwt).and_return(
        {
          "email" => user.email,
          "https://purl.imsglobal.org/spec/lti/claim/message_type" => "LtiResourceLinkRequest",
          "https://purl.imsglobal.org/spec/lti/claim/resource_link" => { "id" => "resource-1" }
        }
      )

      post "/lti/launch", params: { state: "state-1", id_token: "signed-token" }

      expect(response).to have_http_status(:redirect)
      expect(response.location).to end_with("/teach/courses/#{course.id}")
      expect(response.headers["Set-Cookie"]).to include("_k12_lms_session")
    end

    it "returns 400 for invalid state" do
      allow(Rails.cache).to receive(:read).with("lti_state:missing").and_return(nil)

      post "/lti/launch", params: { state: "missing", id_token: "signed-token" }

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body["error"]).to include("Invalid or expired state")
    end

    it "returns 401 for invalid JWT" do
      allow(Rails.cache).to receive(:read).with("lti_state:state-1").and_return(
        { "nonce" => "nonce-1", "registration_id" => registration.id }
      )
      allow(Rails.cache).to receive(:delete).with("lti_state:state-1")
      allow_any_instance_of(Lti::LaunchesController).to receive(:validate_jwt).and_return(nil)

      post "/lti/launch", params: { state: "state-1", id_token: "bad-token" }

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body["error"]).to include("Invalid token")
    end

    it "redirects to deep linking content picker for LtiDeepLinkingRequest" do
      allow(Rails.cache).to receive(:read).with("lti_state:state-1").and_return(
        { "nonce" => "nonce-1", "registration_id" => registration.id }
      )
      allow(Rails.cache).to receive(:delete).with("lti_state:state-1")
      allow_any_instance_of(Lti::LaunchesController).to receive(:validate_jwt).and_return(
        {
          "email" => user.email,
          "https://purl.imsglobal.org/spec/lti/claim/message_type" => "LtiDeepLinkingRequest",
          "https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings" => {
            "deep_link_return_url" => "https://tool.example.com/deep_link_return"
          }
        }
      )

      post "/lti/launch", params: { state: "state-1", id_token: "signed-token" }

      expect(response).to have_http_status(:redirect)
      expect(response.location).to include("/lti/deep-link")
      expect(response.location).to include("registration_id=#{registration.id}")
      expect(response.location).to include("return_url=")
    end

    it "returns 422 when user cannot be resolved" do
      allow(Rails.cache).to receive(:read).with("lti_state:state-1").and_return(
        { "nonce" => "nonce-1", "registration_id" => registration.id }
      )
      allow(Rails.cache).to receive(:delete).with("lti_state:state-1")
      allow_any_instance_of(Lti::LaunchesController).to receive(:validate_jwt).and_return(
        {
          "email" => "nonexistent@example.com",
          "https://purl.imsglobal.org/spec/lti/claim/message_type" => "LtiResourceLinkRequest",
          "https://purl.imsglobal.org/spec/lti/claim/resource_link" => { "id" => "resource-1" }
        }
      )

      post "/lti/launch", params: { state: "state-1", id_token: "signed-token" }

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body["error"]).to include("User could not be resolved")
    end
  end

  describe "GET /lti/jwks" do
    it "returns platform JWKS" do
      get "/lti/jwks"

      expect(response).to have_http_status(:ok)
      keys = response.parsed_body["keys"]
      expect(keys).to be_an(Array)
      expect(keys.first["kid"]).to eq("k12-lms-platform-key")
      expect(keys.first["kty"]).to eq("RSA")
    end
  end
end
