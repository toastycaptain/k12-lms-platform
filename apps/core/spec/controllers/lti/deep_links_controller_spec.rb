require "rails_helper"

RSpec.describe "Lti::DeepLinksController", type: :request do
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
      status: "active"
    )
  end

  before do
    mock_session(admin, tenant: tenant)
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "POST /api/v1/lti/deep_link_response" do
    it "returns a signed JWT" do
      post "/api/v1/lti/deep_link_response", params: {
        registration_id: registration.id,
        return_url: "https://platform.example.com/deep-link-return",
        data: "opaque-data",
        items: [
          {
            title: "Quiz 1",
            url: "https://tool.example.com/quiz/1",
            custom_params: { resource_link_id: "quiz-1" }
          }
        ]
      }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["jwt"]).to be_present
    end

    it "builds a JWT payload with content_items" do
      post "/api/v1/lti/deep_link_response", params: {
        registration_id: registration.id,
        return_url: "https://platform.example.com/deep-link-return",
        data: "opaque-data",
        items: [
          {
            title: "Assignment 1",
            url: "https://tool.example.com/assignment/1",
            custom_params: { resource_link_id: "assignment-1" }
          },
          {
            title: "Quiz 2",
            url: "https://tool.example.com/quiz/2",
            custom_params: { resource_link_id: "quiz-2" }
          }
        ]
      }

      token = response.parsed_body["jwt"]
      payload, header = JWT.decode(
        token,
        Rails.application.config.lti_private_key.public_key,
        true,
        algorithm: "RS256"
      )

      expect(header["kid"]).to eq("k12-lms-platform-key")
      expect(payload["https://purl.imsglobal.org/spec/lti/claim/message_type"]).to eq("LtiDeepLinkingResponse")
      expect(payload["https://purl.imsglobal.org/spec/lti-dl/claim/content_items"].length).to eq(2)
      expect(payload["https://purl.imsglobal.org/spec/lti-dl/claim/content_items"].first["title"]).to eq("Assignment 1")
      expect(payload["https://purl.imsglobal.org/spec/lti-dl/claim/content_items"].last["title"]).to eq("Quiz 2")
    end
  end
end
