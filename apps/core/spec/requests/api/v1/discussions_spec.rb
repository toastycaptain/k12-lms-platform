require "rails_helper"

RSpec.describe "Api::V1::Discussions", type: :request do
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
  let(:other_teacher) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:teacher)
    Current.tenant = nil
    u
  end
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:section) { create(:section, tenant: tenant, course: course, term: term) }

  after { Current.tenant = nil }

  describe "GET /api/v1/courses/:course_id/discussions" do
    it "lists discussions" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:discussion, tenant: tenant, course: course, created_by: teacher)
      Current.tenant = nil

      get "/api/v1/courses/#{course.id}/discussions"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end

    it "does not expose discussions in courses the teacher does not own or teach" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:discussion, tenant: tenant, course: course, created_by: other_teacher, title: "Restricted Discussion")
      Current.tenant = nil

      get "/api/v1/courses/#{course.id}/discussions"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to be_empty
    end
  end

  describe "POST /api/v1/courses/:course_id/discussions" do
    it "creates a discussion" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:enrollment, tenant: tenant, user: teacher, section: section, role: "teacher")
      Current.tenant = nil

      post "/api/v1/courses/#{course.id}/discussions", params: { title: "Week 1 Discussion", description: "Discuss the reading" }
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["title"]).to eq("Week 1 Discussion")
    end

    it "returns 403 for students" do
      mock_session(student, tenant: tenant)

      post "/api/v1/courses/#{course.id}/discussions", params: { title: "Test" }
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "PATCH /api/v1/discussions/:id" do
    let(:discussion) do
      Current.tenant = tenant
      d = create(:discussion, tenant: tenant, course: course, created_by: teacher)
      Current.tenant = nil
      d
    end

    it "updates a discussion" do
      mock_session(teacher, tenant: tenant)

      patch "/api/v1/discussions/#{discussion.id}", params: { status: "locked" }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("locked")
    end
  end

  describe "discussion posts" do
    let(:discussion) do
      Current.tenant = tenant
      d = create(:discussion, tenant: tenant, course: course, created_by: teacher, status: "open")
      Current.tenant = nil
      d
    end

    it "creates and lists posts" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      create(:enrollment, tenant: tenant, section: section, user: student, role: "student")
      Current.tenant = nil

      post "/api/v1/discussions/#{discussion.id}/posts", params: { content: "My thoughts on the reading" }
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["content"]).to eq("My thoughts on the reading")

      get "/api/v1/discussions/#{discussion.id}/posts"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end

    it "creates threaded replies" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      create(:enrollment, tenant: tenant, section: section, user: student, role: "student")
      Current.tenant = nil

      post "/api/v1/discussions/#{discussion.id}/posts", params: { content: "Original post" }
      parent_id = response.parsed_body["id"]

      post "/api/v1/discussions/#{discussion.id}/posts", params: { content: "Reply", parent_post_id: parent_id }
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["parent_post_id"]).to eq(parent_id)
    end

    it "blocks posting to locked discussions" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      create(:enrollment, tenant: tenant, section: section, user: student, role: "student")
      Current.tenant = nil
      Current.tenant = tenant
      discussion.update!(status: "locked")
      Current.tenant = nil

      post "/api/v1/discussions/#{discussion.id}/posts", params: { content: "This should fail" }
      expect(response).to have_http_status(:unprocessable_content)
    end

    it "deletes a post" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      dp = create(:discussion_post, tenant: tenant, discussion: discussion, created_by: teacher)
      Current.tenant = nil

      delete "/api/v1/discussion_posts/#{dp.id}"
      expect(response).to have_http_status(:no_content)
    end
  end
end
