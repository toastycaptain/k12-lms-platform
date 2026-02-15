require "rails_helper"

RSpec.describe OneRosterClient do
  let(:tenant) { create(:tenant) }
  let(:api_conn) { instance_double(Faraday::Connection) }
  let(:token_conn) { instance_double(Faraday::Connection) }
  let(:cache_store) { ActiveSupport::Cache::MemoryStore.new }
  let(:client) do
    described_class.new(
      base_url: "https://oneroster.example.com",
      client_id: "id",
      client_secret: "secret"
    )
  end

  before do
    Current.tenant = tenant
    allow(Rails).to receive(:cache).and_return(cache_store)
    Rails.cache.clear
    allow(Faraday).to receive(:new).and_return(api_conn, token_conn)
  end

  after do
    Current.tenant = nil
    Current.user = nil
    Rails.cache.clear
  end

  describe "#get_all_orgs" do
    it "returns parsed org records from the API" do
      stub_token(access_token: "tok-orgs")
      request = build_request
      response = faraday_response(success: true, status: 200, body: { "orgs" => [ { "sourcedId" => "org-1" } ] }, headers: {})
      allow(api_conn).to receive(:get).with("/ims/oneroster/v1p1/orgs").and_yield(request).and_return(response)

      result = client.get_all_orgs

      expect(result).to eq([ { "sourcedId" => "org-1" } ])
      expect(request.headers["Authorization"]).to eq("Bearer tok-orgs")
      expect(request.params).to eq({ limit: described_class::DEFAULT_LIMIT, offset: 0 })
    end
  end

  describe "#get_all_users" do
    it "returns parsed user records" do
      stub_token(access_token: "tok-users")
      request = build_request
      response = faraday_response(success: true, status: 200, body: { "users" => [ { "sourcedId" => "user-1" } ] }, headers: {})
      allow(api_conn).to receive(:get).with("/ims/oneroster/v1p1/users").and_yield(request).and_return(response)

      result = client.get_all_users

      expect(result).to eq([ { "sourcedId" => "user-1" } ])
      expect(request.headers["Authorization"]).to eq("Bearer tok-users")
    end
  end

  describe "#get_all_classes" do
    it "returns parsed class records" do
      stub_token(access_token: "tok-classes")
      request = build_request
      response = faraday_response(success: true, status: 200, body: { "classes" => [ { "sourcedId" => "class-1" } ] }, headers: {})
      allow(api_conn).to receive(:get).with("/ims/oneroster/v1p1/classes").and_yield(request).and_return(response)

      result = client.get_all_classes

      expect(result).to eq([ { "sourcedId" => "class-1" } ])
      expect(request.headers["Authorization"]).to eq("Bearer tok-classes")
    end
  end

  describe "#get_all_enrollments" do
    it "returns parsed enrollment records" do
      stub_token(access_token: "tok-enrollments")
      request = build_request
      response = faraday_response(success: true, status: 200, body: { "enrollments" => [ { "sourcedId" => "enroll-1" } ] }, headers: {})
      allow(api_conn).to receive(:get).with("/ims/oneroster/v1p1/enrollments").and_yield(request).and_return(response)

      result = client.get_all_enrollments

      expect(result).to eq([ { "sourcedId" => "enroll-1" } ])
      expect(request.headers["Authorization"]).to eq("Bearer tok-enrollments")
    end
  end

  describe "#get_all_academic_sessions" do
    it "returns parsed academic session records" do
      stub_token(access_token: "tok-sessions")
      request = build_request
      response = faraday_response(success: true, status: 200, body: { "academicSessions" => [ { "sourcedId" => "session-1" } ] }, headers: {})
      allow(api_conn).to receive(:get).with("/ims/oneroster/v1p1/academicSessions").and_yield(request).and_return(response)

      result = client.get_all_academic_sessions

      expect(result).to eq([ { "sourcedId" => "session-1" } ])
      expect(request.headers["Authorization"]).to eq("Bearer tok-sessions")
    end
  end

  describe "#authenticate!" do
    it "posts client credentials and caches the access token" do
      request = build_request
      response = faraday_response(
        success: true,
        status: 200,
        body: { "access_token" => "tok-123", "expires_in" => 3600 },
        headers: {}
      )
      allow(token_conn).to receive(:post).with("/token").and_yield(request).and_return(response)

      token = client.send(:authenticate!)

      expect(token).to eq("tok-123")
      expect(request.body).to eq(
        grant_type: "client_credentials",
        client_id: "id",
        client_secret: "secret"
      )
      expect(Rails.cache.read(client.send(:cache_key))).to eq("tok-123")
    end

    it "raises OneRosterError when auth response is not successful" do
      response = faraday_response(
        success: false,
        status: 401,
        body: { "error" => "invalid_client" },
        headers: {}
      )
      allow(token_conn).to receive(:post).with("/token").and_yield(build_request).and_return(response)

      expect { client.send(:authenticate!) }.to raise_error(described_class::OneRosterError) { |error|
        expect(error.status_code).to eq(401)
        expect(error.response_body).to eq({ "error" => "invalid_client" })
      }
    end
  end

  describe "token caching" do
    it "uses cached token for subsequent requests" do
      stub_token(access_token: "tok-cache")

      requests = []
      allow(api_conn).to receive(:get).with("/ims/oneroster/v1p1/users") do |_, &block|
        request = build_request
        block.call(request)
        requests << request
        faraday_response(success: true, status: 200, body: { "users" => [] }, headers: {})
      end

      client.get_all_users
      client.get_all_users

      expect(token_conn).to have_received(:post).once
      expect(requests.size).to eq(2)
      expect(requests.map { |r| r.headers["Authorization"] }.uniq).to eq([ "Bearer tok-cache" ])
    end
  end

  describe "401 retry behavior" do
    it "re-authenticates and retries once when API returns 401" do
      token_responses = [
        faraday_response(success: true, status: 200, body: { "access_token" => "tok-old", "expires_in" => 3600 }, headers: {}),
        faraday_response(success: true, status: 200, body: { "access_token" => "tok-new", "expires_in" => 3600 }, headers: {})
      ]
      allow(token_conn).to receive(:post).with("/token") do |_, &block|
        block.call(build_request)
        token_responses.shift
      end

      requests = []
      api_responses = [
        faraday_response(success: false, status: 401, body: { "error" => "expired" }, headers: {}),
        faraday_response(success: true, status: 200, body: { "orgs" => [ { "sourcedId" => "org-1" } ] }, headers: {})
      ]

      allow(api_conn).to receive(:get).with("/ims/oneroster/v1p1/orgs") do |_, &block|
        request = build_request
        block.call(request)
        requests << request
        api_responses.shift
      end

      result = client.get_all_orgs

      expect(result).to eq([ { "sourcedId" => "org-1" } ])
      expect(token_conn).to have_received(:post).twice
      expect(requests.size).to eq(2)
      expect(requests.map { |r| r.headers["Authorization"] }).to eq([ "Bearer tok-old", "Bearer tok-new" ])
    end
  end

  describe "pagination" do
    it "continues fetching while batch size equals limit and stops when smaller" do
      stub_token(access_token: "tok-page")

      requests = []
      responses = [
        faraday_response(
          success: true,
          status: 200,
          body: { "classes" => [ { "sourcedId" => "class-1" }, { "sourcedId" => "class-2" } ] },
          headers: {}
        ),
        faraday_response(
          success: true,
          status: 200,
          body: { "classes" => [ { "sourcedId" => "class-3" } ] },
          headers: {}
        )
      ]

      allow(api_conn).to receive(:get).with("/ims/oneroster/v1p1/classes") do |_, &block|
        request = build_request
        block.call(request)
        requests << request
        responses.shift
      end

      result = client.get_all_classes(limit: 2)

      expect(result.map { |row| row["sourcedId"] }).to eq([ "class-1", "class-2", "class-3" ])
      expect(requests.map(&:params)).to eq([
        { limit: 2, offset: 0 },
        { limit: 2, offset: 2 }
      ])
    end
  end

  describe "API errors" do
    it "raises OneRosterError with status and response body on non-success responses" do
      stub_token(access_token: "tok-error")
      response = faraday_response(success: false, status: 500, body: { "error" => "upstream failure" }, headers: {})
      allow(api_conn).to receive(:get).with("/ims/oneroster/v1p1/enrollments").and_yield(build_request).and_return(response)

      expect { client.get_all_enrollments }.to raise_error(described_class::OneRosterError) { |error|
        expect(error.status_code).to eq(500)
        expect(error.response_body).to eq({ "error" => "upstream failure" })
      }
    end
  end

  private

  def faraday_response(success:, status:, body:, headers: {})
    instance_double(Faraday::Response, success?: success, status: status, body: body, headers: headers)
  end

  def build_request
    Struct.new(:headers, :params, :body).new({}, nil, nil)
  end

  def stub_token(access_token:, expires_in: 3600)
    response = faraday_response(
      success: true,
      status: 200,
      body: { "access_token" => access_token, "expires_in" => expires_in },
      headers: {}
    )
    allow(token_conn).to receive(:post).with("/token").and_yield(build_request).and_return(response)
  end
end
