require "rails_helper"

RSpec.describe "Api::V1::Calendar", type: :request do
  let!(:tenant) { create(:tenant) }

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

  let(:other_teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    Current.tenant = nil
    user
  end

  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:other_course) { create(:course, tenant: tenant, academic_year: academic_year) }
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

  describe "GET /api/v1/calendar" do
    it "returns unified, sorted events from unit plans, assignments, and quizzes" do
      mock_session(teacher, tenant: tenant)

      Current.tenant = tenant
      unit_plan = create(
        :unit_plan,
        tenant: tenant,
        course: course,
        created_by: teacher,
        title: "Fractions Unit",
        start_date: Date.new(2026, 2, 2),
        end_date: Date.new(2026, 2, 10)
      )
      assignment = create(
        :assignment,
        tenant: tenant,
        course: course,
        created_by: teacher,
        title: "Homework 1",
        status: "published",
        due_at: Time.zone.parse("2026-02-06 15:00:00")
      )
      quiz = create(
        :quiz,
        tenant: tenant,
        course: course,
        created_by: teacher,
        title: "Quiz 1",
        status: "published",
        due_at: Time.zone.parse("2026-02-08 11:30:00")
      )
      create(
        :assignment,
        tenant: tenant,
        course: course,
        created_by: teacher,
        title: "Outside Range",
        status: "published",
        due_at: Time.zone.parse("2026-05-01 12:00:00")
      )
      Current.tenant = nil

      get "/api/v1/calendar", params: { start_date: "2026-02-01", end_date: "2026-02-28" }

      expect(response).to have_http_status(:ok)
      events = response.parsed_body["events"]
      expect(events.map { |event| event["type"] }).to include("unit_plan", "assignment", "quiz")
      expect(events.find { |event| event["type"] == "unit_plan" }["id"]).to eq(unit_plan.id)
      expect(events.find { |event| event["type"] == "assignment" }["id"]).to eq(assignment.id)
      expect(events.find { |event| event["type"] == "quiz" }["id"]).to eq(quiz.id)

      date_values = events.map { |event| event["start_date"] || event["due_date"] }
      parsed_dates = date_values.map { |value| Time.zone.parse(value) }
      expect(parsed_dates).to eq(parsed_dates.sort)
      expect(events.none? { |event| event["title"] == "Outside Range" }).to eq(true)
    end

    it "supports course filtering via course_id" do
      mock_session(teacher, tenant: tenant)

      Current.tenant = tenant
      create(
        :unit_plan,
        tenant: tenant,
        course: course,
        created_by: teacher,
        title: "Course A Unit",
        start_date: Date.new(2026, 2, 1),
        end_date: Date.new(2026, 2, 3)
      )
      create(
        :assignment,
        tenant: tenant,
        course: other_course,
        created_by: other_teacher,
        title: "Other Course Assignment",
        status: "published",
        due_at: Time.zone.parse("2026-02-03 10:00:00")
      )
      Current.tenant = nil

      get "/api/v1/calendar", params: {
        start_date: "2026-02-01",
        end_date: "2026-02-28",
        course_id: course.id
      }

      expect(response).to have_http_status(:ok)
      events = response.parsed_body["events"]
      expect(events.map { |event| event["course_id"] }.uniq).to eq([ course.id ])
    end

    it "includes a teacher's own unit plans outside taught courses" do
      mock_session(teacher, tenant: tenant)

      Current.tenant = tenant
      own_unit = create(
        :unit_plan,
        tenant: tenant,
        course: other_course,
        created_by: teacher,
        title: "Self-Owned Unit",
        start_date: Date.new(2026, 2, 5),
        end_date: Date.new(2026, 2, 8)
      )
      Current.tenant = nil

      get "/api/v1/calendar", params: { start_date: "2026-02-01", end_date: "2026-02-28" }

      expect(response).to have_http_status(:ok)
      event_ids = response.parsed_body.fetch("events").map { |event| event["id"] }
      expect(event_ids).to include(own_unit.id)
    end

    it "limits student results to enrolled course events" do
      mock_session(student, tenant: tenant)

      Current.tenant = tenant
      create(
        :assignment,
        tenant: tenant,
        course: course,
        created_by: teacher,
        title: "Enrolled Assignment",
        status: "published",
        due_at: Time.zone.parse("2026-02-06 10:00:00")
      )
      create(
        :assignment,
        tenant: tenant,
        course: other_course,
        created_by: other_teacher,
        title: "Unenrolled Assignment",
        status: "published",
        due_at: Time.zone.parse("2026-02-07 10:00:00")
      )
      Current.tenant = nil

      get "/api/v1/calendar", params: { start_date: "2026-02-01", end_date: "2026-02-28" }

      expect(response).to have_http_status(:ok)
      titles = response.parsed_body.fetch("events").map { |event| event["title"] }
      expect(titles).to include("Enrolled Assignment")
      expect(titles).not_to include("Unenrolled Assignment")
    end
  end

  describe "GET /api/v1/calendar.ics" do
    it "returns an iCalendar payload" do
      mock_session(teacher, tenant: tenant)

      Current.tenant = tenant
      create(
        :assignment,
        tenant: tenant,
        course: course,
        created_by: teacher,
        title: "Lab Report",
        status: "published",
        due_at: Time.zone.parse("2026-02-12 09:00:00")
      )
      Current.tenant = nil

      get "/api/v1/calendar.ics", params: { start_date: "2026-02-01", end_date: "2026-02-28" }

      expect(response).to have_http_status(:ok)
      expect(response.content_type).to include("text/calendar")
      expect(response.body).to include("BEGIN:VCALENDAR")
      expect(response.body).to include("BEGIN:VEVENT")
      expect(response.body).to include("SUMMARY:Lab Report")
      expect(response.body).to include("END:VCALENDAR")
    end
  end
end
