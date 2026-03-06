require "rails_helper"

RSpec.describe "Api::V1::CurriculumDocumentVersionAlignments", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    Current.tenant = nil
    user
  end

  let!(:school) { create(:school, tenant: tenant) }
  let!(:academic_year) { create(:academic_year, tenant: tenant) }
  let!(:planning_context) { create(:planning_context, tenant: tenant, school: school, academic_year: academic_year, created_by: admin) }
  let!(:document) do
    create(
      :curriculum_document,
      tenant: tenant,
      school: school,
      academic_year: academic_year,
      planning_context: planning_context,
      created_by: admin,
      document_type: "unit_plan"
    )
  end
  let!(:version) do
    create(
      :curriculum_document_version,
      tenant: tenant,
      curriculum_document: document,
      created_by: admin,
      version_number: 1
    )
  end
  let!(:framework) { create(:standard_framework, tenant: tenant, framework_kind: "standard") }
  let!(:standard) { create(:standard, tenant: tenant, standard_framework: framework, code: "MATH.1") }

  before do
    FeatureFlag.find_or_create_by!(tenant: tenant, key: "curriculum_documents_v1") { |flag| flag.enabled = true }
    FeatureFlag.find_or_create_by!(tenant: tenant, key: "generic_frameworks_v1") { |flag| flag.enabled = true }
    mock_session(admin, tenant: tenant)
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "POST /api/v1/curriculum_document_versions/:id/alignments" do
    it "creates an alignment" do
      post "/api/v1/curriculum_document_versions/#{version.id}/alignments", params: {
        alignment: { standard_id: standard.id, alignment_type: "aligned" }
      }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["standard_id"]).to eq(standard.id)
      expect(response.parsed_body["alignment_type"]).to eq("aligned")
    end
  end

  describe "GET /api/v1/curriculum_document_versions/:id/alignments" do
    it "lists alignments for the version" do
      create(
        :curriculum_document_version_alignment,
        tenant: tenant,
        curriculum_document_version: version,
        standard: standard,
        alignment_type: "aligned"
      )

      get "/api/v1/curriculum_document_versions/#{version.id}/alignments"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.size).to eq(1)
      expect(response.parsed_body.first["curriculum_document_version_id"]).to eq(version.id)
    end
  end

  describe "DELETE /api/v1/curriculum_document_versions/:id/alignments/bulk_destroy" do
    it "removes selected alignments" do
      create(
        :curriculum_document_version_alignment,
        tenant: tenant,
        curriculum_document_version: version,
        standard: standard,
        alignment_type: "aligned"
      )

      delete "/api/v1/curriculum_document_versions/#{version.id}/alignments/bulk_destroy", params: {
        standard_ids: [ standard.id ],
        alignment_type: "aligned"
      }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["deleted"]).to eq(1)
      expect(CurriculumDocumentVersionAlignment.where(curriculum_document_version_id: version.id)).to be_empty
    end
  end
end
