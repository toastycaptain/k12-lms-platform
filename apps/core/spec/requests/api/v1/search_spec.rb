require "rails_helper"

RSpec.describe "Api::V1::Search", type: :request do
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

  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year, name: "Biology 1") }
  let(:section) { create(:section, tenant: tenant, course: course, term: term) }
  let(:assignment) do
    create(:assignment, tenant: tenant, course: course, created_by: teacher, title: "Biology Lab Report", status: "published")
  end

  before do
    Current.tenant = tenant
    create(:enrollment, tenant: tenant, user: teacher, section: section, role: "teacher")
    create(:enrollment, tenant: tenant, user: student, section: section, role: "student")
    assignment
    Current.tenant = nil
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/search" do
    it "returns empty results for short queries" do
      mock_session(admin, tenant: tenant)

      get "/api/v1/search", params: { q: "a" }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["results"]).to eq([])
    end

    it "returns matching records for privileged users" do
      mock_session(admin, tenant: tenant)

      get "/api/v1/search", params: { q: "Biology" }
      expect(response).to have_http_status(:ok)

      results = response.parsed_body["results"]
      expect(results.map { |result| result["type"] }).to include("course", "assignment")
      expect(results.find { |result| result["type"] == "course" }["url"]).to eq("/teach/courses/#{course.id}")
      expect(results.find { |result| result["type"] == "assignment" }["url"]).to eq("/teach/courses/#{course.id}/assignments/#{assignment.id}")
    end

    it "uses learn URLs for student-only users" do
      mock_session(student, tenant: tenant)

      get "/api/v1/search", params: { q: "Biology" }
      expect(response).to have_http_status(:ok)

      results = response.parsed_body["results"]
      expect(results.find { |result| result["type"] == "course" }["url"]).to eq("/learn/courses/#{course.id}")
      expect(results.find { |result| result["type"] == "assignment" }["url"]).to eq("/learn/courses/#{course.id}/assignments/#{assignment.id}")
    end
  end
end
