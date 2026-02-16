require "rails_helper"

RSpec.describe "Api::V1::StandardsCoverage", type: :request do
  let!(:tenant) { create(:tenant) }

  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant, first_name: "Admin", last_name: "User")
    user.add_role(:admin)
    Current.tenant = nil
    user
  end

  let(:teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant, first_name: "Teacher", last_name: "User")
    user.add_role(:teacher)
    Current.tenant = nil
    user
  end

  let(:other_teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant, first_name: "Other", last_name: "Teacher")
    user.add_role(:teacher)
    Current.tenant = nil
    user
  end

  let(:student) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant, first_name: "Student", last_name: "User")
    user.add_role(:student)
    Current.tenant = nil
    user
  end

  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:other_course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:section) { create(:section, tenant: tenant, course: course, term: term) }

  before do
    Current.tenant = tenant
    create(:enrollment, tenant: tenant, user: teacher, section: section, role: "teacher")
    create(:enrollment, tenant: tenant, user: student, section: section, role: "student")
    Current.tenant = nil
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/academic_years/:id/standards_coverage" do
    it "returns framework coverage, uncovered standards, and percentages" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant

      framework_math = create(
        :standard_framework,
        tenant: tenant,
        name: "Math Framework",
        subject: "Mathematics"
      )
      framework_ela = create(
        :standard_framework,
        tenant: tenant,
        name: "ELA Framework",
        subject: "ELA"
      )

      math_std_1 = create(:standard, tenant: tenant, standard_framework: framework_math, code: "MATH.1")
      math_std_2 = create(:standard, tenant: tenant, standard_framework: framework_math, code: "MATH.2")
      math_std_3 = create(:standard, tenant: tenant, standard_framework: framework_math, code: "MATH.3")
      ela_std_1 = create(:standard, tenant: tenant, standard_framework: framework_ela, code: "ELA.1")

      assignment = create(
        :assignment,
        tenant: tenant,
        course: course,
        created_by: teacher,
        title: "Math Practice",
        assignment_type: "written",
        status: "published"
      )
      AssignmentStandard.create!(tenant: tenant, assignment: assignment, standard: math_std_1)

      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: teacher, title: "Unit A")
      version = unit_plan.create_version!(title: "v1")
      UnitVersionStandard.create!(tenant: tenant, unit_version: version, standard: math_std_2)

      Current.tenant = nil

      get "/api/v1/academic_years/#{academic_year.id}/standards_coverage"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      frameworks = body.fetch("frameworks")

      math_row = frameworks.find { |row| row["framework_id"] == framework_math.id }
      ela_row = frameworks.find { |row| row["framework_id"] == framework_ela.id }

      expect(math_row).to include(
        "framework_name" => "Math Framework",
        "subject" => "Mathematics",
        "total_standards" => 3,
        "covered_standards" => 2,
        "coverage_percentage" => 66.7
      )
      expect(math_row.fetch("uncovered").map { |std| std["id"] }).to contain_exactly(math_std_3.id)

      expect(ela_row).to include(
        "framework_name" => "ELA Framework",
        "total_standards" => 1,
        "covered_standards" => 0,
        "coverage_percentage" => 0.0
      )
      expect(ela_row.fetch("uncovered").map { |std| std["id"] }).to contain_exactly(ela_std_1.id)
    end

    it "scopes teacher results to taught courses while admin sees all course coverage" do
      Current.tenant = tenant
      framework = create(:standard_framework, tenant: tenant, name: "State Framework")
      std_a = create(:standard, tenant: tenant, standard_framework: framework, code: "STD.A")
      std_b = create(:standard, tenant: tenant, standard_framework: framework, code: "STD.B")

      assignment_for_course = create(
        :assignment,
        tenant: tenant,
        course: course,
        created_by: teacher,
        assignment_type: "written",
        status: "published"
      )
      AssignmentStandard.create!(tenant: tenant, assignment: assignment_for_course, standard: std_a)

      assignment_for_other_course = create(
        :assignment,
        tenant: tenant,
        course: other_course,
        created_by: other_teacher,
        assignment_type: "written",
        status: "published"
      )
      AssignmentStandard.create!(tenant: tenant, assignment: assignment_for_other_course, standard: std_b)
      Current.tenant = nil

      mock_session(teacher, tenant: tenant)
      get "/api/v1/academic_years/#{academic_year.id}/standards_coverage"
      expect(response).to have_http_status(:ok)
      teacher_framework = response.parsed_body.fetch("frameworks").find { |row| row["framework_id"] == framework.id }
      expect(teacher_framework["covered_standards"]).to eq(1)

      mock_session(admin, tenant: tenant)
      get "/api/v1/academic_years/#{academic_year.id}/standards_coverage"
      expect(response).to have_http_status(:ok)
      admin_framework = response.parsed_body.fetch("frameworks").find { |row| row["framework_id"] == framework.id }
      expect(admin_framework["covered_standards"]).to eq(2)
      expect(admin_framework["coverage_percentage"]).to eq(100.0)
    end
  end

  describe "GET /api/v1/courses/:id/standards_coverage" do
    it "returns per-course framework coverage with assignment and unit-plan sources" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant

      framework = create(:standard_framework, tenant: tenant, name: "Math Framework")
      std_assignment = create(:standard, tenant: tenant, standard_framework: framework, code: "M.A")
      std_unit = create(:standard, tenant: tenant, standard_framework: framework, code: "M.U")
      std_uncovered = create(:standard, tenant: tenant, standard_framework: framework, code: "M.X")

      assignment = create(
        :assignment,
        tenant: tenant,
        course: course,
        created_by: teacher,
        assignment_type: "written",
        status: "published"
      )
      AssignmentStandard.create!(tenant: tenant, assignment: assignment, standard: std_assignment)

      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: teacher, title: "Unit One")
      version = unit_plan.create_version!(title: "v1")
      UnitVersionStandard.create!(tenant: tenant, unit_version: version, standard: std_unit)

      Current.tenant = nil

      get "/api/v1/courses/#{course.id}/standards_coverage"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      framework_row = body.fetch("frameworks").find { |row| row["framework_id"] == framework.id }
      expect(framework_row).to include(
        "total_standards" => 3,
        "covered_standards" => 2,
        "coverage_percentage" => 66.7
      )

      assignment_entry = framework_row.fetch("covered").find { |std| std["id"] == std_assignment.id }
      unit_entry = framework_row.fetch("covered").find { |std| std["id"] == std_unit.id }

      expect(assignment_entry).to include(
        "covered_by_assignment" => true,
        "covered_by_unit_plan" => false
      )
      expect(unit_entry).to include(
        "covered_by_assignment" => false,
        "covered_by_unit_plan" => true
      )
      expect(framework_row.fetch("uncovered").map { |std| std["id"] }).to contain_exactly(std_uncovered.id)
    end

    it "returns zero coverage when a course has no alignments" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      framework = create(:standard_framework, tenant: tenant, name: "Science")
      create(:standard, tenant: tenant, standard_framework: framework, code: "SCI.1")
      Current.tenant = nil

      get "/api/v1/courses/#{course.id}/standards_coverage"

      expect(response).to have_http_status(:ok)
      framework_row = response.parsed_body.fetch("frameworks").find { |row| row["framework_id"] == framework.id }
      expect(framework_row).to include(
        "total_standards" => 1,
        "covered_standards" => 0,
        "coverage_percentage" => 0.0
      )
      expect(framework_row.fetch("covered")).to eq([])
      expect(framework_row.fetch("uncovered").length).to eq(1)
    end

    it "applies policy scoping to course access" do
      Current.tenant = tenant
      framework = create(:standard_framework, tenant: tenant, name: "Scope Framework")
      create(:standard, tenant: tenant, standard_framework: framework, code: "SCOPE.1")
      Current.tenant = nil

      mock_session(teacher, tenant: tenant)
      get "/api/v1/courses/#{other_course.id}/standards_coverage"
      expect(response).to have_http_status(:not_found)

      mock_session(admin, tenant: tenant)
      get "/api/v1/courses/#{other_course.id}/standards_coverage"
      expect(response).to have_http_status(:ok)

      mock_session(student, tenant: tenant)
      get "/api/v1/courses/#{course.id}/standards_coverage"
      expect(response).to have_http_status(:forbidden)
    end
  end
end
