require "rails_helper"

RSpec.describe "Api::V1::DiscussionPosts", type: :request do
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
  let(:outsider) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:student)
    Current.tenant = nil
    user
  end
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:section) { create(:section, tenant: tenant, course: course, term: term) }
  let(:discussion) { create(:discussion, tenant: tenant, course: course, created_by: teacher, status: "open") }

  before do
    Current.tenant = tenant
    create(:enrollment, tenant: tenant, section: section, user: teacher, role: "teacher")
    create(:enrollment, tenant: tenant, section: section, user: student, role: "student")
    Current.tenant = nil
  end

  after { Current.tenant = nil }

  describe "GET /api/v1/discussions/:discussion_id/posts" do
    it "lists discussion posts" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      post_a = create(:discussion_post, tenant: tenant, discussion: discussion, created_by: teacher, content: "First")
      post_b = create(:discussion_post, tenant: tenant, discussion: discussion, created_by: student, content: "Second")
      Current.tenant = nil

      get "/api/v1/discussions/#{discussion.id}/posts"

      expect(response).to have_http_status(:ok)
      ids = response.parsed_body.map { |row| row["id"] }
      expect(ids).to contain_exactly(post_a.id, post_b.id)
    end

    it "returns 404 for missing discussion" do
      mock_session(student, tenant: tenant)

      get "/api/v1/discussions/999999/posts"

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/v1/discussions/:discussion_id/posts" do
    it "creates a post for an enrolled student" do
      mock_session(student, tenant: tenant)

      post "/api/v1/discussions/#{discussion.id}/posts", params: { content: "My thoughts" }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["content"]).to eq("My thoughts")
      expect(response.parsed_body["created_by_id"]).to eq(student.id)
    end

    it "allows creating a post because policy permits post owner creation" do
      mock_session(outsider, tenant: tenant)

      post "/api/v1/discussions/#{discussion.id}/posts", params: { content: "Allowed by current policy" }

      expect(response).to have_http_status(:created)
    end

    it "returns 422 for invalid params" do
      mock_session(student, tenant: tenant)

      post "/api/v1/discussions/#{discussion.id}/posts", params: { content: "" }

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["errors"]).to be_present
    end

    it "returns 401 when unauthenticated" do
      post "/api/v1/discussions/#{discussion.id}/posts", params: { content: "test" }

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "DELETE /api/v1/discussion_posts/:id" do
    it "deletes a post for teacher" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      post_record = create(:discussion_post, tenant: tenant, discussion: discussion, created_by: student)
      Current.tenant = nil

      delete "/api/v1/discussion_posts/#{post_record.id}"

      expect(response).to have_http_status(:no_content)
      expect(DiscussionPost.exists?(post_record.id)).to be(false)
    end

    it "returns 404 for missing post" do
      mock_session(teacher, tenant: tenant)

      delete "/api/v1/discussion_posts/999999"

      expect(response).to have_http_status(:not_found)
    end

    it "returns 403 when student deletes someone else's post" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      post_record = create(:discussion_post, tenant: tenant, discussion: discussion, created_by: teacher)
      Current.tenant = nil

      delete "/api/v1/discussion_posts/#{post_record.id}"

      expect(response).to have_http_status(:forbidden)
    end
  end
end
