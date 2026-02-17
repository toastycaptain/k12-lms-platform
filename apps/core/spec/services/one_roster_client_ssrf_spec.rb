require "rails_helper"

RSpec.describe OneRosterClient do
  describe "SSRF prevention" do
    it "rejects localhost base_url" do
      expect {
        described_class.new(base_url: "http://localhost:6379", client_id: "id", client_secret: "secret")
      }.to raise_error(ArgumentError, /internal/)
    end

    it "rejects 169.254.169.254 (cloud metadata)" do
      expect {
        described_class.new(base_url: "http://169.254.169.254/latest", client_id: "id", client_secret: "secret")
      }.to raise_error(ArgumentError, /internal/)
    end

    it "rejects private IP ranges" do
      expect {
        described_class.new(base_url: "http://10.0.0.5/api", client_id: "id", client_secret: "secret")
      }.to raise_error(ArgumentError, /private/)
    end

    it "allows external URLs" do
      expect {
        described_class.new(base_url: "https://oneroster.example.com/ims", client_id: "id", client_secret: "secret")
      }.not_to raise_error
    end
  end
end
