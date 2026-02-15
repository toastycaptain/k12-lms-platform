require "rails_helper"

RSpec.describe AuditLogger do
  let(:tenant) { create(:tenant) }
  let(:current_user) { create(:user, tenant: tenant) }
  let(:explicit_actor) { create(:user, tenant: tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }

  before do
    Current.tenant = tenant
    Current.user = current_user
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe ".log" do
    it "creates an audit log record when tenant is present" do
      expect {
        described_class.log(
          event_type: "course.viewed",
          actor: current_user,
          auditable: course,
          metadata: { source: "spec" }
        )
      }.to change(AuditLog.unscoped, :count).by(1)

      log = AuditLog.unscoped.order(:id).last
      expect(log.tenant_id).to eq(tenant.id)
      expect(log.actor_id).to eq(current_user.id)
      expect(log.auditable).to eq(course)
      expect(log.event_type).to eq("course.viewed")
      expect(log.metadata).to eq({ "source" => "spec" })
    end

    it "uses Current.user when actor is not provided" do
      described_class.log(event_type: "session.login")

      log = AuditLog.unscoped.order(:id).last
      expect(log.actor_id).to eq(current_user.id)
    end

    it "uses the explicit actor when one is provided" do
      described_class.log(event_type: "session.impersonate", actor: explicit_actor)

      log = AuditLog.unscoped.order(:id).last
      expect(log.actor_id).to eq(explicit_actor.id)
    end

    it "returns nil and does not create a record when tenant is blank" do
      Current.tenant = nil
      result = nil

      expect {
        result = described_class.log(event_type: "ignored.event")
      }.not_to change(AuditLog.unscoped, :count)

      expect(result).to be_nil
    end

    it "captures request metadata when request is provided" do
      request = instance_double(
        ActionDispatch::Request,
        request_id: "req-123",
        remote_ip: "127.0.0.1",
        user_agent: "TestAgent"
      )

      described_class.log(event_type: "request.recorded", request: request)

      log = AuditLog.unscoped.order(:id).last
      expect(log.request_id).to eq("req-123")
      expect(log.ip_address).to eq("127.0.0.1")
      expect(log.user_agent).to eq("TestAgent")
    end

    it "normalizes nil metadata to an empty hash" do
      described_class.log(event_type: "metadata.nil", metadata: nil)

      log = AuditLog.unscoped.order(:id).last
      expect(log.metadata).to eq({})
    end

    it "rescues StandardError, logs, and returns nil" do
      allow(AuditLog).to receive(:create!).and_raise(StandardError, "boom")
      allow(Rails.logger).to receive(:error)

      expect(described_class.log(event_type: "failing.event")).to be_nil
      expect(Rails.logger).to have_received(:error).with(
        /audit_log_failed event_type=failing.event error=StandardError: boom/
      )
    end

    it "normalizes ActionController::Parameters metadata via to_unsafe_h" do
      metadata = ActionController::Parameters.new(key: "value")
      described_class.log(event_type: "params.metadata", metadata: metadata)

      log = AuditLog.unscoped.order(:id).last
      expect(log.metadata).to eq({ "key" => "value" })
    end
  end
end
