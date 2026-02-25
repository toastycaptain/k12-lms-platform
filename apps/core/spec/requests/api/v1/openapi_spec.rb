require "rails_helper"

RSpec.describe "Api::V1::OpenAPI", type: :request do
  describe "GET /api/v1/openapi.json" do
    it "returns the OpenAPI contract without authentication" do
      get "/api/v1/openapi.json"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["openapi"]).to be_present
      expect(response.parsed_body["paths"]).to be_a(Hash)
    end
  end
end
