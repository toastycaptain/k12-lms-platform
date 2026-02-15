require "rails_helper"

RSpec.describe "Api::V1::Schools", type: :request do
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

  describe "GET /api/v1/schools" do
    it "allows admin" do
      mock_session(admin, tenant: tenant)
      create(:school, tenant: tenant)

      get "/api/v1/schools"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end

    it "forbids teacher" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/schools"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "mutations" do
    it "allows admin create/update/destroy" do
      mock_session(admin, tenant: tenant)

      post "/api/v1/schools", params: { school: { name: "Alpha", address: "1 Main", timezone: "UTC" } }
      expect(response).to have_http_status(:created)
      school_id = response.parsed_body["id"]

      patch "/api/v1/schools/#{school_id}", params: { school: { name: "Beta" } }
      expect(response).to have_http_status(:ok)

      delete "/api/v1/schools/#{school_id}"
      expect(response).to have_http_status(:no_content)
    end

    it "forbids teacher create/update/destroy" do
      mock_session(teacher, tenant: tenant)
      school = create(:school, tenant: tenant)

      post "/api/v1/schools", params: { school: { name: "Nope" } }
      expect(response).to have_http_status(:forbidden)

      patch "/api/v1/schools/#{school.id}", params: { school: { name: "Nope" } }
      expect(response).to have_http_status(:forbidden)

      delete "/api/v1/schools/#{school.id}"
      expect(response).to have_http_status(:forbidden)
    end
  end
end
