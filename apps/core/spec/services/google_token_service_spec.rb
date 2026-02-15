require "rails_helper"

RSpec.describe GoogleTokenService do
  include ActiveSupport::Testing::TimeHelpers

  let(:tenant) { create(:tenant) }
  let(:user) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant,
      google_access_token: "valid-access-token",
      google_refresh_token: "valid-refresh-token",
      google_token_expires_at: 10.minutes.from_now)
    Current.tenant = nil
    user
  end
  let(:service) { described_class.new(user) }

  after { Current.tenant = nil }

  describe "#valid_token?" do
    it "returns true when the token exists and is not expired" do
      expect(service.valid_token?).to be true
    end

    it "returns false when the token is expired" do
      user.update!(google_token_expires_at: 1.minute.from_now)
      expect(service.valid_token?).to be false
    end

    it "returns false when google_token_expires_at is nil" do
      user.update!(google_token_expires_at: nil)
      expect(service.valid_token?).to be false
    end

    it "returns false when google_access_token is nil" do
      user.update!(google_access_token: nil)
      expect(service.valid_token?).to be false
    end
  end

  describe "#refresh!" do
    it "raises an error when no refresh token is available" do
      user.update!(google_refresh_token: nil)
      expect { service.refresh! }.to raise_error("No refresh token available")
    end

    it "refreshes the token via Google OAuth endpoint" do
      user.update!(google_token_expires_at: 1.minute.ago)
      response_body = {
        "access_token" => "new-access-token",
        "expires_in" => 3600
      }.to_json

      stub_request = instance_double(Net::HTTPOK, body: response_body)
      allow(Net::HTTP).to receive(:post_form).and_return(stub_request)

      freeze_time do
        service.refresh!

        user.reload
        expect(user.google_access_token).to eq("new-access-token")
        expect(user.google_token_expires_at).to be_within(1.second).of(Time.current + 3600.seconds)
      end
    end

    it "raises an error when the refresh response contains an error" do
      user.update!(google_token_expires_at: 1.minute.ago)
      response_body = { "error" => "invalid_grant" }.to_json
      stub_request = instance_double(Net::HTTPOK, body: response_body)
      allow(Net::HTTP).to receive(:post_form).and_return(stub_request)

      expect { service.refresh! }.to raise_error("Token refresh failed: invalid_grant")
    end
  end

  describe "#access_token" do
    it "returns the current token when valid" do
      expect(service.access_token).to eq("valid-access-token")
    end

    it "refreshes and returns new token when expired" do
      user.update!(google_token_expires_at: 1.minute.ago)

      response_body = {
        "access_token" => "refreshed-token",
        "expires_in" => 3600
      }.to_json

      stub_request = instance_double(Net::HTTPOK, body: response_body)
      allow(Net::HTTP).to receive(:post_form).and_return(stub_request)

      expect(service.access_token).to eq("refreshed-token")
    end
  end
end
