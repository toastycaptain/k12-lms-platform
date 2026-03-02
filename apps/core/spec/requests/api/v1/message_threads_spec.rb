require "rails_helper"

RSpec.describe "Api::V1::MessageThreads", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:user) { create(:user, tenant: tenant) }
  let(:other_user) { create(:user, tenant: tenant) }
  let(:third_user) { create(:user, tenant: tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:section) { create(:section, tenant: tenant, course: course) }

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/message_threads" do
    it "returns only threads current user participates in" do
      mock_session(user, tenant: tenant)
      Current.tenant = tenant
      included_thread = create(:message_thread, tenant: tenant, course: course, subject: "Included")
      excluded_thread = create(:message_thread, tenant: tenant, course: course, subject: "Excluded")
      create(:message_thread_participant, tenant: tenant, message_thread: included_thread, user: user)
      create(:message_thread_participant, tenant: tenant, message_thread: included_thread, user: other_user)
      create(:message_thread_participant, tenant: tenant, message_thread: excluded_thread, user: other_user)
      Current.tenant = nil

      get "/api/v1/message_threads"

      expect(response).to have_http_status(:ok)
      subjects = response.parsed_body.map { |row| row["subject"] }
      expect(subjects).to include("Included")
      expect(subjects).not_to include("Excluded")
    end
  end

  describe "GET /api/v1/message_threads (pagination)" do
    it "supports pagination params" do
      mock_session(user, tenant: tenant)
      Current.tenant = tenant
      3.times do
        thread = create(:message_thread, tenant: tenant, course: course)
        create(:message_thread_participant, tenant: tenant, message_thread: thread, user: user)
      end
      Current.tenant = nil

      get "/api/v1/message_threads", params: { page: 2, per_page: 1 }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end
  end

  describe "GET /api/v1/message_threads/:id" do
    it "returns thread with participants and messages for participants" do
      mock_session(user, tenant: tenant)
      Current.tenant = tenant
      thread = create(:message_thread, tenant: tenant, course: course)
      create(:message_thread_participant, tenant: tenant, message_thread: thread, user: user)
      create(:message_thread_participant, tenant: tenant, message_thread: thread, user: other_user)
      create(:message, tenant: tenant, message_thread: thread, sender: other_user, body: "Hello there")
      Current.tenant = nil

      get "/api/v1/message_threads/#{thread.id}"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["participants"].length).to eq(2)
      expect(response.parsed_body["messages"].length).to eq(1)
      expect(response.parsed_body["messages"].first["body"]).to eq("Hello there")
    end

    it "returns forbidden for non-participants" do
      mock_session(user, tenant: tenant)
      Current.tenant = tenant
      thread = create(:message_thread, tenant: tenant, course: course)
      create(:message_thread_participant, tenant: tenant, message_thread: thread, user: other_user)
      Current.tenant = nil

      get "/api/v1/message_threads/#{thread.id}"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/message_threads" do
    it "creates thread and includes creator as participant" do
      mock_session(user, tenant: tenant)
      Current.tenant = tenant
      create(:enrollment, tenant: tenant, section: section, user: user, role: "student")
      create(:enrollment, tenant: tenant, section: section, user: other_user, role: "teacher")
      Current.tenant = nil

      post "/api/v1/message_threads", params: {
        subject: "Parent follow-up",
        thread_type: "direct",
        participant_ids: [ other_user.id ],
        course_id: course.id
      }

      expect(response).to have_http_status(:created)
      created_id = response.parsed_body["id"]
      Current.tenant = tenant
      thread = MessageThread.find(created_id)
      participant_ids = thread.message_thread_participants.pluck(:user_id)
      Current.tenant = nil

      expect(participant_ids).to include(user.id, other_user.id)
    end

    it "returns forbidden when course_id is not visible to current user" do
      mock_session(user, tenant: tenant)

      post "/api/v1/message_threads", params: {
        subject: "Out of scope course",
        thread_type: "direct",
        participant_ids: [ other_user.id ],
        course_id: course.id
      }

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "guardian restrictions on create" do
    let(:guardian) { create(:user, tenant: tenant) }
    let(:linked_student) { create(:user, tenant: tenant) }
    let(:teacher) { create(:user, tenant: tenant) }
    let(:unrelated_user) { create(:user, tenant: tenant) }
    let(:other_course) { create(:course, tenant: tenant, academic_year: academic_year) }
    let(:other_section) { create(:section, tenant: tenant, course: other_course) }

    before do
      Current.tenant = tenant
      guardian.add_role(:guardian)
      create(:guardian_link, tenant: tenant, guardian: guardian, student: linked_student, status: "active")
      create(:enrollment, tenant: tenant, section: section, user: linked_student, role: "student")
      create(:enrollment, tenant: tenant, section: section, user: teacher, role: "teacher")
      create(:enrollment, tenant: tenant, section: other_section, user: unrelated_user, role: "teacher")
      Current.tenant = nil
    end

    it "allows guardian to message linked-student teachers" do
      mock_session(guardian, tenant: tenant)

      post "/api/v1/message_threads", params: {
        subject: "Family check-in",
        thread_type: "direct",
        participant_ids: [ teacher.id ],
        course_id: course.id
      }

      expect(response).to have_http_status(:created)
    end

    it "forbids guardian from messaging arbitrary tenant users" do
      mock_session(guardian, tenant: tenant)

      post "/api/v1/message_threads", params: {
        subject: "Off graph",
        thread_type: "direct",
        participant_ids: [ unrelated_user.id ]
      }

      expect(response).to have_http_status(:forbidden)
    end

    it "forbids guardian from attaching unrelated courses" do
      mock_session(guardian, tenant: tenant)

      post "/api/v1/message_threads", params: {
        subject: "Wrong course",
        thread_type: "direct",
        participant_ids: [ teacher.id ],
        course_id: other_course.id
      }

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "DELETE /api/v1/message_threads/:id" do
    it "removes only current user participation" do
      mock_session(user, tenant: tenant)
      Current.tenant = tenant
      thread = create(:message_thread, tenant: tenant, course: course)
      create(:message_thread_participant, tenant: tenant, message_thread: thread, user: user)
      create(:message_thread_participant, tenant: tenant, message_thread: thread, user: other_user)
      Current.tenant = nil

      delete "/api/v1/message_threads/#{thread.id}"

      expect(response).to have_http_status(:no_content)
      Current.tenant = tenant
      expect(MessageThreadParticipant.where(message_thread: thread, user: user)).to be_empty
      expect(MessageThreadParticipant.where(message_thread: thread, user: other_user).count).to eq(1)
      Current.tenant = nil
    end
  end
end
