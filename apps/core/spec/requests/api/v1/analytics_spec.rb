require "rails_helper"

RSpec.describe "Api::V1::Analytics", type: :request do
  describe "POST /api/v1/analytics/web_vitals" do
    it "accepts telemetry payloads without authentication" do
      post "/api/v1/analytics/web_vitals", params: {
        name: "largest-contentful-paint",
        value: 2100.5,
        path: "/dashboard"
      }

      expect(response).to have_http_status(:accepted)
    end
  end
end
