require "rails_helper"

RSpec.describe "Api::V1::CurriculumDocuments", type: :request do
  let(:tenant) do
    create(:tenant, settings: { "curriculum_default_profile_key" => "american_common_core_v1", "curriculum_default_profile_version" => "2026.1" })
  end
  let!(:documents_flag) { FeatureFlag.create!(key: "curriculum_documents_v1", enabled: true, tenant: tenant) }
  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    Current.tenant = nil
    user
  end
  let(:school) { create(:school, tenant: tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year, school: school) }

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "planning context and document flow" do
    it "creates a planning context and curriculum document with pinned pack/schema" do
      mock_session(admin, tenant: tenant)

      post "/api/v1/planning_contexts", params: {
        planning_context: {
          school_id: school.id,
          academic_year_id: academic_year.id,
          kind: "course",
          name: "Grade 6 Math Planning",
          course_ids: [ course.id ]
        }
      }
      expect(response).to have_http_status(:created), response.body
      context_id = response.parsed_body["id"]

      post "/api/v1/curriculum_documents", params: {
        curriculum_document: {
          planning_context_id: context_id,
          document_type: "unit_plan",
          title: "Number Sense Unit",
          content: { "title" => "Number Sense Unit" }
        }
      }
      expect(response).to have_http_status(:created)
      body = response.parsed_body
      expect(body["pack_key"]).to eq("american_common_core_v1")
      expect(body["pack_version"]).to eq("2026.1")
      expect(body["schema_key"]).to eq("us.unit@v1")
      expect(body["current_version_id"]).to be_present
    end

    it "returns schema validation errors when version content is invalid and validation flag is enabled" do
      FeatureFlag.create!(key: "curriculum_document_schema_validation_v1", enabled: true, tenant: tenant)
      mock_session(admin, tenant: tenant)

      planning_context = Curriculum::PlanningContextFactory.create!(
        tenant: tenant,
        created_by: admin,
        school: school,
        academic_year: academic_year,
        kind: "course",
        name: "Context",
        course_ids: [ course.id ]
      )
      document = Curriculum::DocumentFactory.create!(
        planning_context: planning_context,
        document_type: "unit_plan",
        title: "Unit",
        created_by: admin,
        initial_content: {
          "title" => "Unit",
          "priority_standards" => [ "CCSS.1" ],
          "learning_targets" => [ "Target 1" ],
          "success_criteria" => [ "Criteria 1" ]
        }
      )

      post "/api/v1/curriculum_documents/#{document.id}/versions", params: {
        version: {
          title: "Invalid Draft",
          content: { "title" => "Invalid Draft" }
        }
      }

      expect(response).to have_http_status(:unprocessable_content), response.body
      expect(response.parsed_body["error"]).to eq("schema_validation_failed")
      expect(response.parsed_body["details"]).to be_an(Array)
    end

    it "enforces pack relationship constraints on links" do
      mock_session(admin, tenant: tenant)
      planning_context = Curriculum::PlanningContextFactory.create!(
        tenant: tenant,
        created_by: admin,
        school: school,
        academic_year: academic_year,
        kind: "course",
        name: "Context",
        course_ids: [ course.id ]
      )
      unit_document = Curriculum::DocumentFactory.create!(
        planning_context: planning_context,
        document_type: "unit_plan",
        title: "Unit",
        created_by: admin,
        initial_content: { "title" => "Unit" }
      )
      template_document = Curriculum::DocumentFactory.create!(
        planning_context: planning_context,
        document_type: "template",
        title: "Template",
        created_by: admin,
        initial_content: { "title" => "Template" }
      )

      post "/api/v1/curriculum_documents/#{unit_document.id}/links", params: {
        link: {
          target_document_id: template_document.id,
          relationship_type: "contains"
        }
      }

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["errors"].join(" ")).to include("not allowed")
    end
  end
end
