require "rails_helper"

RSpec.describe "Api::V1::Ai Health", type: :request do
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

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/ai/health" do
    it "returns 200 for admin when gateway is healthy" do
      mock_session(admin, tenant: tenant)

      gateway_client = instance_double(AiGatewayClient)
      allow(AiGatewayClient).to receive(:new).and_return(gateway_client)
      allow(gateway_client).to receive(:health).and_return({ "status" => "healthy" })

      get "/api/v1/ai/health"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("healthy")
    end

    it "returns 503 when gateway is unavailable" do
      mock_session(admin, tenant: tenant)

      gateway_client = instance_double(AiGatewayClient)
      allow(AiGatewayClient).to receive(:new).and_return(gateway_client)
      allow(gateway_client).to receive(:health).and_raise(AiGatewayError.new("Gateway unreachable", status_code: 503))

      get "/api/v1/ai/health"

      expect(response).to have_http_status(:service_unavailable)
      expect(response.parsed_body["error"]).to eq("Gateway unreachable")
    end

    it "returns 403 for teacher" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/ai/health"

      expect(response).to have_http_status(:forbidden)
    end
  end
end
