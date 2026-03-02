require "rails_helper"

RSpec.describe "Api::V1::Courses", type: :request do
  include ActiveJob::TestHelper

  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:admin)
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
  let(:curriculum_lead) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:curriculum_lead)
    Current.tenant = nil
    u
  end

  after do
    clear_enqueued_jobs
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

    it "supports optional pagination params" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      create_list(:course, 3, tenant: tenant, academic_year: ay)
      Current.tenant = nil

      get "/api/v1/courses", params: { page: 2, per_page: 1 }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end

    it "returns only enrolled courses for students" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      enrolled_course = create(:course, tenant: tenant, academic_year: ay)
      hidden_course = create(:course, tenant: tenant, academic_year: ay)
      term = create(:term, tenant: tenant, academic_year: ay)
      enrolled_section = create(:section, tenant: tenant, course: enrolled_course, term: term)
      hidden_section = create(:section, tenant: tenant, course: hidden_course, term: term)
      create(:enrollment, tenant: tenant, user: student, section: enrolled_section, role: "student")
      create(:enrollment, tenant: tenant, section: hidden_section, role: "student")
      Current.tenant = nil

      get "/api/v1/courses"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
      expect(response.parsed_body.first["id"]).to eq(enrolled_course.id)
    end
  end

  describe "GET /api/v1/courses/:id" do
    it "returns forbidden for students not enrolled in the course" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      Current.tenant = nil

      get "/api/v1/courses/#{course.id}"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/courses" do
    it "creates a course for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      school = create(:school, tenant: tenant)
      Current.tenant = nil

      expect {
        post "/api/v1/courses", params: {
          course: {
            academic_year_id: ay.id,
            name: "Math 101",
            code: "MATH101",
            description: "Intro to Math",
            school_id: school.id
          }
        }
      }.to change(Course.unscoped, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["school_id"]).to eq(school.id)
      expect(response.parsed_body["effective_curriculum_profile_key"]).to be_present
      expect(response.parsed_body["effective_curriculum_source"]).to be_present
      expect(response.parsed_body["curriculum_context"]).to be_a(Hash)
    end

    it "enqueues a course folder job when requested and the creator is google-connected" do
      mock_session(admin, tenant: tenant)
      admin.update!(
        google_refresh_token: "refresh-token",
        google_access_token: "access-token",
        google_token_expires_at: 1.hour.from_now
      )
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      Current.tenant = nil

      expect {
        post "/api/v1/courses", params: {
          create_drive_folder: true,
          course: { academic_year_id: ay.id, name: "Biology 101", code: "BIO101", description: "Biology intro" }
        }
      }.to have_enqueued_job(CreateCourseFolderJob).with(kind_of(Integer), admin.id)

      expect(response).to have_http_status(:created)
    end

    it "ignores curriculum-affecting params for non-admin users" do
      mock_session(curriculum_lead, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      school = create(:school, tenant: tenant)
      Current.tenant = nil

      post "/api/v1/courses", params: {
        course: {
          academic_year_id: ay.id,
          name: "Humanities 8",
          school_id: school.id,
          settings: { curriculum_profile_key: "ib_continuum_v1" }
        }
      }

      expect(response).to have_http_status(:created)
      created_course = Course.unscoped.order(:id).last
      expect(created_course.school_id).to be_nil
      expect(created_course.settings["curriculum_profile_key"]).to be_nil
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
