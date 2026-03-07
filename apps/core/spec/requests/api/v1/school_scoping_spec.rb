require "rails_helper"

RSpec.describe "School scoping", type: :request do
  let(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    Current.tenant = nil
    user
  end
  let(:teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    Current.tenant = nil
    user
  end
  let(:student) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:student)
    Current.tenant = nil
    user
  end
  let(:guardian) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:guardian)
    Current.tenant = nil
    user
  end
  let!(:feature_flag) { FeatureFlag.create!(key: "school_scoping_v1", enabled: true, tenant: tenant) }
  let!(:school_a) { create(:school, tenant: tenant, name: "School A") }
  let!(:school_b) { create(:school, tenant: tenant, name: "School B") }
  let!(:academic_year) { create(:academic_year, tenant: tenant) }
  let!(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let!(:course_a) { create(:course, tenant: tenant, academic_year: academic_year, school: school_a) }
  let!(:course_b) { create(:course, tenant: tenant, academic_year: academic_year, school: school_b) }

  before do
    section = create(:section, tenant: tenant, course: course_a, term: term)
    create(:enrollment, tenant: tenant, user: teacher, section: section, role: "teacher")
    create(:enrollment, tenant: tenant, user: student, section: section, role: "student")
    create(:guardian_link, tenant: tenant, guardian: guardian, student: student, status: "active")
  end

  after do
    Current.tenant = nil
    Current.user = nil
    Current.school = nil if Current.respond_to?(:school=)
  end

  it "scopes resource lookup by X-School-Id when header is present" do
    mock_session(admin, tenant: tenant)

    get "/api/v1/courses/#{course_b.id}", headers: { "X-School-Id" => school_a.id.to_s }

    expect(response).to have_http_status(:not_found)
  end

  it "allows privileged users to access cross-school resources without school header" do
    mock_session(admin, tenant: tenant)

    get "/api/v1/courses/#{course_b.id}"

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["id"]).to eq(course_b.id)
  end

  it "forbids teacher school context when they are not enrolled in that school" do
    mock_session(teacher, tenant: tenant)

    get "/api/v1/courses", headers: { "X-School-Id" => school_b.id.to_s }

    expect(response).to have_http_status(:forbidden)
  end

  it "allows students to access their enrolled school context" do
    mock_session(student, tenant: tenant)

    get "/api/v1/courses", headers: { "X-School-Id" => school_a.id.to_s }

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.map { |course| course["id"] }).to include(course_a.id)
  end

  it "allows guardians to access a linked student's school context" do
    mock_session(guardian, tenant: tenant)

    get "/api/v1/ib/guardian", headers: { "X-School-Id" => school_a.id.to_s }

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to include("stories", "current_units", "portfolio_highlights")
  end
end
