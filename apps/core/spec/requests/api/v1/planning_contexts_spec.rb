require "rails_helper"

RSpec.describe "Api::V1::PlanningContexts", type: :request do
  let(:tenant) { create(:tenant) }
  let!(:documents_flag) do
    FeatureFlag.create!(key: "curriculum_documents_v1", enabled: true, tenant: tenant)
  end
  let!(:school_scoping_flag) do
    FeatureFlag.create!(key: "school_scoping_v1", enabled: true, tenant: tenant)
  end
  let(:teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    Current.tenant = nil
    user
  end
  let!(:school) { create(:school, tenant: tenant, name: "PYP School") }
  let!(:other_school) { create(:school, tenant: tenant, name: "Other School") }
  let!(:academic_year) { create(:academic_year, tenant: tenant) }
  let!(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let!(:course) { create(:course, tenant: tenant, academic_year: academic_year, school: school) }
  let!(:section) { create(:section, tenant: tenant, course: course, term: term) }
  let!(:enrollment) do
    create(:enrollment, tenant: tenant, user: teacher, section: section, role: "teacher")
  end
  let!(:created_context) do
    create(
      :planning_context,
      tenant: tenant,
      school: school,
      academic_year: academic_year,
      created_by: teacher,
      name: "Teacher-authored context"
    )
  end
  let!(:enrolled_context) do
    create(
      :planning_context,
      tenant: tenant,
      school: school,
      academic_year: academic_year,
      created_by: create(:user, tenant: tenant),
      name: "Course-linked context"
    )
  end
  let!(:enrolled_context_course) do
    create(:planning_context_course, tenant: tenant, planning_context: enrolled_context, course: course)
  end
  let!(:hidden_context) do
    create(
      :planning_context,
      tenant: tenant,
      school: other_school,
      academic_year: academic_year,
      created_by: create(:user, tenant: tenant),
      name: "Hidden context"
    )
  end

  before do
    mock_session(teacher, tenant: tenant)
  end

  after do
    Current.tenant = nil
    Current.user = nil
    Current.school = nil if Current.respond_to?(:school=)
  end

  it "returns created and course-linked contexts for teachers inside their school scope" do
    get "/api/v1/planning_contexts",
        params: { per_page: 200 },
        headers: { "X-School-Id" => school.id.to_s }

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.map { |context| context["id"] }).to match_array(
      [ created_context.id, enrolled_context.id ]
    )
  end
end
