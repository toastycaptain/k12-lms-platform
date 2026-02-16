require "rails_helper"

RSpec.describe "Api::V1::ModuleItems", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    Current.tenant = nil
    user
  end
  let(:student) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:student)
    Current.tenant = nil
    user
  end
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:course_module) { create(:course_module, tenant: tenant, course: course) }
  let(:module_item) { create(:module_item, tenant: tenant, course_module: course_module, title: "Original", position: 1) }

  after { Current.tenant = nil }

  describe "GET /api/v1/modules/:module_id/module_items" do
    it "lists module items for a module" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      first = create(:module_item, tenant: tenant, course_module: course_module, title: "First", position: 1)
      second = create(:module_item, tenant: tenant, course_module: course_module, title: "Second", position: 2)
      Current.tenant = nil

      get "/api/v1/modules/#{course_module.id}/module_items"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.map { |row| row["id"] }).to eq([ first.id, second.id ])
    end

    it "returns 404 for missing module" do
      mock_session(student, tenant: tenant)

      get "/api/v1/modules/999999/module_items"

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "GET /api/v1/module_items/:id" do
    it "shows a module item" do
      mock_session(student, tenant: tenant)

      get "/api/v1/module_items/#{module_item.id}"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["id"]).to eq(module_item.id)
    end

    it "does not expose module items from another tenant" do
      other_tenant = create(:tenant)
      Current.tenant = other_tenant
      other_item = create(:module_item, tenant: other_tenant)
      Current.tenant = nil

      mock_session(student, tenant: tenant)
      get "/api/v1/module_items/#{other_item.id}"

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/v1/modules/:module_id/module_items" do
    it "creates a module item for teacher" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/modules/#{course_module.id}/module_items", params: { title: "New Item", item_type: "resource", position: 3 }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["title"]).to eq("New Item")
    end

    it "returns 422 for invalid params" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/modules/#{course_module.id}/module_items", params: { title: "", item_type: "resource" }

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["errors"]).to be_present
    end

    it "returns 403 for student" do
      mock_session(student, tenant: tenant)

      post "/api/v1/modules/#{course_module.id}/module_items", params: { title: "Blocked", item_type: "resource" }

      expect(response).to have_http_status(:forbidden)
    end

    it "returns 401 when unauthenticated" do
      post "/api/v1/modules/#{course_module.id}/module_items", params: { title: "Blocked", item_type: "resource" }

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "PATCH /api/v1/module_items/:id" do
    it "updates a module item for teacher" do
      mock_session(teacher, tenant: tenant)

      patch "/api/v1/module_items/#{module_item.id}", params: { title: "Updated Title" }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["title"]).to eq("Updated Title")
    end

    it "returns 422 for invalid params" do
      mock_session(teacher, tenant: tenant)

      patch "/api/v1/module_items/#{module_item.id}", params: { item_type: "invalid" }

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["errors"]).to be_present
    end
  end

  describe "DELETE /api/v1/module_items/:id" do
    it "destroys a module item for teacher" do
      mock_session(teacher, tenant: tenant)

      delete "/api/v1/module_items/#{module_item.id}"

      expect(response).to have_http_status(:no_content)
      expect(ModuleItem.exists?(module_item.id)).to be(false)
    end

    it "returns 404 for missing module item" do
      mock_session(teacher, tenant: tenant)

      delete "/api/v1/module_items/999999"

      expect(response).to have_http_status(:not_found)
    end
  end
end
