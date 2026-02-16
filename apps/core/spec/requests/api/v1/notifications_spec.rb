require "rails_helper"

RSpec.describe "Api::V1::Notifications", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:user) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:teacher)
    Current.tenant = nil
    u
  end
  let(:other_user) do
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

  describe "GET /api/v1/notifications" do
    it "returns only current user notifications" do
      mock_session(user, tenant: tenant)
      Current.tenant = tenant
      create(:notification, tenant: tenant, user: user, title: "Mine")
      create(:notification, tenant: tenant, user: other_user, title: "Other")
      Current.tenant = nil

      get "/api/v1/notifications"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
      expect(response.parsed_body.first["title"]).to eq("Mine")
    end

    it "supports pagination params" do
      mock_session(user, tenant: tenant)
      Current.tenant = tenant
      create_list(:notification, 3, tenant: tenant, user: user)
      Current.tenant = nil

      get "/api/v1/notifications", params: { page: 2, per_page: 1 }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end

    it "supports unread_only filter" do
      mock_session(user, tenant: tenant)
      Current.tenant = tenant
      create(:notification, tenant: tenant, user: user, read_at: nil)
      create(:notification, tenant: tenant, user: user, read_at: Time.current)
      Current.tenant = nil

      get "/api/v1/notifications", params: { unread_only: true }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
      expect(response.parsed_body.first["read_at"]).to be_nil
    end
  end

  describe "GET /api/v1/notifications/unread_count" do
    it "returns unread count for current user" do
      mock_session(user, tenant: tenant)
      Current.tenant = tenant
      create(:notification, tenant: tenant, user: user, read_at: nil)
      create(:notification, tenant: tenant, user: user, read_at: nil)
      create(:notification, tenant: tenant, user: user, read_at: Time.current)
      create(:notification, tenant: tenant, user: other_user, read_at: nil)
      Current.tenant = nil

      get "/api/v1/notifications/unread_count"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["count"]).to eq(2)
    end
  end

  describe "PATCH /api/v1/notifications/:id/read" do
    it "marks the notification as read" do
      mock_session(user, tenant: tenant)
      Current.tenant = tenant
      notification = create(:notification, tenant: tenant, user: user, read_at: nil)
      Current.tenant = nil

      patch "/api/v1/notifications/#{notification.id}/read"
      expect(response).to have_http_status(:ok)
      expect(notification.reload.read_at).to be_present
    end

    it "returns forbidden for other users' notifications" do
      mock_session(user, tenant: tenant)
      Current.tenant = tenant
      notification = create(:notification, tenant: tenant, user: other_user, read_at: nil)
      Current.tenant = nil

      patch "/api/v1/notifications/#{notification.id}/read"
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/notifications/mark_all_read" do
    it "marks all current user unread notifications as read" do
      mock_session(user, tenant: tenant)
      Current.tenant = tenant
      create(:notification, tenant: tenant, user: user, read_at: nil)
      create(:notification, tenant: tenant, user: user, read_at: nil)
      create(:notification, tenant: tenant, user: other_user, read_at: nil)
      Current.tenant = nil

      post "/api/v1/notifications/mark_all_read"
      expect(response).to have_http_status(:ok)
      expect(Notification.where(user: user, read_at: nil)).to be_empty
      expect(Notification.where(user: other_user, read_at: nil).count).to eq(1)
    end
  end
end
