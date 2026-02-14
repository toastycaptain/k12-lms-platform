require "rails_helper"

RSpec.describe DataRetentionEnforcementJob, type: :job do
  let(:tenant) { create(:tenant) }
  let(:user) { create(:user, tenant: tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "#perform" do
    context "with delete action" do
      it "deletes old audit log records" do
        policy = create(:data_retention_policy, tenant: tenant, created_by: user,
          entity_type: "audit_log", action: "delete", retention_days: 30)

        old_log = create(:audit_log, tenant: tenant, user: user, action: "create")
        old_log.update_columns(created_at: 60.days.ago)
        recent_log = create(:audit_log, tenant: tenant, user: user, action: "create")

        described_class.new.perform(policy.id)

        expect(AuditLog.where(id: old_log.id)).not_to exist
        expect(AuditLog.where(id: recent_log.id)).to exist
      end
    end

    context "with archive action" do
      it "archives old audit log records" do
        policy = create(:data_retention_policy, tenant: tenant, created_by: user,
          entity_type: "audit_log", action: "archive", retention_days: 30)

        old_log = create(:audit_log, tenant: tenant, user: user, action: "create")
        old_log.update_columns(created_at: 60.days.ago)

        described_class.new.perform(policy.id)

        old_log.reload
        expect(old_log.archived_at).to be_present
      end
    end

    context "with anonymize action" do
      it "nullifies user_id on old audit log records" do
        policy = create(:data_retention_policy, tenant: tenant, created_by: user,
          entity_type: "audit_log", action: "anonymize", retention_days: 30)

        old_log = create(:audit_log, tenant: tenant, user: user, action: "create")
        old_log.update_columns(created_at: 60.days.ago)

        described_class.new.perform(policy.id)

        old_log.reload
        expect(old_log.user_id).to be_nil
      end
    end
  end
end
