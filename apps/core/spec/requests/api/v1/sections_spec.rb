require "rails_helper"

RSpec.describe "Api::V1::Sections", type: :request do
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

  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:course_a) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:course_b) { create(:course, tenant: tenant, academic_year: academic_year) }

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/sections" do
    it "allows admin and supports course_id filter" do
      mock_session(admin, tenant: tenant)
      a = create(:section, tenant: tenant, course: course_a, term: term)
      create(:section, tenant: tenant, course: course_b, term: term)

      get "/api/v1/sections", params: { course_id: course_a.id }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.map { |row| row["id"] }).to contain_exactly(a.id)
    end

    it "allows teacher index/show" do
      mock_session(teacher, tenant: tenant)
      section = create(:section, tenant: tenant, course: course_a, term: term)

      get "/api/v1/sections"
      expect(response).to have_http_status(:ok)

      get "/api/v1/sections/#{section.id}"
      expect(response).to have_http_status(:ok)
    end
  end

  describe "mutations" do
    it "allows admin create/update/destroy" do
      mock_session(admin, tenant: tenant)
      section = create(:section, tenant: tenant, course: course_a, term: term)

      post "/api/v1/sections", params: { section: { course_id: course_a.id, term_id: term.id, name: "New Section" } }
      expect(response).to have_http_status(:created)

      patch "/api/v1/sections/#{section.id}", params: { section: { name: "Renamed" } }
      expect(response).to have_http_status(:ok)

      delete "/api/v1/sections/#{section.id}"
      expect(response).to have_http_status(:no_content)
    end

    it "forbids teacher create" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/sections", params: { section: { course_id: course_a.id, term_id: term.id, name: "Nope" } }

      expect(response).to have_http_status(:forbidden)
    end
  end
end
