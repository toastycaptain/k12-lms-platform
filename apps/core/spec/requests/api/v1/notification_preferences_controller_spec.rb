require "rails_helper"

RSpec.describe "Api::V1::NotificationPreferences", type: :request do
  let(:tenant) { create(:tenant) }
  let(:user) do
    Current.tenant = tenant
    created_user = create(:user, tenant: tenant)
    created_user.add_role(:teacher)
    Current.tenant = nil
    created_user
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/notification_preferences" do
    it "returns preference rows with defaults" do
      mock_session(user, tenant: tenant)

      get "/api/v1/notification_preferences"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body).not_to be_empty

      row = body.find { |entry| entry["event_type"] == "assignment_created" }
      expect(row).to include(
        "in_app" => true,
        "email" => true,
        "email_frequency" => "immediate"
      )
    end
  end

  describe "PATCH /api/v1/notification_preferences/:event_type" do
    it "updates preference settings for the event type" do
      mock_session(user, tenant: tenant)

      patch "/api/v1/notification_preferences/assignment_created", params: {
        email: false,
        in_app: true
      }

      expect(response).to have_http_status(:ok)
      pref = NotificationPreference.find_by!(user_id: user.id, event_type: "assignment_created")
      expect(pref.email).to be(false)
      expect(pref.email_frequency).to eq("never")
    end

    it "rejects unknown event types" do
      mock_session(user, tenant: tenant)

      patch "/api/v1/notification_preferences/unknown_event", params: { email: false }

      expect(response).to have_http_status(:unprocessable_content)
    end
  end
end
