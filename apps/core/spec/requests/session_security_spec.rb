require "rails_helper"

RSpec.describe "Session Security", type: :request do
  describe "cookie configuration" do
    it "configures session cookie with security flags" do
      session_store = Rails.application.config.middleware.detect { |m| m.name == "ActionDispatch::Session::CookieStore" }
      expect(session_store).to be_present

      args = session_store.args.first || {}
      expect(args[:httponly]).to eq(true)
      expect(args[:same_site]).to eq(:lax)
      expect(args[:expire_after]).to eq(12.hours)
    end
  end

  describe "security headers" do
    let!(:tenant) { create(:tenant) }
    let(:user) do
      Current.tenant = tenant
      u = create(:user, tenant: tenant)
      u.add_role(:admin)
      Current.tenant = nil
      u
    end

    before { mock_session(user, tenant: tenant) }
    after { Current.tenant = nil }

    it "includes X-Frame-Options header" do
      get "/api/v1/users"
      expect(response.headers["X-Frame-Options"]).to eq("SAMEORIGIN")
    end

    it "includes X-Content-Type-Options header" do
      get "/api/v1/users"
      expect(response.headers["X-Content-Type-Options"]).to eq("nosniff")
    end
  end

  describe "SSL configuration" do
    it "force_ssl is enabled in production config" do
      production_config = File.read(Rails.root.join("config/environments/production.rb"))
      expect(production_config).to match(/^\s*config\.force_ssl = true/)
    end
  end
end
