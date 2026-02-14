require "rails_helper"
require "webmock/rspec"

RSpec.describe OneRosterClient do
  let(:base_url) { "https://oneroster.example.com" }
  let(:client_id) { "test_client_id" }
  let(:client_secret) { "test_client_secret" }
  let(:client) { described_class.new(base_url: base_url, client_id: client_id, client_secret: client_secret) }
  let(:memory_store) { ActiveSupport::Cache::MemoryStore.new }

  before do
    allow(Rails).to receive(:cache).and_return(memory_store)
  end

  describe "#authenticate!" do
    it "obtains an access token via client_credentials grant" do
      stub_request(:post, "#{base_url}/token")
        .with(body: { grant_type: "client_credentials", client_id: client_id, client_secret: client_secret })
        .to_return(
          status: 200,
          body: { access_token: "abc123", token_type: "bearer", expires_in: 3600 }.to_json,
          headers: { "Content-Type" => "application/json" }
        )

      token = client.authenticate!
      expect(token).to eq("abc123")
    end

    it "caches the access token" do
      stub_request(:post, "#{base_url}/token")
        .to_return(
          status: 200,
          body: { access_token: "abc123", token_type: "bearer", expires_in: 3600 }.to_json,
          headers: { "Content-Type" => "application/json" }
        )

      client.authenticate!
      cached = memory_store.read("one_roster_token/#{client_id}")
      expect(cached).to eq("abc123")
    end

    it "raises OneRosterError on auth failure" do
      stub_request(:post, "#{base_url}/token")
        .to_return(
          status: 401,
          body: { error: "invalid_client" }.to_json,
          headers: { "Content-Type" => "application/json" }
        )

      expect { client.authenticate! }.to raise_error(OneRosterError, /Authentication failed/)
    end
  end

  describe "#get_all_orgs" do
    before do
      stub_request(:post, "#{base_url}/token")
        .to_return(
          status: 200,
          body: { access_token: "abc123", expires_in: 3600 }.to_json,
          headers: { "Content-Type" => "application/json" }
        )
    end

    it "returns all orgs" do
      stub_request(:get, "#{base_url}/ims/oneroster/v1p1/orgs")
        .with(query: { limit: 100, offset: 0 })
        .to_return(
          status: 200,
          body: { orgs: [ { sourcedId: "org-1", name: "Test School" } ] }.to_json,
          headers: { "Content-Type" => "application/json" }
        )

      orgs = client.get_all_orgs
      expect(orgs.length).to eq(1)
      expect(orgs.first["name"]).to eq("Test School")
    end

    it "supports filter parameter" do
      stub_request(:get, "#{base_url}/ims/oneroster/v1p1/orgs")
        .with(query: { limit: 100, offset: 0, filter: "type='school'" })
        .to_return(
          status: 200,
          body: { orgs: [ { sourcedId: "org-1", name: "School" } ] }.to_json,
          headers: { "Content-Type" => "application/json" }
        )

      orgs = client.get_all_orgs(filter: "type='school'")
      expect(orgs.length).to eq(1)
    end
  end

  describe "#get_all_users" do
    before do
      stub_request(:post, "#{base_url}/token")
        .to_return(
          status: 200,
          body: { access_token: "abc123", expires_in: 3600 }.to_json,
          headers: { "Content-Type" => "application/json" }
        )
    end

    it "returns all users" do
      stub_request(:get, "#{base_url}/ims/oneroster/v1p1/users")
        .with(query: { limit: 100, offset: 0 })
        .to_return(
          status: 200,
          body: { users: [ { sourcedId: "u-1", givenName: "John" } ] }.to_json,
          headers: { "Content-Type" => "application/json" }
        )

      users = client.get_all_users
      expect(users.length).to eq(1)
      expect(users.first["givenName"]).to eq("John")
    end
  end

  describe "#get_all_classes" do
    before do
      stub_request(:post, "#{base_url}/token")
        .to_return(
          status: 200,
          body: { access_token: "abc123", expires_in: 3600 }.to_json,
          headers: { "Content-Type" => "application/json" }
        )
    end

    it "returns all classes" do
      stub_request(:get, "#{base_url}/ims/oneroster/v1p1/classes")
        .with(query: { limit: 100, offset: 0 })
        .to_return(
          status: 200,
          body: { classes: [ { sourcedId: "c-1", title: "Math 101" } ] }.to_json,
          headers: { "Content-Type" => "application/json" }
        )

      classes = client.get_all_classes
      expect(classes.length).to eq(1)
      expect(classes.first["title"]).to eq("Math 101")
    end
  end

  describe "#get_all_enrollments" do
    before do
      stub_request(:post, "#{base_url}/token")
        .to_return(
          status: 200,
          body: { access_token: "abc123", expires_in: 3600 }.to_json,
          headers: { "Content-Type" => "application/json" }
        )
    end

    it "returns all enrollments" do
      stub_request(:get, "#{base_url}/ims/oneroster/v1p1/enrollments")
        .with(query: { limit: 100, offset: 0 })
        .to_return(
          status: 200,
          body: { enrollments: [ { sourcedId: "e-1", role: "student" } ] }.to_json,
          headers: { "Content-Type" => "application/json" }
        )

      enrollments = client.get_all_enrollments
      expect(enrollments.length).to eq(1)
      expect(enrollments.first["role"]).to eq("student")
    end
  end

  describe "#get_all_academic_sessions" do
    before do
      stub_request(:post, "#{base_url}/token")
        .to_return(
          status: 200,
          body: { access_token: "abc123", expires_in: 3600 }.to_json,
          headers: { "Content-Type" => "application/json" }
        )
    end

    it "returns all academic sessions" do
      stub_request(:get, "#{base_url}/ims/oneroster/v1p1/academicSessions")
        .with(query: { limit: 100, offset: 0 })
        .to_return(
          status: 200,
          body: { academicSessions: [ { sourcedId: "as-1", title: "Fall 2026" } ] }.to_json,
          headers: { "Content-Type" => "application/json" }
        )

      sessions = client.get_all_academic_sessions
      expect(sessions.length).to eq(1)
      expect(sessions.first["title"]).to eq("Fall 2026")
    end
  end

  describe "pagination via Link headers" do
    before do
      stub_request(:post, "#{base_url}/token")
        .to_return(
          status: 200,
          body: { access_token: "abc123", expires_in: 3600 }.to_json,
          headers: { "Content-Type" => "application/json" }
        )
    end

    it "follows next page links" do
      stub_request(:get, "#{base_url}/ims/oneroster/v1p1/orgs")
        .with(query: { limit: 1, offset: 0 })
        .to_return(
          status: 200,
          body: { orgs: [ { sourcedId: "org-1", name: "School 1" } ] }.to_json,
          headers: {
            "Content-Type" => "application/json",
            "Link" => "<#{base_url}/ims/oneroster/v1p1/orgs?limit=1&offset=1>; rel=\"next\""
          }
        )

      stub_request(:get, "#{base_url}/ims/oneroster/v1p1/orgs")
        .with(query: { limit: 1, offset: 1 })
        .to_return(
          status: 200,
          body: { orgs: [ { sourcedId: "org-2", name: "School 2" } ] }.to_json,
          headers: { "Content-Type" => "application/json" }
        )

      orgs = client.get_all_orgs(limit: 1)
      expect(orgs.length).to eq(2)
      expect(orgs.map { |o| o["name"] }).to eq([ "School 1", "School 2" ])
    end
  end

  describe "error handling" do
    before do
      stub_request(:post, "#{base_url}/token")
        .to_return(
          status: 200,
          body: { access_token: "abc123", expires_in: 3600 }.to_json,
          headers: { "Content-Type" => "application/json" }
        )
    end

    it "raises OneRosterError on API errors" do
      stub_request(:get, "#{base_url}/ims/oneroster/v1p1/orgs")
        .with(query: { limit: 100, offset: 0 })
        .to_return(
          status: 500,
          body: { error: "Internal Server Error" }.to_json,
          headers: { "Content-Type" => "application/json" }
        )

      expect { client.get_all_orgs }.to raise_error(OneRosterError) { |e|
        expect(e.status_code).to eq(500)
      }
    end
  end

  describe "token refresh on 401" do
    it "retries once after refreshing the token" do
      token_stub = stub_request(:post, "#{base_url}/token")
        .to_return(
          status: 200,
          body: { access_token: "new_token", expires_in: 3600 }.to_json,
          headers: { "Content-Type" => "application/json" }
        )

      call_count = 0
      stub_request(:get, "#{base_url}/ims/oneroster/v1p1/orgs")
        .with(query: { limit: 100, offset: 0 })
        .to_return do |_request|
          call_count += 1
          if call_count == 1
            { status: 401, body: { error: "Unauthorized" }.to_json, headers: { "Content-Type" => "application/json" } }
          else
            { status: 200, body: { orgs: [ { sourcedId: "org-1" } ] }.to_json, headers: { "Content-Type" => "application/json" } }
          end
        end

      orgs = client.get_all_orgs
      expect(orgs.length).to eq(1)
      # Token requested once for initial (cache miss) + once for refresh
      expect(token_stub).to have_been_requested.times(2)
    end

    it "raises error if retry also fails with 401" do
      stub_request(:post, "#{base_url}/token")
        .to_return(
          status: 200,
          body: { access_token: "bad_token", expires_in: 3600 }.to_json,
          headers: { "Content-Type" => "application/json" }
        )

      stub_request(:get, "#{base_url}/ims/oneroster/v1p1/orgs")
        .with(query: { limit: 100, offset: 0 })
        .to_return(
          status: 401,
          body: { error: "Unauthorized" }.to_json,
          headers: { "Content-Type" => "application/json" }
        )

      expect { client.get_all_orgs }.to raise_error(OneRosterError) { |e|
        expect(e.status_code).to eq(401)
      }
    end
  end
end
