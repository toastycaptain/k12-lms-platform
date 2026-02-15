require "rails_helper"

RSpec.describe "Api::V1::Messages", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:user) { create(:user, tenant: tenant) }
  let(:other_user) { create(:user, tenant: tenant) }
  let(:outsider) { create(:user, tenant: tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }

  let(:thread) do
    Current.tenant = tenant
    created_thread = create(:message_thread, tenant: tenant, course: course)
    create(:message_thread_participant, tenant: tenant, message_thread: created_thread, user: user, last_read_at: 5.minutes.ago)
    create(:message_thread_participant, tenant: tenant, message_thread: created_thread, user: other_user, last_read_at: nil)
    Current.tenant = nil
    created_thread
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/message_threads/:thread_id/messages" do
    it "lists messages in chronological order and marks thread read" do
      mock_session(user, tenant: tenant)
      Current.tenant = tenant
      create(:message, tenant: tenant, message_thread: thread, sender: other_user, body: "First", created_at: 2.minutes.ago)
      create(:message, tenant: tenant, message_thread: thread, sender: other_user, body: "Second", created_at: 1.minute.ago)
      participant = MessageThreadParticipant.find_by!(message_thread: thread, user: user)
      participant.update!(last_read_at: 10.minutes.ago)
      Current.tenant = nil

      get "/api/v1/message_threads/#{thread.id}/messages"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.map { |row| row["body"] }).to eq([ "First", "Second" ])
      Current.tenant = tenant
      expect(participant.reload.last_read_at).to be_within(5.seconds).of(Time.current)
      Current.tenant = nil
    end

    it "returns forbidden for non-participants" do
      mock_session(outsider, tenant: tenant)

      get "/api/v1/message_threads/#{thread.id}/messages"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/message_threads/:thread_id/messages" do
    it "creates a message and notifies other participants" do
      mock_session(user, tenant: tenant)

      expect {
        post "/api/v1/message_threads/#{thread.id}/messages", params: { body: "Weekly update" }
      }.to change(Message, :count).by(1)
        .and change { Notification.where(user: other_user).count }.by(1)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["body"]).to eq("Weekly update")
      expect(response.parsed_body["sender_id"]).to eq(user.id)
    end

    it "returns forbidden for non-participants" do
      mock_session(outsider, tenant: tenant)

      post "/api/v1/message_threads/#{thread.id}/messages", params: { body: "No access" }

      expect(response).to have_http_status(:forbidden)
    end
  end
end
