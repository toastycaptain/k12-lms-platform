require "rails_helper"

RSpec.describe "Api::V1::Announcements", type: :request do
  let!(:tenant) { create(:tenant) }
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
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }

  after { Current.tenant = nil }

  describe "GET /api/v1/courses/:course_id/announcements" do
    it "teacher sees all announcements" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:announcement, tenant: tenant, course: course, created_by: teacher, published_at: Time.current)
      create(:announcement, tenant: tenant, course: course, created_by: teacher, published_at: nil)
      Current.tenant = nil

      get "/api/v1/courses/#{course.id}/announcements"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(2)
    end

    it "student sees only published announcements" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      create(:announcement, tenant: tenant, course: course, created_by: teacher, published_at: Time.current)
      create(:announcement, tenant: tenant, course: course, created_by: teacher, published_at: nil)
      Current.tenant = nil

      get "/api/v1/courses/#{course.id}/announcements"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end

    it "returns pinned announcements first" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:announcement, tenant: tenant, course: course, created_by: teacher, pinned: false, published_at: 2.days.ago)
      create(:announcement, tenant: tenant, course: course, created_by: teacher, pinned: true, published_at: 1.day.ago)
      Current.tenant = nil

      get "/api/v1/courses/#{course.id}/announcements"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.first["pinned"]).to be true
    end
  end

  describe "POST /api/v1/courses/:course_id/announcements" do
    it "creates an announcement" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/courses/#{course.id}/announcements", params: {
        title: "Welcome!", message: "Welcome to the course", published_at: Time.current.iso8601
      }
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["title"]).to eq("Welcome!")
    end

    it "returns 403 for students" do
      mock_session(student, tenant: tenant)

      post "/api/v1/courses/#{course.id}/announcements", params: { title: "Test", message: "Test" }
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "PATCH /api/v1/announcements/:id" do
    let(:announcement) do
      Current.tenant = tenant
      a = create(:announcement, tenant: tenant, course: course, created_by: teacher)
      Current.tenant = nil
      a
    end

    it "updates an announcement" do
      mock_session(teacher, tenant: tenant)

      patch "/api/v1/announcements/#{announcement.id}", params: { title: "Updated" }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["title"]).to eq("Updated")
    end
  end

  describe "DELETE /api/v1/announcements/:id" do
    let(:announcement) do
      Current.tenant = tenant
      a = create(:announcement, tenant: tenant, course: course, created_by: teacher)
      Current.tenant = nil
      a
    end

    it "deletes an announcement" do
      mock_session(teacher, tenant: tenant)

      delete "/api/v1/announcements/#{announcement.id}"
      expect(response).to have_http_status(:no_content)
    end
  end
end
