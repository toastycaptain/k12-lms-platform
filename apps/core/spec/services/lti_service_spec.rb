require "rails_helper"
require "webmock/rspec"

RSpec.describe LtiService do
  let(:tenant) { create(:tenant) }
  let(:user) { create(:user, tenant: tenant) }
  let(:registration) do
    Current.tenant = tenant
    create(:lti_registration, tenant: tenant, created_by: user,
      settings: { "target_link_uri" => "https://tool.example.com/launch" })
  end

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe ".platform_jwks" do
    it "returns a JWKS with keys" do
      jwks = described_class.platform_jwks
      expect(jwks).to have_key(:keys)
      expect(jwks[:keys]).to be_an(Array)
      expect(jwks[:keys].first).to have_key(:kty)
    end
  end

  describe ".build_login_request" do
    it "returns redirect_url, state, and nonce" do
      result = described_class.build_login_request(registration, {
        login_hint: "user123",
        target_link_uri: "https://tool.example.com/launch"
      })

      expect(result).to have_key(:redirect_url)
      expect(result).to have_key(:state)
      expect(result).to have_key(:nonce)
      expect(result[:redirect_url]).to include(registration.auth_login_url)
      expect(result[:redirect_url]).to include("client_id=#{registration.client_id}")
    end
  end

  describe ".build_launch_message" do
    it "returns a JWT string" do
      user.add_role(:teacher)
      course = create(:course, tenant: tenant, academic_year: create(:academic_year, tenant: tenant))

      jwt = described_class.build_launch_message(registration, user, course)
      expect(jwt).to be_a(String)

      decoded = JWT.decode(jwt, described_class.platform_keypair.public_key, true, { algorithms: [ "RS256" ] })
      payload = decoded.first

      expect(payload["sub"]).to eq(user.id.to_s)
      expect(payload["aud"]).to eq(registration.client_id)
      expect(payload["https://purl.imsglobal.org/spec/lti/claim/roles"]).to include(
        "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor"
      )
      expect(payload["https://purl.imsglobal.org/spec/lti/claim/context"]).to be_present
    end
  end

  describe ".build_deep_link_response" do
    it "returns a JWT with content items" do
      content_items = [ { type: "ltiResourceLink", title: "Test", url: "https://example.com" } ]
      jwt = described_class.build_deep_link_response(registration, content_items)
      expect(jwt).to be_a(String)

      decoded = JWT.decode(jwt, described_class.platform_keypair.public_key, true, { algorithms: [ "RS256" ] })
      payload = decoded.first

      items = payload["https://purl.imsglobal.org/spec/lti-dl/claim/content_items"]
      expect(items.map(&:symbolize_keys)).to eq(content_items)
    end
  end

  describe ".validate_id_token" do
    it "validates a properly signed token" do
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

      result = described_class.validate_id_token(token, registration)
      expect(result["sub"]).to eq("user123")
    end
  end
end
