require "rails_helper"

RSpec.describe "Api::V1::SyncMappings", type: :request do
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
  let(:student) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:student)
    Current.tenant = nil
    u
  end
  let(:integration_config) do
    Current.tenant = tenant
    config = create(:integration_config, tenant: tenant, created_by: admin)
    Current.tenant = nil
    config
  end
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:other_course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:section) { create(:section, tenant: tenant, course: course, term: term) }

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/integration_configs/:integration_config_id/sync_mappings" do
    it "returns sync mappings for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      create(:sync_mapping, tenant: tenant, integration_config: integration_config,
        local_type: "Course", local_id: 1, external_type: "classroom_course", external_id: "gc_1")
      create(:sync_mapping, tenant: tenant, integration_config: integration_config,
        local_type: "Section", local_id: 2, external_type: "classroom_section", external_id: "gc_2")
      Current.tenant = nil

      get "/api/v1/integration_configs/#{integration_config.id}/sync_mappings"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(2)
    end

    it "returns 403 for teacher" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:enrollment, tenant: tenant, section: section, user: teacher, role: "teacher")
      create(:sync_mapping, tenant: tenant, integration_config: integration_config,
        local_type: "Course", local_id: course.id, external_type: "classroom_course", external_id: "gc_1")
      Current.tenant = nil

      get "/api/v1/integration_configs/#{integration_config.id}/sync_mappings"

      expect(response).to have_http_status(:forbidden)
    end

    it "returns 403 for teacher regardless of course mappings" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:sync_mapping, tenant: tenant, integration_config: integration_config,
        local_type: "Course", local_id: other_course.id, external_type: "classroom_course", external_id: "gc_9")
      Current.tenant = nil

      get "/api/v1/integration_configs/#{integration_config.id}/sync_mappings"

      expect(response).to have_http_status(:forbidden)
    end

    it "returns 403 for student" do
      mock_session(student, tenant: tenant)

      get "/api/v1/integration_configs/#{integration_config.id}/sync_mappings"

      expect(response).to have_http_status(:forbidden)
    end

    it "filters by local_type" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      create(:sync_mapping, tenant: tenant, integration_config: integration_config,
        local_type: "Course", local_id: 1, external_type: "classroom_course", external_id: "gc_1")
      create(:sync_mapping, tenant: tenant, integration_config: integration_config,
        local_type: "Section", local_id: 2, external_type: "classroom_section", external_id: "gc_2")
      Current.tenant = nil

      get "/api/v1/integration_configs/#{integration_config.id}/sync_mappings", params: { local_type: "Course" }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
      expect(response.parsed_body.first["local_type"]).to eq("Course")
    end
  end

  describe "GET /api/v1/sync_mappings/:id" do
    it "shows a sync mapping for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      mapping = create(:sync_mapping, tenant: tenant, integration_config: integration_config,
        local_type: "Course", local_id: 1, external_type: "classroom_course", external_id: "gc_1")
      Current.tenant = nil

      get "/api/v1/sync_mappings/#{mapping.id}"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["id"]).to eq(mapping.id)
      expect(response.parsed_body["local_type"]).to eq("Course")
      expect(response.parsed_body["external_id"]).to eq("gc_1")
    end

    it "returns 403 for teacher" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      mapping = create(:sync_mapping, tenant: tenant, integration_config: integration_config,
        local_type: "Course", local_id: 1, external_type: "classroom_course", external_id: "gc_1")
      Current.tenant = nil

      get "/api/v1/sync_mappings/#{mapping.id}"
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "DELETE /api/v1/sync_mappings/:id" do
    it "deletes a sync mapping as admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      mapping = create(:sync_mapping, tenant: tenant, integration_config: integration_config,
        local_type: "Course", local_id: 1, external_type: "classroom_course", external_id: "gc_1")
      Current.tenant = nil

      expect {
        delete "/api/v1/sync_mappings/#{mapping.id}"
      }.to change(SyncMapping.unscoped, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end

    it "returns 403 for teacher" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      mapping = create(:sync_mapping, tenant: tenant, integration_config: integration_config,
        local_type: "Course", local_id: 1, external_type: "classroom_course", external_id: "gc_1")
      Current.tenant = nil

      delete "/api/v1/sync_mappings/#{mapping.id}"

      expect(response).to have_http_status(:forbidden)
    end
  end
end
