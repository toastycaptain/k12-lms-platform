require "rails_helper"

RSpec.describe OneRosterClient do
  describe "SSRF prevention" do
    before do
      allow(Resolv).to receive(:getaddresses).with("oneroster.example.com").and_return([ "151.101.2.132" ])
      allow(Resolv).to receive(:getaddresses).with("dns-rebind.example.com").and_return([ "10.0.0.1" ])
    end

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
        described_class.new(base_url: "https://oneroster.example.com/ims/oneroster/v1p1", client_id: "id", client_secret: "secret")
      }.not_to raise_error
    end

    it "rejects hostnames that resolve to private IP ranges" do
      expect {
        described_class.new(base_url: "https://dns-rebind.example.com/ims", client_id: "id", client_secret: "secret")
      }.to raise_error(ArgumentError, /private or internal/)
    end
  end
end
