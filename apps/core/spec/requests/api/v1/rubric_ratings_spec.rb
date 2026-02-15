require "rails_helper"

RSpec.describe "Api::V1::RubricRatings", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:admin)
    Current.tenant = nil
    u
  end

  let(:rubric) do
    Current.tenant = tenant
    r = create(:rubric, tenant: tenant, created_by: admin)
    Current.tenant = nil
    r
  end
  let(:criterion) do
    Current.tenant = tenant
    c = create(:rubric_criterion, tenant: tenant, rubric: rubric)
    Current.tenant = nil
    c
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "nested CRUD" do
    it "lists, creates, updates, and destroys ratings as admin" do
      mock_session(admin, tenant: tenant)
      rating = create(:rubric_rating, tenant: tenant, rubric_criterion: criterion, description: "Good")

      get "/api/v1/rubric_criteria/#{criterion.id}/ratings"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.map { |row| row["id"] }).to include(rating.id)

      post "/api/v1/rubric_criteria/#{criterion.id}/ratings", params: { description: "Excellent", points: 10, position: 1 }
      expect(response).to have_http_status(:created)
      created = RubricRating.find(response.parsed_body["id"])
      expect(created.rubric_criterion_id).to eq(criterion.id)
      expect(created.tenant_id).to eq(tenant.id)

      patch "/api/v1/rubric_ratings/#{rating.id}", params: { description: "Updated" }
      expect(response).to have_http_status(:ok)

      delete "/api/v1/rubric_ratings/#{rating.id}"
      expect(response).to have_http_status(:no_content)
    end
  end
end
