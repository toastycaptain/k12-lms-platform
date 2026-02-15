require "rails_helper"

RSpec.describe "Api::V1::ModuleItemCompletions", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:student) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:student)
    Current.tenant = nil
    u
  end
  let(:other_student) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:student)
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
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:section) { create(:section, tenant: tenant, course: course, term: term) }
  let(:course_module) do
    Current.tenant = tenant
    cm = create(:course_module, tenant: tenant, course: course, status: "published")
    Current.tenant = nil
    cm
  end
  let(:module_item) do
    Current.tenant = tenant
    mi = create(:module_item, tenant: tenant, course_module: course_module)
    Current.tenant = nil
    mi
  end

  before do
    Current.tenant = tenant
    create(:enrollment, tenant: tenant, section: section, user: student, role: "student")
    create(:enrollment, tenant: tenant, section: section, user: teacher, role: "teacher")
    Current.tenant = nil
  end

  after { Current.tenant = nil }

  describe "POST /api/v1/module_items/:module_item_id/complete" do
    it "creates a completion for an enrolled student" do
      mock_session(student, tenant: tenant)

      expect {
        post "/api/v1/module_items/#{module_item.id}/complete"
      }.to change(ModuleItemCompletion, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["module_item_id"]).to eq(module_item.id)
      expect(response.parsed_body["user_id"]).to eq(student.id)
    end

    it "is idempotent when completion already exists" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      create(:module_item_completion, tenant: tenant, module_item: module_item, user: student)
      Current.tenant = nil

      expect {
        post "/api/v1/module_items/#{module_item.id}/complete"
      }.not_to change(ModuleItemCompletion, :count)
      expect(response).to have_http_status(:created)
    end

    it "returns 403 when student is not enrolled in the course" do
      mock_session(other_student, tenant: tenant)

      post "/api/v1/module_items/#{module_item.id}/complete"
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "DELETE /api/v1/module_items/:module_item_id/complete" do
    it "removes the completion record" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      completion = create(:module_item_completion, tenant: tenant, module_item: module_item, user: student)
      Current.tenant = nil

      expect {
        delete "/api/v1/module_items/#{module_item.id}/complete"
      }.to change(ModuleItemCompletion, :count).by(-1)

      expect(response).to have_http_status(:no_content)
      expect(ModuleItemCompletion.exists?(completion.id)).to eq(false)
    end
  end

  describe "GET /api/v1/course_modules/:id/progress" do
    it "returns progress counts for the module" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      create(:module_item_completion, tenant: tenant, module_item: module_item, user: student)
      Current.tenant = nil

      get "/api/v1/course_modules/#{course_module.id}/progress"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["course_module_id"]).to eq(course_module.id)
      expect(response.parsed_body["total_items"]).to eq(1)
      expect(response.parsed_body["current_user_completed_count"]).to eq(1)
      expect(response.parsed_body["current_user_completed_item_ids"]).to include(module_item.id)
    end
  end
end
