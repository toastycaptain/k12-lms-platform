require "rails_helper"

RSpec.describe "Api::V1::Courses", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:admin)
    Current.tenant = nil
    u
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/courses" do
    it "returns all courses" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      create_list(:course, 2, tenant: tenant, academic_year: ay)
      Current.tenant = nil

      get "/api/v1/courses"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(2)
    end
  end

  describe "POST /api/v1/courses" do
    it "creates a course for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      Current.tenant = nil

      expect {
        post "/api/v1/courses", params: {
          course: { academic_year_id: ay.id, name: "Math 101", code: "MATH101", description: "Intro to Math" }
        }
      }.to change(Course.unscoped, :count).by(1)

      expect(response).to have_http_status(:created)
    end
  end

  describe "PATCH /api/v1/courses/:id" do
    it "updates a course" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      Current.tenant = nil

      patch "/api/v1/courses/#{course.id}", params: { course: { name: "Updated Course" } }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["name"]).to eq("Updated Course")
    end
  end

  describe "DELETE /api/v1/courses/:id" do
    it "deletes a course" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      Current.tenant = nil

      expect {
        delete "/api/v1/courses/#{course.id}"
      }.to change(Course.unscoped, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end
  end
end
