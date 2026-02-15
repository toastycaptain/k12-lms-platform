require "rails_helper"

RSpec.describe "Api::V1::RubricCriteria", type: :request do
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

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "nested CRUD" do
    it "lists, creates, updates, and destroys criteria as admin" do
      mock_session(admin, tenant: tenant)
      criterion = create(:rubric_criterion, tenant: tenant, rubric: rubric, title: "Old")

      get "/api/v1/rubrics/#{rubric.id}/criteria"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.map { |row| row["id"] }).to include(criterion.id)

      post "/api/v1/rubrics/#{rubric.id}/criteria", params: { title: "Content", points: 10, position: 1 }
      expect(response).to have_http_status(:created)
      created = RubricCriterion.find(response.parsed_body["id"])
      expect(created.rubric_id).to eq(rubric.id)
      expect(created.tenant_id).to eq(tenant.id)

      patch "/api/v1/rubric_criteria/#{criterion.id}", params: { title: "Updated" }
      expect(response).to have_http_status(:ok)

      delete "/api/v1/rubric_criteria/#{criterion.id}"
      expect(response).to have_http_status(:no_content)
    end
  end
end
