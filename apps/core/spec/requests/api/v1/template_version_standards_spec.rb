require "rails_helper"

RSpec.describe "Api::V1::TemplateVersionStandards", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:curriculum_lead) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:curriculum_lead)
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

  let(:template) do
    Current.tenant = tenant
    t = create(:template, tenant: tenant, created_by: curriculum_lead)
    Current.tenant = nil
    t
  end

  let(:template_version) do
    Current.tenant = tenant
    v = template.create_version!(title: "v1")
    Current.tenant = nil
    v
  end

  let(:framework) do
    Current.tenant = tenant
    f = create(:standard_framework, tenant: tenant)
    Current.tenant = nil
    f
  end

  let(:standard) do
    Current.tenant = tenant
    s = create(:standard, tenant: tenant, standard_framework: framework)
    Current.tenant = nil
    s
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/template_versions/:template_version_id/standards" do
    it "returns aligned standards" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:template_version_standard, tenant: tenant, template_version: template_version, standard: standard)
      Current.tenant = nil

      get "/api/v1/template_versions/#{template_version.id}/standards"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
      expect(response.parsed_body.first["id"]).to eq(standard.id)
    end
  end

  describe "POST /api/v1/template_versions/:template_version_id/standards" do
    it "attaches a standard to a template version" do
      mock_session(curriculum_lead, tenant: tenant)
      # ensure standard exists
      standard

      expect {
        post "/api/v1/template_versions/#{template_version.id}/standards", params: { standard_id: standard.id }
      }.to change(TemplateVersionStandard.unscoped, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["id"]).to eq(standard.id)
    end

    it "returns error for duplicate standard" do
      mock_session(curriculum_lead, tenant: tenant)
      Current.tenant = tenant
      create(:template_version_standard, tenant: tenant, template_version: template_version, standard: standard)
      Current.tenant = nil

      post "/api/v1/template_versions/#{template_version.id}/standards", params: { standard_id: standard.id }

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "denies attach for teacher" do
      mock_session(teacher, tenant: tenant)
      standard

      post "/api/v1/template_versions/#{template_version.id}/standards", params: { standard_id: standard.id }

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "DELETE /api/v1/template_versions/:template_version_id/standards/:id" do
    it "detaches a standard from a template version" do
      mock_session(curriculum_lead, tenant: tenant)
      Current.tenant = tenant
      create(:template_version_standard, tenant: tenant, template_version: template_version, standard: standard)
      Current.tenant = nil

      expect {
        delete "/api/v1/template_versions/#{template_version.id}/standards/#{standard.id}"
      }.to change(TemplateVersionStandard.unscoped, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end

    it "denies detach for teacher" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:template_version_standard, tenant: tenant, template_version: template_version, standard: standard)
      Current.tenant = nil

      delete "/api/v1/template_versions/#{template_version.id}/standards/#{standard.id}"

      expect(response).to have_http_status(:forbidden)
    end
  end
end
