require "rails_helper"

RSpec.describe "Api::V1::Ib::OperationalRecords phase 4 filters", type: :request do
  let(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant, first_name: "Avery", last_name: "Admin")
    user.add_role(:admin)
    Current.tenant = nil
    user
  end
  let(:student) { create(:user, tenant: tenant, first_name: "Maya", last_name: "Chen") }
  let(:advisor) { create(:user, tenant: tenant, first_name: "Drew", last_name: "Advisor") }
  let(:school) { create(:school, tenant: tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:planning_context) { create(:planning_context, tenant: tenant, school: school, academic_year: academic_year, created_by: admin) }
  let!(:ia_record) do
    create(
      :ib_operational_record,
      tenant: tenant,
      school: school,
      planning_context: planning_context,
      programme: "DP",
      record_family: "dp_ia",
      subtype: "ia",
      title: "Maya Chen IA",
      student: student,
      advisor: advisor,
      summary: "Authenticity check is due this week.",
      next_action: "Confirm the authenticity review.",
      risk_level: "watch"
    )
  end
  let!(:ee_record) do
    create(
      :ib_operational_record,
      tenant: tenant,
      school: school,
      planning_context: planning_context,
      programme: "DP",
      record_family: "dp_ee",
      subtype: "extended_essay",
      title: "Maya Chen EE",
      student: student,
      advisor: advisor,
      summary: "Supervisor meeting notes are missing.",
      next_action: "Log the supervision meeting.",
      risk_level: "risk"
    )
  end
  let!(:other_record) do
    create(
      :ib_operational_record,
      tenant: tenant,
      school: school,
      planning_context: planning_context,
      programme: "MYP",
      record_family: "myp_project",
      subtype: "personal_project",
      title: "Unrelated MYP project"
    )
  end

  before do
    mock_session(admin, tenant: tenant)
  end

  after do
    Current.tenant = nil
    Current.user = nil
    Current.school = nil
  end

  it "filters by comma-separated family, student, and search term while returning enriched names" do
    get "/api/v1/ib/operational_records", params: {
      programme: "DP",
      record_family: "dp_ia,dp_ee",
      student_id: student.id,
      q: "supervision"
    }, headers: {
      "X-School-Id" => school.id.to_s
    }

    expect(response).to have_http_status(:ok), response.body
    expect(response.parsed_body.length).to eq(1)
    expect(response.parsed_body.first["title"]).to eq("Maya Chen EE")
    expect(response.parsed_body.first["student_name"]).to eq("Maya Chen")
    expect(response.parsed_body.first["advisor_name"]).to eq("Drew Advisor")
  end
end
