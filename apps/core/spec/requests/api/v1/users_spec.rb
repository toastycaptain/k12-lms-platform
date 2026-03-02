require "rails_helper"

RSpec.describe "Api::V1::Users", type: :request do
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

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "admin lifecycle" do
    it "lists, creates with roles, updates, and destroys users" do
      mock_session(admin, tenant: tenant)
      existing = create(:user, tenant: tenant)

      get "/api/v1/users"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.map { |u| u["id"] }).to include(existing.id)

      post "/api/v1/users", params: {
        user: {
          email: "new-user@example.com",
          first_name: "New",
          last_name: "User",
          roles: [ "teacher" ]
        }
      }
      expect(response).to have_http_status(:created)
      created = User.find(response.parsed_body["id"])
      expect(created.has_role?(:teacher)).to eq(true)

      patch "/api/v1/users/#{created.id}", params: { user: { first_name: "Updated" } }
      expect(response).to have_http_status(:ok)

      delete "/api/v1/users/#{created.id}"
      expect(response).to have_http_status(:no_content)
    end
  end

  describe "non-admin restrictions" do
    it "forbids teacher on mutation actions" do
      mock_session(teacher, tenant: tenant)
      target = create(:user, tenant: tenant)

      post "/api/v1/users", params: { user: { email: "x@example.com", first_name: "X", last_name: "Y" } }
      expect(response).to have_http_status(:forbidden)

      patch "/api/v1/users/#{target.id}", params: { user: { first_name: "Nope" } }
      expect(response).to have_http_status(:forbidden)

      delete "/api/v1/users/#{target.id}"
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/v1/users?q=..." do
    it "returns empty results for very short search query" do
      mock_session(teacher, tenant: tenant)
      create(:user, tenant: tenant, first_name: "Alice", last_name: "Smith")

      get "/api/v1/users", params: { q: "zzzzqqqq" }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to be_empty
    end

    it "handles special characters in search safely" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/users", params: { q: "'; DROP TABLE users;--" }
      expect(response).to have_http_status(:ok)
    end

    it "allows recipient search for authenticated users" do
      mock_session(teacher, tenant: tenant)
      create(:user, tenant: tenant, first_name: "Alice", last_name: "Smith", email: "alice@example.com")
      create(:user, tenant: tenant, first_name: "Bob", last_name: "Jones", email: "bob@example.com")

      get "/api/v1/users", params: { q: "ali" }

      expect(response).to have_http_status(:ok)
      emails = response.parsed_body.map { |row| row["email"] }
      expect(emails).to include("alice@example.com")
      expect(emails).not_to include("bob@example.com")
    end

    it "restricts guardian search results to linked-student communication graph" do
      guardian = create(:user, tenant: tenant, first_name: "Paula", last_name: "Parent")
      linked_student = create(:user, tenant: tenant, first_name: "Lina", last_name: "Student")
      linked_teacher = create(:user, tenant: tenant, first_name: "Taylor", last_name: "Teacher")
      unrelated_user = create(:user, tenant: tenant, first_name: "Una", last_name: "Unrelated")
      academic_year = create(:academic_year, tenant: tenant)
      section = create(:section, tenant: tenant, course: create(:course, tenant: tenant, academic_year: academic_year))

      Current.tenant = tenant
      guardian.add_role(:guardian)
      create(:guardian_link, tenant: tenant, guardian: guardian, student: linked_student, status: "active")
      create(:enrollment, tenant: tenant, section: section, user: linked_student, role: "student")
      create(:enrollment, tenant: tenant, section: section, user: linked_teacher, role: "teacher")
      Current.tenant = nil

      mock_session(guardian, tenant: tenant)

      get "/api/v1/users", params: { q: "a" }

      expect(response).to have_http_status(:ok)
      ids = response.parsed_body.map { |row| row["id"] }
      expect(ids).to include(guardian.id, linked_student.id, linked_teacher.id)
      expect(ids).not_to include(unrelated_user.id)
    end
  end
end
