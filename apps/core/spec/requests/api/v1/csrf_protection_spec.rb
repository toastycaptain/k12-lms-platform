require "rails_helper"

RSpec.describe "Api::V1::CSRF Protection", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    Current.tenant = nil
    user
  end

  around do |example|
    original = ActionController::Base.allow_forgery_protection
    ActionController::Base.allow_forgery_protection = true
    example.run
    ActionController::Base.allow_forgery_protection = original
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "CSRF enforcement on mutation requests" do
    it "allows GET requests without CSRF token" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/me"
      expect(response).to have_http_status(:ok)
    end

    it "rejects POST requests without CSRF token" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/question_banks", params: { title: "No Token Bank" }
      expect(response).to have_http_status(:forbidden)
      expect(response.parsed_body["error"]).to eq("Invalid CSRF token")
    end

    it "accepts POST requests with a valid CSRF token" do
      session_data = { user_id: teacher.id, tenant_id: tenant.id }
      allow_any_instance_of(ApplicationController).to receive(:session).and_return(session_data)

      get "/api/v1/csrf"
      expect(response).to have_http_status(:ok)
      token = response.parsed_body["token"]
      expect(token).to be_present

      post "/api/v1/question_banks",
        params: { title: "Token Bank" },
        headers: { "X-CSRF-Token" => token }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["title"]).to eq("Token Bank")
    end
  end
end
