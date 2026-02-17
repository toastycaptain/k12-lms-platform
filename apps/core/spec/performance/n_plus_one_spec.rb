require "rails_helper"

RSpec.describe "N+1 performance smoke tests", type: :request do
  let(:tenant) { create(:tenant) }
  let(:teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    Current.tenant = nil
    user
  end

  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }

  after do
    Current.tenant = nil
    Current.user = nil
  end

  def count_sql_queries
    count = 0
    callback = lambda do |_name, _start, _finish, _id, payload|
      sql = payload[:sql].to_s
      next if payload[:cached]
      next if sql.start_with?("BEGIN", "COMMIT", "ROLLBACK", "SAVEPOINT", "RELEASE SAVEPOINT")
      next if sql.include?("sqlite_master") || sql.include?("pg_catalog")

      count += 1
    end

    ActiveSupport::Notifications.subscribed(callback, "sql.active_record") do
      yield
    end

    count
  end

  it "keeps courses index query count bounded" do
    mock_session(teacher, tenant: tenant)
    Current.tenant = tenant

    3.times do |idx|
      course = create(:course, tenant: tenant, academic_year: academic_year, name: "Course #{idx}")
      section = create(:section, tenant: tenant, course: course, term: term)
      create(:enrollment, tenant: tenant, section: section, user: teacher, role: "teacher")
    end

    Current.tenant = nil

    query_count = count_sql_queries do
      get "/api/v1/courses"
      expect(response).to have_http_status(:ok)
    end

    expect(query_count).to be <= 12
  end

  it "keeps assignment index query count bounded" do
    mock_session(teacher, tenant: tenant)
    Current.tenant = tenant

    course = create(:course, tenant: tenant, academic_year: academic_year)
    section = create(:section, tenant: tenant, course: course, term: term)
    create(:enrollment, tenant: tenant, section: section, user: teacher, role: "teacher")

    5.times do |idx|
      assignment = create(:assignment, tenant: tenant, course: course, created_by: teacher, title: "A#{idx}")
      create(:submission, tenant: tenant, assignment: assignment, user: teacher)
    end

    Current.tenant = nil

    query_count = count_sql_queries do
      get "/api/v1/courses/#{course.id}/assignments"
      expect(response).to have_http_status(:ok)
    end

    expect(query_count).to be <= 22
  end
end
