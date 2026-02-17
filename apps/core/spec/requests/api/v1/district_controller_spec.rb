require "rails_helper"

RSpec.describe "Api::V1::District", type: :request do
  let(:district) { create(:district, name: "Metro District") }
  let(:north_tenant) { create(:tenant, district: district, name: "North High") }
  let(:south_tenant) { create(:tenant, district: district, name: "South High") }
  let(:district_admin) { create(:user, tenant: north_tenant, district_admin: true, email: "district-admin@example.com") }
  let(:regular_user) { create(:user, tenant: north_tenant, district_admin: false) }
  let(:source_template) do
    Current.tenant = north_tenant
    value = create(
      :template,
      tenant: north_tenant,
      created_by: district_admin,
      name: "District Template",
      status: "draft"
    )
    value.create_version!(title: "District Template v1")
    value.publish!
    Current.tenant = nil
    value
  end

  before do
    Current.tenant = north_tenant
    district_admin.add_role(:admin)
    regular_user.add_role(:teacher)
    create(:school, tenant: north_tenant, name: "North Campus", timezone: "America/New_York")
    create(:user, tenant: north_tenant).tap { |u| u.add_role(:teacher) }
    create(:user, tenant: north_tenant).tap { |u| u.add_role(:student) }

    north_framework = create(:standard_framework, tenant: north_tenant, name: "Math Framework")
    north_standard = create(:standard, tenant: north_tenant, standard_framework: north_framework, code: "MATH.1", grade_band: "3-5")
    north_year = create(:academic_year, tenant: north_tenant)
    north_course = create(:course, tenant: north_tenant, academic_year: north_year)
    north_assignment = create(:assignment, tenant: north_tenant, course: north_course, created_by: district_admin)
    create(:assignment_standard, tenant: north_tenant, assignment: north_assignment, standard: north_standard)

    Current.tenant = south_tenant
    create(:school, tenant: south_tenant, name: "South Campus", timezone: "America/Chicago")
    south_user = create(:user, tenant: south_tenant, email: "south-admin@example.com")
    south_user.add_role(:admin)
    create(:user, tenant: south_tenant).tap { |u| u.add_role(:teacher) }
    create(:user, tenant: south_tenant).tap { |u| u.add_role(:student) }
    south_framework = create(:standard_framework, tenant: south_tenant, name: "Math Framework")
    create(:standard, tenant: south_tenant, standard_framework: south_framework, code: "MATH.1", grade_band: "3-5")
    source_template

    Current.tenant = nil
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/district/schools" do
    it "returns schools across district tenants for district admins" do
      mock_session(district_admin, tenant: north_tenant)

      get "/api/v1/district/schools"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.map { |school| school["name"] }).to contain_exactly("North Campus", "South Campus")
    end

    it "returns forbidden for non-district-admin users" do
      mock_session(regular_user, tenant: north_tenant)

      get "/api/v1/district/schools"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/v1/district/standards_coverage" do
    it "returns per-school coverage summaries" do
      mock_session(district_admin, tenant: north_tenant)

      get "/api/v1/district/standards_coverage"

      expect(response).to have_http_status(:ok)
      north_row = response.parsed_body.find { |row| row["school"] == "North High" }
      south_row = response.parsed_body.find { |row| row["school"] == "South High" }

      expect(north_row["coverage_pct"]).to be > 0
      expect(south_row["coverage_pct"]).to eq(0.0)
      expect(north_row["frameworks"].first["framework_name"]).to eq("Math Framework")
    end
  end

  describe "GET /api/v1/district/user_summary" do
    it "returns district user counts grouped by role and school" do
      mock_session(district_admin, tenant: north_tenant)

      get "/api/v1/district/user_summary"

      expect(response).to have_http_status(:ok)
      north_row = response.parsed_body.find { |row| row["school"] == "North High" }
      south_row = response.parsed_body.find { |row| row["school"] == "South High" }

      expect(north_row["teachers"]).to be >= 1
      expect(north_row["students"]).to be >= 1
      expect(north_row["district_admins"]).to eq(1)
      expect(south_row["admins"]).to be >= 1
    end
  end

  describe "POST /api/v1/district/push_template" do
    it "pushes a template to selected schools in the same district" do
      mock_session(district_admin, tenant: north_tenant)

      expect {
        post "/api/v1/district/push_template", params: {
          template_id: source_template.id,
          target_tenant_ids: [ south_tenant.id ]
        }
      }.to change { Template.unscoped.where(tenant_id: south_tenant.id).count }.by(1)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["pushed"].first["school"]).to eq("South High")
    end
  end
end
