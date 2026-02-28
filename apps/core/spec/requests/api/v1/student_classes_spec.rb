require "rails_helper"

RSpec.describe "Api::V1::StudentClasses", type: :request do
  let(:tenant) { create(:tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year, name: "Biology") }
  let(:section) { create(:section, tenant: tenant, course: course, term: term, name: "Section A") }

  let(:teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant, first_name: "Taylor", last_name: "Teacher")
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

  let(:other_student) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:student)
    Current.tenant = nil
    user
  end

  before do
    Current.tenant = tenant
    create(:enrollment, tenant: tenant, user: teacher, section: section, role: "teacher")
    create(:enrollment, tenant: tenant, user: student, section: section, role: "student")
    create(
      :section_meeting,
      tenant: tenant,
      section: section,
      weekday: Time.current.wday,
      start_time: "09:00",
      end_time: "10:15",
      location: "Room 204"
    )
    create(
      :section_meeting,
      tenant: tenant,
      section: section,
      weekday: (Time.current.wday + 1) % 7,
      start_time: "11:00",
      end_time: "12:00",
      location: "Tomorrow only"
    )
    Current.tenant = nil
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/students/:student_id/classes_today" do
    it "returns today's scheduled classes with teacher summary" do
      mock_session(student, tenant: tenant)

      get "/api/v1/students/#{student.id}/classes_today"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body.length).to eq(1)
      expect(body.first["course_name"]).to eq("Biology")
      expect(body.first["location"]).to eq("Room 204")
      expect(body.first["teachers"].first["name"]).to eq("Taylor Teacher")
      expect(body.first["start_at"]).to be_present
      expect(body.first["end_at"]).to be_present
    end

    it "forbids unrelated students" do
      mock_session(other_student, tenant: tenant)

      get "/api/v1/students/#{student.id}/classes_today"

      expect(response).to have_http_status(:forbidden)
    end
  end
end
