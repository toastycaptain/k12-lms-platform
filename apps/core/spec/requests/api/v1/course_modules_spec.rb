require "rails_helper"

RSpec.describe "Api::V1::CourseModules", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:teacher) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:teacher)
    Current.tenant = nil
    u
  end
  let(:student) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:student)
    Current.tenant = nil
    u
  end
  let(:admin) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:admin)
    Current.tenant = nil
    u
  end
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }

  after { Current.tenant = nil }

  describe "GET /api/v1/courses/:course_id/modules" do
    it "lists modules for a course" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:course_module, tenant: tenant, course: course, title: "Week 1")
      create(:course_module, tenant: tenant, course: course, title: "Week 2")
      Current.tenant = nil

      get "/api/v1/courses/#{course.id}/modules"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(2)
    end
  end

  describe "POST /api/v1/courses/:course_id/modules" do
    it "creates a module" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/courses/#{course.id}/modules", params: { title: "New Module", description: "Desc" }
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["title"]).to eq("New Module")
    end

    it "returns 403 for students" do
      mock_session(student, tenant: tenant)

      post "/api/v1/courses/#{course.id}/modules", params: { title: "Module" }
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "PATCH /api/v1/modules/:id" do
    let(:mod) do
      Current.tenant = tenant
      m = create(:course_module, tenant: tenant, course: course)
      Current.tenant = nil
      m
    end

    it "updates a module" do
      mock_session(teacher, tenant: tenant)

      patch "/api/v1/modules/#{mod.id}", params: { title: "Updated" }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["title"]).to eq("Updated")
    end
  end

  describe "DELETE /api/v1/modules/:id" do
    let(:mod) do
      Current.tenant = tenant
      m = create(:course_module, tenant: tenant, course: course)
      Current.tenant = nil
      m
    end

    it "returns 403 for non-admin" do
      mock_session(teacher, tenant: tenant)

      delete "/api/v1/modules/#{mod.id}"
      expect(response).to have_http_status(:forbidden)
    end

    it "deletes for admin" do
      mock_session(admin, tenant: tenant)

      delete "/api/v1/modules/#{mod.id}"
      expect(response).to have_http_status(:no_content)
    end
  end

  describe "POST /api/v1/modules/:id/publish" do
    let(:mod) do
      Current.tenant = tenant
      m = create(:course_module, tenant: tenant, course: course, status: "draft")
      Current.tenant = nil
      m
    end

    it "publishes a draft module" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/modules/#{mod.id}/publish"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("published")
    end
  end

  describe "POST /api/v1/modules/:id/archive" do
    let(:mod) do
      Current.tenant = tenant
      m = create(:course_module, tenant: tenant, course: course, status: "published")
      Current.tenant = nil
      m
    end

    it "archives a published module" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/modules/#{mod.id}/archive"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("archived")
    end
  end

  describe "module items" do
    let(:mod) do
      Current.tenant = tenant
      m = create(:course_module, tenant: tenant, course: course)
      Current.tenant = nil
      m
    end

    it "creates and lists module items" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/modules/#{mod.id}/module_items", params: { title: "Read Chapter 1", item_type: "resource" }
      expect(response).to have_http_status(:created)

      get "/api/v1/modules/#{mod.id}/module_items"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end

    it "deletes a module item" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      item = create(:module_item, tenant: tenant, course_module: mod)
      Current.tenant = nil

      delete "/api/v1/module_items/#{item.id}"
      expect(response).to have_http_status(:no_content)
    end
  end

  describe "POST /api/v1/modules/:id/reorder_items" do
    let(:mod) do
      Current.tenant = tenant
      m = create(:course_module, tenant: tenant, course: course)
      Current.tenant = nil
      m
    end

    it "reorders items" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      item1 = create(:module_item, tenant: tenant, course_module: mod, position: 0)
      item2 = create(:module_item, tenant: tenant, course_module: mod, position: 1)
      Current.tenant = nil

      post "/api/v1/modules/#{mod.id}/reorder_items", params: { item_ids: [ item2.id, item1.id ] }
      expect(response).to have_http_status(:ok)
      expect(item2.reload.position).to eq(0)
      expect(item1.reload.position).to eq(1)
    end
  end
end
